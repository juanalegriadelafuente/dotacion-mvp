// src/app/api/san/mix/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type DayInput = {
  open: boolean;
  hoursOpen?: number;
  requiredPeople: number;
  overlapMinutes: number;
  breakMinutes: number;
};

type AllowedJornadas = {
  allow_6x1: boolean;
  allow_5x2: boolean;
  allow_4x3: boolean;
  allow_pt_weekend: boolean;
  // Jornadas excepcionales (requieren autorización del establecimiento)
  allow_2x2: boolean;
  allow_3x3: boolean;
};

function n0(x: any) {
  const v = Number(x);
  return Number.isFinite(v) ? v : 0;
}

function uniqueSorted(nums: number[]) {
  return Array.from(new Set(nums)).sort((a, b) => b - a);
}

function cutoffRuleFilterContracts(contracts: number[], now = new Date()) {
  // Ley 21.561: jornada máx baja a 42h el 26 abr 2026
  const cutoff = new Date("2026-04-26T00:00:00-03:00");
  const allow44 = now.getTime() < cutoff.getTime();
  return contracts.filter((h) => (h === 44 ? allow44 : true));
}

function computePtShareFromItems(items: any[], threshold = 30) {
  let head = 0;
  let pt = 0;
  for (const it of items ?? []) {
    const c = Math.max(0, n0(it.count));
    head += c;
    const isPt =
      it.isPt === true ||
      String(it.jornada) === "PT_WE" ||
      n0(it.hoursPerWeek) < threshold;
    if (isPt) pt += c;
  }
  return head > 0 ? pt / head : 0;
}

function scoreHospitalMix(m: any, ptShare: number) {
  const slackAbs = Math.abs(n0(m.slackHours));
  const head = Math.max(0, n0(m.headcount));
  return ptShare * 1_000_000 + slackAbs * 10_000 + head * 10;
}

async function callCalculate(req: Request, payload: any) {
  const url = new URL(req.url);
  const calcUrl = `${url.origin}/api/calculate`;
  const r = await fetch(calcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await r.json().catch(() => null);
  return { ok: r.ok && data?.ok, data, status: r.status };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const scenarioMaxWeekHours = Math.max(1, n0(body?.scenario?.maxWeekHours ?? 42));

    const days = body?.days as Record<DayKey, DayInput>;
    if (!days || typeof days !== "object") {
      return NextResponse.json(
        { ok: false, error: "Falta days (horario por día)." },
        { status: 400 }
      );
    }

    const rawContracts = Array.isArray(body?.allowedContracts)
      ? body.allowedContracts.map((x: any) => Math.round(n0(x))).filter((x: number) => x > 0)
      : [44, 42, 40, 30, 20];

    const allowedContracts = cutoffRuleFilterContracts(uniqueSorted(rawContracts));

    const jornadasIn = body?.allowedJornadas ?? {};
    const jornadas: AllowedJornadas = {
      allow_6x1:         !!jornadasIn.allow_6x1,
      allow_5x2:         !!jornadasIn.allow_5x2,
      allow_4x3:         !!jornadasIn.allow_4x3,
      allow_pt_weekend:  !!jornadasIn.allow_pt_weekend,
      allow_2x2:         !!jornadasIn.allow_2x2,
      allow_3x3:         !!jornadasIn.allow_3x3,
    };

    // Default: si desmarca todo FT, activar los tres principales
    const hasAnyFt = jornadas.allow_6x1 || jornadas.allow_5x2 || jornadas.allow_4x3;
    if (!hasAnyFt && !jornadas.allow_pt_weekend) {
      jornadas.allow_6x1 = true;
      jornadas.allow_5x2 = true;
      jornadas.allow_4x3 = true;
    }

    const ptMaxShare = Math.max(0, Math.min(1, n0(body?.ptMaxShare ?? 0.25)));
    const fullTimeThresholdHours = 30;

    const contracts = allowedContracts.map((h: number) => ({ name: `${h}h`, hoursPerWeek: h }));

    // Construir preferences base — jornadas excepcionales se pasan como flags adicionales
    // que el motor de cálculo puede o no interpretar según versión.
    const basePreferences = {
      strategy: "stable",
      allow_6x1:         jornadas.allow_6x1,
      allow_5x2:         jornadas.allow_5x2,
      allow_4x3:         jornadas.allow_4x3,
      allow_pt_weekend:  false, // FT-only en primera pasada
      pt_weekend_strict: true,
      // Excepcionales — pasadas como flags; el motor las ignora si no las conoce
      allow_2x2: jornadas.allow_2x2,
      allow_3x3: jornadas.allow_3x3,
    };

    const basePayload = {
      fullHoursPerWeek: scenarioMaxWeekHours,
      fullTimeThresholdHours,
      days,
      contracts,
      preferences: basePreferences,
      debugNonce: Date.now(),
    };

    // ── Pasada 1: FT-only ─────────────────────────────────────────────────
    let first = await callCalculate(req, basePayload);
    let usedPt = false;
    let calc = first;

    const firstHasMixes =
      first.ok &&
      Array.isArray(first.data?.result?.mixes) &&
      first.data.result.mixes.length > 0;

    // ── Pasada 2: habilitar PT si FT-only no produce resultado ────────────
    if (!firstHasMixes) {
      if (!jornadas.allow_pt_weekend) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "No se encontró mix FT-only con las jornadas/contratos actuales " +
              "y PT fin de semana está deshabilitado. Habilita PT o ajusta jornadas/contratos.",
          },
          { status: 400 }
        );
      }

      usedPt = true;
      calc = await callCalculate(req, {
        ...basePayload,
        preferences: { ...basePreferences, allow_pt_weekend: true },
        debugNonce: Date.now(),
      });

      if (!calc.ok) {
        return NextResponse.json(
          { ok: false, error: calc.data?.error ?? `Error dotadora (HTTP ${calc.status})` },
          { status: 400 }
        );
      }
    }

    const base = calc.data.result;
    const mixesIn = Array.isArray(base?.mixes) ? base.mixes : [];

    // Enriquecer con métricas hospitalarias
    const mixesEnriched = mixesIn.map((m: any) => {
      const ptShare = computePtShareFromItems(m.items ?? [], fullTimeThresholdHours);
      const scoreHosp = scoreHospitalMix(m, ptShare);
      return { ...m, ptShare, scoreHosp };
    });

    // Filtrar por ptMaxShare si usamos PT
    const filtered = usedPt
      ? mixesEnriched.filter((m: any) => m.ptShare <= ptMaxShare)
      : mixesEnriched;
    const pool = filtered.length ? filtered : mixesEnriched;

    pool.sort((a: any, b: any) => a.scoreHosp - b.scoreHosp);

    const mixesOut = pool.slice(0, 5).map((m: any) => {
      const { scoreHosp, ...rest } = m;
      return rest;
    });

    // Warnings
    const warnings: string[] = Array.isArray(base?.warnings) ? [...base.warnings] : [];
    if (!usedPt) {
      warnings.unshift("Mix FT-only encontrado (sin PT).");
    }
    if (usedPt && !filtered.length) {
      warnings.unshift(
        `Ningún mix cumple ptShare ≤ ${(ptMaxShare * 100).toFixed(0)}% — mostrando todos.`
      );
    }
    if (jornadas.allow_2x2 || jornadas.allow_3x3) {
      warnings.push("Jornadas excepcionales habilitadas: verificar autorización del establecimiento.");
    }

    return NextResponse.json(
      {
        ok: true,
        result: {
          scenarioMaxWeekHours,
          contractsUsed: contracts,
          jornadasUsed: {
            ...jornadas,
            allow_pt_weekend: usedPt,
          },
          ptMaxShare,
          requiredHours: base.requiredHours,
          fte: base.fte,
          demandByDay: base.demandByDay,
          warnings,
          mixes: mixesOut,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Error inesperado" },
      { status: 400 }
    );
  }
}
