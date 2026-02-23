// src/app/api/calculate/route.ts
import { NextResponse } from "next/server";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type DayInput = {
  open: boolean;
  hoursOpen: number;
  requiredPeople: number;
  shiftsPerDay: number;
  overlapMinutes: number;
  breakMinutes: number;
};

type ContractType = { name: string; hoursPerWeek: number };

type CalcInput = {
  fullHoursPerWeek: number;
  fullTimeThresholdHours: number;
  fullTimeSundayAvailability: number;
  partTimeSundayAvailability: number;
  days: Record<DayKey, DayInput>;
  contracts: ContractType[];
  preferences?: any; // lo leemos “tolerante” por compatibilidad
  debugNonce?: number;
};

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function safeNum(x: any, def = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

function parseBoolLike(v: any, defaultValue: boolean) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "yes" || s === "true" || s === "1") return true;
    if (s === "no" || s === "false" || s === "0") return false;
  }
  if (typeof v === "number") return v !== 0;
  return defaultValue;
}

function jornadaLabel(hoursPerWeek: number, threshold: number) {
  if (hoursPerWeek <= 20) return "PT fin de semana (Sáb+Dom)";
  if (hoursPerWeek < threshold) return "PT (parcial)";
  if (hoursPerWeek <= 40) return "Full (40h: 4/5/6 días)";
  if (hoursPerWeek <= 42) return "Full (42h: 5x2 o 6x1)";
  return "Full (jornada variable)";
}

function sundayFactorForContract(hoursPerWeek: number, threshold: number, fullSunday: number, partSunday: number) {
  return hoursPerWeek >= threshold ? fullSunday : partSunday;
}

function computeWeeklyNeed(days: Record<DayKey, DayInput>) {
  let baseHours = 0;
  let breakHours = 0;
  let overlapHours = 0;

  const keys = Object.keys(days) as DayKey[];
  for (const k of keys) {
    const d = days[k];
    if (!d?.open) continue;

    const hoursOpen = Math.max(0, safeNum(d.hoursOpen, 0));
    const people = Math.max(0, safeNum(d.requiredPeople, 0));

    const brk = Math.max(0, safeNum(d.breakMinutes, 0)) / 60;
    const ov = Math.max(0, safeNum(d.overlapMinutes, 0)) / 60;

    baseHours += hoursOpen * people;
    breakHours += brk * people;
    overlapHours += ov * people;
  }

  const gapHours = Math.max(0, breakHours - overlapHours);
  const requiredHours = baseHours + gapHours;

  const sundayReq = days.sun?.open ? Math.max(0, safeNum(days.sun.requiredPeople, 0)) : 0;
  const saturdayReq = days.sat?.open ? Math.max(0, safeNum(days.sat.requiredPeople, 0)) : 0;

  return { baseHours, breakHours, overlapHours, gapHours, requiredHours, sundayReq, saturdayReq };
}

function generateCandidateMixes(contracts: ContractType[], requiredHours: number) {
  const clean = contracts
    .map((c) => ({ name: String(c.name || "").trim(), hoursPerWeek: Math.max(1, safeNum(c.hoursPerWeek, 0)) }))
    .filter((c) => c.name.length > 0 && c.hoursPerWeek > 0)
    .sort((a, b) => b.hoursPerWeek - a.hoursPerWeek);

  if (clean.length === 0) return [];

  const minHours = Math.min(...clean.map((c) => c.hoursPerWeek));
  const maxHeadcount = Math.min(60, Math.max(10, Math.ceil(requiredHours / Math.max(1, minHours)) + 8));
  const maxHours = requiredHours * 1.6;

  const maxCounts = clean.map((c) => Math.min(40, Math.ceil(requiredHours / c.hoursPerWeek) + 6));

  const results: Array<Array<{ contractName: string; hoursPerWeek: number; count: number }>> = [];

  function rec(i: number, current: any[], head: number, hours: number) {
    if (head > maxHeadcount) return;
    if (hours > maxHours) return;

    if (i === clean.length) {
      if (head === 0) return;
      if (hours >= requiredHours && hours <= maxHours) results.push(current.filter((x) => x.count > 0));
      return;
    }

    const c = clean[i];
    const maxC = maxCounts[i];

    for (let k = 0; k <= maxC; k++) {
      const newHead = head + k;
      const newHours = hours + k * c.hoursPerWeek;
      if (newHead > maxHeadcount) break;
      if (newHours > maxHours) break;

      const next = k > 0 ? [...current, { contractName: c.name, hoursPerWeek: c.hoursPerWeek, count: k }] : current;
      rec(i + 1, next, newHead, newHours);
    }
  }

  rec(0, [], 0, 0);

  results.sort((a, b) => {
    const ha = a.reduce((s, x) => s + x.count * x.hoursPerWeek, 0);
    const hb = b.reduce((s, x) => s + x.count * x.hoursPerWeek, 0);
    return Math.abs(ha - requiredHours) - Math.abs(hb - requiredHours);
  });

  return results.slice(0, 900);
}

function dedupeMixes(mixes: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const m of mixes) {
    const sig = (m.items || [])
      .slice()
      .sort((a: any, b: any) => String(a.contractName).localeCompare(String(b.contractName)))
      .map((it: any) => `${it.contractName}:${it.count}`)
      .join("|");
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(m);
  }
  return out;
}

export async function POST(req: Request) {
  let input: CalcInput;
  try {
    input = (await req.json()) as CalcInput;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const fullHoursPerWeek = Math.max(1, safeNum(input.fullHoursPerWeek, 42));
  const threshold = Math.max(1, safeNum(input.fullTimeThresholdHours, 30));
  const fullSunday = clamp01(safeNum(input.fullTimeSundayAvailability, 0.5));
  const partSunday = clamp01(safeNum(input.partTimeSundayAvailability, 1.0));

  if (!input.days || typeof input.days !== "object") {
    return NextResponse.json({ ok: false, error: "Falta days." }, { status: 400 });
  }
  if (!Array.isArray(input.contracts) || input.contracts.length === 0) {
    return NextResponse.json({ ok: false, error: "Debes definir al menos 1 contrato." }, { status: 400 });
  }

  const { baseHours, breakHours, overlapHours, gapHours, requiredHours, sundayReq, saturdayReq } =
    computeWeeklyNeed(input.days);

  const warnings: string[] = [];
  if (gapHours > 0) warnings.push("Hay brecha por colación: suele resolverse subiendo traslape o ajustando turnos.");
  if (requiredHours <= 0) warnings.push("No hay horas requeridas (revisa días abiertos y personas simultáneas).");

  // ✅ Compatibilidad: leemos tus campos reales del front
  const pref = input.preferences ?? {};
  const allowPtWeekend = parseBoolLike(
    pref.allow_pt_weekend ?? pref.ptWeekendAllowed,
    true
  );

  // Hard constraint: si NO quieres PT fin de semana -> fuera contratos <=20h
  const filteredContracts = input.contracts.filter((c) => {
    const h = Math.max(0, safeNum(c.hoursPerWeek, 0));
    if (!allowPtWeekend && h <= 20) return false;
    return true;
  });

  if (!allowPtWeekend) warnings.push("Preferencia activa: NO se permiten PT fin de semana (<=20h).");

  if (filteredContracts.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Con tus preferencias, no queda ningún contrato disponible. Revisa el set de contratos." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const candidates = generateCandidateMixes(filteredContracts, requiredHours);

  function scoreMix(mix: Array<{ contractName: string; hoursPerWeek: number; count: number }>) {
    let headcount = 0;
    let totalHours = 0;
    let sundayCap = 0;
    let ptWeekendCount = 0;

    for (const it of mix) {
      headcount += it.count;
      totalHours += it.count * it.hoursPerWeek;

      const sf = sundayFactorForContract(it.hoursPerWeek, threshold, fullSunday, partSunday);
      sundayCap += it.count * sf;

      if (it.hoursPerWeek <= 20) ptWeekendCount += it.count;
    }

    const slackHours = totalHours - requiredHours;
    const slackPct = requiredHours > 0 ? slackHours / requiredHours : 0;
    const sundayOk = sundayCap + 1e-9 >= sundayReq;

    // Penalizaciones fuertes: no cumplir horas o domingo
    let penalty = 0;
    if (slackHours < 0) penalty += 1_000_000 + Math.abs(slackHours) * 10_000;
    if (!sundayOk) penalty += 500_000 + (sundayReq - sundayCap) * 50_000;

    // ✅ visión empresa: no sobrecargar PT fin de semana si no hace falta
    const weekendNeed = Math.max(saturdayReq, sundayReq);
    const ptOver = ptWeekendCount - Math.ceil(weekendNeed || 0);
    if (ptOver > 0) penalty += ptOver * 90_000;
    if (weekendNeed <= 0 && ptWeekendCount > 0) penalty += 250_000 + ptWeekendCount * 80_000;

    // preferencia: balanceado (menos headcount + holgura razonable)
    const score = penalty + Math.abs(slackHours) * 1200 + headcount * 60;

    return { headcount, totalHours, slackHours, slackPct, sundayCap, sundayOk, ptWeekendCount, score };
  }

  const scored = candidates
    .map((mix) => {
      const s = scoreMix(mix);

      const items = mix
        .slice()
        .sort((a, b) => b.hoursPerWeek - a.hoursPerWeek)
        .map((it) => ({
          count: it.count,
          contractName: it.contractName,
          hoursPerWeek: it.hoursPerWeek,
          sundayFactor: sundayFactorForContract(it.hoursPerWeek, threshold, fullSunday, partSunday),
          jornada: jornadaLabel(it.hoursPerWeek, threshold),
        }));

      return {
        title: "Mix recomendado (balanceado)",
        score: s.score,
        headcount: s.headcount,
        hoursTotal: Math.round(s.totalHours * 10) / 10,
        slackHours: Math.round(s.slackHours * 10) / 10,
        slackPct: s.slackPct,
        sundayCap: Math.round(s.sundayCap * 100) / 100,
        sundayReq,
        sundayOk: s.sundayOk,
        items,
      };
    })
    .sort((a, b) => a.score - b.score);

  const mixes = dedupeMixes(scored).slice(0, 6).map((m, idx) => ({
    ...m,
    title: idx === 0 ? "Mix recomendado (balanceado)" : `Alternativa ${idx} (balanceada)`,
  }));

  const result = {
    baseHours: Math.round(baseHours * 10) / 10,
    breakHours: Math.round(breakHours * 10) / 10,
    overlapHours: Math.round(overlapHours * 10) / 10,
    gapHours: Math.round(gapHours * 10) / 10,
    requiredHours: Math.round(requiredHours * 10) / 10,
    covHours: mixes[0]?.hoursTotal ?? 0,
    fte: Math.round((requiredHours / fullHoursPerWeek) * 100) / 100,
    sundayReq,
    saturdayReq,
    warnings,
    mixes,
  };

  return NextResponse.json(
    { ok: true, result },
    { headers: { "Cache-Control": "no-store" } }
  );
}