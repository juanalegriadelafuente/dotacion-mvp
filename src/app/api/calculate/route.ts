// src/app/api/calculate/route.ts
import { NextResponse } from "next/server";

// Fuerza comportamiento dinámico (evita cachés raros en Vercel/Next)
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type AllowedJornadas = {
  FT_6X1: boolean;
  FT_5X2: boolean;
  FT_4X3: boolean;
  PT_WEEKEND: boolean;
  PT_3DAYS: boolean;
};

type CalcInput = {
  requestId?: string; // solo para debug/evitar cache
  fullHoursPerWeek: number;
  fullTimeThresholdHours: number;
  fullTimeSundayAvailability: number; // ej 0.5
  partTimeSundayAvailability: number; // ej 1.0
  allowedJornadas?: AllowedJornadas; // NUEVO
  days: Record<DayKey, DayInput>;
  contracts: ContractType[];
};

type MixItem = {
  count: number;
  contractName: string;
  hoursPerWeek: number;
  sundayFactor: number;
  jornada: string;
};

type Mix = {
  title: string;
  headcount: number;
  hoursTotal: number;
  slackHours: number;
  slackPct: number;
  sundayCap: number;
  sundayReq: number;
  sundayOk: boolean;
  items: MixItem[];
};

type CalcResult = {
  requestId?: string;
  covHours: number;
  breakHours: number;
  overlapHours: number;
  gapHours: number;
  requiredHours: number;
  fte: number;
  sundayReq: number;
  warnings: string[];
  mixes: Mix[];
};

type CalcResponse = { ok: true; result: CalcResult } | { ok: false; error: string };

// -------------------------
// Rate limit simple (MVP)
// -------------------------
const rl = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_REQ = 60;

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

function rateLimitOrThrow(req: Request) {
  const ip = getClientIp(req);
  const now = Date.now();
  const cur = rl.get(ip);
  if (!cur) {
    rl.set(ip, { count: 1, ts: now });
    return;
  }
  if (now - cur.ts > WINDOW_MS) {
    rl.set(ip, { count: 1, ts: now });
    return;
  }
  cur.count += 1;
  if (cur.count > MAX_REQ) {
    throw new Error("Rate limit excedido. Intenta nuevamente en 1 minuto.");
  }
}

function isFiniteNum(x: any) {
  return typeof x === "number" && Number.isFinite(x);
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function normalizeContracts(contracts: ContractType[]) {
  const out = (contracts ?? [])
    .map((c) => ({
      name: String(c?.name ?? "").trim() || "Contrato",
      hoursPerWeek: Number(c?.hoursPerWeek ?? 0),
    }))
    .filter((c) => Number.isFinite(c.hoursPerWeek) && c.hoursPerWeek > 0)
    .map((c) => ({ ...c, hoursPerWeek: Math.round(c.hoursPerWeek * 100) / 100 }));

  const seen = new Set<string>();
  const dedup: ContractType[] = [];
  for (const c of out) {
    const k = `${c.name}__${c.hoursPerWeek}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(c);
  }
  return dedup;
}

function defaultAllowedJornadas(): AllowedJornadas {
  return {
    FT_6X1: true,
    FT_5X2: true,
    FT_4X3: true,
    PT_WEEKEND: true,
    PT_3DAYS: true,
  };
}

function validateInput(input: any): asserts input is CalcInput {
  if (!input || typeof input !== "object") throw new Error("Input inválido.");

  const {
    fullHoursPerWeek,
    fullTimeThresholdHours,
    fullTimeSundayAvailability,
    partTimeSundayAvailability,
    days,
    contracts,
  } = input;

  if (!isFiniteNum(fullHoursPerWeek) || fullHoursPerWeek <= 0) throw new Error("fullHoursPerWeek inválido.");
  if (!isFiniteNum(fullTimeThresholdHours) || fullTimeThresholdHours <= 0)
    throw new Error("fullTimeThresholdHours inválido.");

  if (!isFiniteNum(fullTimeSundayAvailability) || fullTimeSundayAvailability <= 0 || fullTimeSundayAvailability > 1.5)
    throw new Error("fullTimeSundayAvailability inválido (ej 0.5).");
  if (!isFiniteNum(partTimeSundayAvailability) || partTimeSundayAvailability <= 0 || partTimeSundayAvailability > 1.5)
    throw new Error("partTimeSundayAvailability inválido (ej 1.0).");

  if (!days || typeof days !== "object") throw new Error("days inválido.");

  const keys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  for (const k of keys) {
    const d = (days as any)[k];
    if (!d || typeof d !== "object") throw new Error(`Día ${k} inválido.`);
    if (typeof d.open !== "boolean") throw new Error(`Día ${k}.open inválido.`);
    for (const fld of ["hoursOpen", "requiredPeople", "shiftsPerDay", "overlapMinutes", "breakMinutes"] as const) {
      const v = (d as any)[fld];
      if (!isFiniteNum(v) || v < 0) throw new Error(`Día ${k}.${fld} inválido.`);
    }
  }

  if (!Array.isArray(contracts)) throw new Error("contracts inválido.");
}

// -----------------------------------
// Demanda semanal + brecha colación
// -----------------------------------
function computeDemand(days: Record<DayKey, DayInput>) {
  const order: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  let covHours = 0;
  let breakHours = 0;
  let overlapHours = 0;

  for (const k of order) {
    const d = days[k];
    if (!d.open) continue;

    const ppl = Math.max(0, d.requiredPeople);
    const hOpen = Math.max(0, d.hoursOpen);
    const S = Math.max(1, d.shiftsPerDay);

    covHours += ppl * hOpen;
    breakHours += ppl * S * (d.breakMinutes / 60);
    overlapHours += ppl * Math.max(0, S - 1) * (d.overlapMinutes / 60);
  }

  const gapHours = Math.max(0, breakHours - overlapHours);
  const requiredHours = covHours + gapHours;

  const sundayReq = days.sun?.open ? Math.max(0, days.sun.requiredPeople) : 0;

  return {
    covHours: round2(covHours),
    breakHours: round2(breakHours),
    overlapHours: round2(overlapHours),
    gapHours: round2(gapHours),
    requiredHours: round2(requiredHours),
    sundayReq: round2(sundayReq),
  };
}

// -----------------------------------
// Jornadas (variantes) según política
// -----------------------------------
type JornadaKind = "FT_5X2" | "FT_6X1" | "FT_4X3" | "PT_WEEKEND" | "PT_3DAYS";

type ContractVariant = {
  baseName: string;
  hoursPerWeek: number;
  jornada: JornadaKind;
  jornadaLabel: string;
  sundayFactor: number;
  isPT: boolean;
  isCoreFT: boolean;
};

function buildVariants(input: CalcInput, contracts: ContractType[], allowed: AllowedJornadas) {
  const { fullTimeThresholdHours, fullTimeSundayAvailability, partTimeSundayAvailability } = input;

  const variants: ContractVariant[] = [];

  for (const c of contracts) {
    const h = c.hoursPerWeek;

    // PT <= 20 -> preferimos weekend fijo si está permitido
    if (h <= 20) {
      if (allowed.PT_WEEKEND) {
        variants.push({
          baseName: c.name,
          hoursPerWeek: h,
          jornada: "PT_WEEKEND",
          jornadaLabel: "PT fin de semana (Sáb+Dom)",
          sundayFactor: partTimeSundayAvailability,
          isPT: true,
          isCoreFT: false,
        });
      } else if (allowed.PT_3DAYS) {
        variants.push({
          baseName: c.name,
          hoursPerWeek: h,
          jornada: "PT_3DAYS",
          jornadaLabel: "PT 3 días (flex)",
          sundayFactor: partTimeSundayAvailability,
          isPT: true,
          isCoreFT: false,
        });
      }
      continue;
    }

    // PT < umbral
    if (h < fullTimeThresholdHours) {
      if (allowed.PT_3DAYS) {
        variants.push({
          baseName: c.name,
          hoursPerWeek: h,
          jornada: "PT_3DAYS",
          jornadaLabel: "PT 3 días (flex)",
          sundayFactor: partTimeSundayAvailability,
          isPT: true,
          isCoreFT: false,
        });
      }
      continue;
    }

    // FT >= umbral: 40 horas puede ir 4/5/6 días (según política)
    if (allowed.FT_5X2) {
      variants.push({
        baseName: c.name,
        hoursPerWeek: h,
        jornada: "FT_5X2",
        jornadaLabel: "5x2",
        sundayFactor: fullTimeSundayAvailability,
        isPT: false,
        isCoreFT: true,
      });
    }
    if (allowed.FT_6X1) {
      variants.push({
        baseName: c.name,
        hoursPerWeek: h,
        jornada: "FT_6X1",
        jornadaLabel: "6x1",
        sundayFactor: fullTimeSundayAvailability,
        isPT: false,
        isCoreFT: true,
      });
    }
    if (allowed.FT_4X3 && h <= 40) {
      variants.push({
        baseName: c.name,
        hoursPerWeek: h,
        jornada: "FT_4X3",
        jornadaLabel: "4x3",
        sundayFactor: fullTimeSundayAvailability,
        isPT: false,
        isCoreFT: true,
      });
    }
  }

  // Orden para favorecer cuerpo base
  variants.sort((a, b) => Number(b.isCoreFT) - Number(a.isCoreFT) || b.hoursPerWeek - a.hoursPerWeek);
  return variants;
}

// -----------------------------------
// Scoring: que "piense como empresa"
// -----------------------------------
type RawMix = {
  counts: number[];
  hoursTotal: number;
  headcount: number;
  sundayCap: number;
  ptCount: number;
  coreCount: number;
  ptHours: number;
};

function scoreMix(
  family: "balanced" | "min_people" | "max_sunday",
  mix: RawMix,
  demand: { requiredHours: number; sundayReq: number },
  input: CalcInput
) {
  const required = demand.requiredHours;
  const slack = mix.hoursTotal - required;
  const slackPct = required > 0 ? slack / required : 0;
  const sundaySlack = mix.sundayCap - demand.sundayReq;

  const head = mix.headcount;
  const ptShareH = mix.hoursTotal > 0 ? mix.ptHours / mix.hoursTotal : 0;
  const ptShareC = head > 0 ? mix.ptCount / head : 0;

  // “cuerpo base” esperado
  const fteBase = required / input.fullHoursPerWeek;
  const desiredCore = Math.max(1, Math.round(fteBase));
  const coreDeficit = Math.max(0, desiredCore - mix.coreCount);

  let s = 0;

  // cumplir horas sin pasarse demasiado
  s -= Math.abs(slack) * 2.2;
  s -= Math.max(0, slackPct - 0.30) * 220; // holgura muy alta castiga
  s -= head * 22; // demasiada gente castiga

  // domingo
  if (demand.sundayReq > 0) {
    if (sundaySlack < 0) s -= 7000 + Math.abs(sundaySlack) * 1200; // no cumple
    s -= Math.max(0, sundaySlack) * 35; // no sobredimensionar domingo
  }

  // Preferencia fuerte: evitar "puro PT"
  s -= Math.max(0, ptShareH - 0.45) * 1700;
  s -= Math.max(0, ptShareC - 0.50) * 1500;

  // exigir core (suave pero fuerte)
  s -= coreDeficit * 1100;

  // Familias
  if (family === "balanced") {
    // nada extra: ya está calibrado
  } else if (family === "min_people") {
    s -= head * 85;
    s -= Math.max(0, slack) * 1.5;
  } else if (family === "max_sunday") {
    s -= Math.max(0, -sundaySlack) * 4000;
    s -= coreDeficit * 700;
    s -= Math.max(0, ptShareH - 0.55) * 800;
  }

  // premio por estabilidad razonable
  if (mix.coreCount >= 1 && slackPct <= 0.22) s += 160;

  return s;
}

function keyFromCounts(counts: number[]) {
  return counts.join("|");
}

function buildMix(variants: ContractVariant[], counts: number[], demand: { requiredHours: number; sundayReq: number }): Mix {
  let headcount = 0;
  let hoursTotal = 0;
  let sundayCap = 0;

  const items: MixItem[] = [];
  for (let i = 0; i < variants.length; i++) {
    const c = counts[i];
    if (!c) continue;
    const v = variants[i];
    headcount += c;
    hoursTotal += c * v.hoursPerWeek;
    sundayCap += c * v.sundayFactor;

    items.push({
      count: c,
      contractName: v.baseName,
      hoursPerWeek: v.hoursPerWeek,
      sundayFactor: round2(v.sundayFactor),
      jornada: v.jornadaLabel,
    });
  }

  const slack = hoursTotal - demand.requiredHours;
  const slackPct = demand.requiredHours > 0 ? slack / demand.requiredHours : 0;

  return {
    title: "",
    headcount,
    hoursTotal: round2(hoursTotal),
    slackHours: round2(slack),
    slackPct,
    sundayCap: round2(sundayCap),
    sundayReq: demand.sundayReq,
    sundayOk: sundayCap + 1e-9 >= demand.sundayReq,
    items,
  };
}

function generateMixes(
  variantsAll: ContractVariant[],
  demand: { requiredHours: number; sundayReq: number },
  input: CalcInput
) {
  // si no hay variantes -> no hay solución
  if (variantsAll.length === 0) return [];

  // limitar tamaño
  const variants = variantsAll.slice(0, 12);

  const required = demand.requiredHours;
  const minHours = Math.min(...variants.map((v) => v.hoursPerWeek));
  const maxHead = clamp(Math.ceil(required / Math.max(1, minHours)) + 8, 6, 70);
  const maxPer = variants.map((v) => clamp(Math.ceil(required / v.hoursPerWeek) + 8, 0, 70));

  const families: ("balanced" | "min_people" | "max_sunday")[] = ["balanced", "min_people", "max_sunday"];
  const store = new Map<string, { score: number; counts: number[] }[]>();
  for (const f of families) store.set(f, []);

  const maxH = Math.max(...variants.map((v) => v.hoursPerWeek));
  const maxSunday = Math.max(...variants.map((v) => v.sundayFactor));
  const counts = new Array(variants.length).fill(0);

  function evalAndStore() {
    let head = 0;
    let hoursTotal = 0;
    let sundayCap = 0;
    let ptCount = 0;
    let coreCount = 0;
    let ptHours = 0;

    for (let i = 0; i < variants.length; i++) {
      const c = counts[i];
      if (!c) continue;
      const v = variants[i];
      head += c;
      hoursTotal += c * v.hoursPerWeek;
      sundayCap += c * v.sundayFactor;
      if (v.isPT) {
        ptCount += c;
        ptHours += c * v.hoursPerWeek;
      }
      if (v.isCoreFT) coreCount += c;
    }

    if (head === 0 || head > maxHead) return;
    if (hoursTotal + 1e-9 < required) return;
    if (demand.sundayReq > 0 && sundayCap + 1e-9 < demand.sundayReq) return;

    const raw: RawMix = { counts: [...counts], hoursTotal, headcount: head, sundayCap, ptCount, coreCount, ptHours };

    for (const fam of families) {
      const s = scoreMix(fam, raw, demand, input);
      const arr = store.get(fam)!;
      arr.push({ score: s, counts: raw.counts });
      arr.sort((a, b) => b.score - a.score);
      if (arr.length > 60) arr.length = 60;
    }
  }

  function rec(i: number, headSoFar: number, hoursSoFar: number, sundaySoFar: number) {
    const headLeft = maxHead - headSoFar;

    // poda horas
    if (hoursSoFar + headLeft * maxH + 1e-9 < required) return;

    // poda domingo
    if (demand.sundayReq > 0 && sundaySoFar + headLeft * maxSunday + 1e-9 < demand.sundayReq) return;

    if (i === variants.length) {
      evalAndStore();
      return;
    }

    const v = variants[i];
    const maxC = maxPer[i];

    // limitar si ya sobramos mucho
    const cap = Math.min(maxC, hoursSoFar > required ? 5 : maxC);

    for (let c = 0; c <= cap; c++) {
      counts[i] = c;
      rec(i + 1, headSoFar + c, hoursSoFar + c * v.hoursPerWeek, sundaySoFar + c * v.sundayFactor);
    }
    counts[i] = 0;
  }

  rec(0, 0, 0, 0);

  // construir salida: más mixes y separados por familias
  const seen = new Set<string>();
  const out: Mix[] = [];

  const order = [
    { fam: "balanced" as const, title: "Recomendado (balanceado)" },
    { fam: "min_people" as const, title: "Alternativa (menos personas)" },
    { fam: "max_sunday" as const, title: "Alternativa (mejor domingo)" },
  ];

  for (const block of order) {
    const arr = store.get(block.fam) ?? [];
    for (const cand of arr) {
      const k = keyFromCounts(cand.counts);
      if (seen.has(k)) continue;
      seen.add(k);

      const mix = buildMix(variants, cand.counts, demand);
      mix.title = block.title;
      out.push(mix);

      if (out.length >= 15) break;
    }
    if (out.length >= 15) break;
  }

  return out;
}

// -------------------------
// Handler
// -------------------------
export async function POST(req: Request) {
  try {
    rateLimitOrThrow(req);

    const input = (await req.json()) as any;

    // seguridad mínima: payload gigante
    const inputSize = input ? JSON.stringify(input).length : 0;
    if (inputSize > 250_000) {
      return NextResponse.json({ ok: false, error: "Payload demasiado grande." }, { status: 413 });
    }

    validateInput(input);

    const allowed = { ...defaultAllowedJornadas(), ...(input.allowedJornadas ?? {}) };

    const contracts = normalizeContracts(input.contracts);
    if (contracts.length === 0) throw new Error("Debes ingresar al menos 1 contrato válido.");

    const demand = computeDemand(input.days);

    const variants = buildVariants(input, contracts, allowed);

    const mixes = generateMixes(variants, demand, input);

    const warnings: string[] = [];
    if (demand.gapHours > 0) {
      warnings.push(`Break gap detected: breaks=${demand.breakHours}h, overlap=${demand.overlapHours}h, gap=${demand.gapHours}h.`);
    }

    if (mixes.length === 0) {
      warnings.push(
        "No se encontraron mixes que cumplan horas + domingo con tu política de jornadas. Prueba habilitando más jornadas o agregando un contrato intermedio (30/36)."
      );
    }

    const requiredHours = demand.requiredHours;
    const fte = input.fullHoursPerWeek > 0 ? requiredHours / input.fullHoursPerWeek : 0;

    const result: CalcResult = {
      requestId: input.requestId,
      covHours: demand.covHours,
      breakHours: demand.breakHours,
      overlapHours: demand.overlapHours,
      gapHours: demand.gapHours,
      requiredHours: demand.requiredHours,
      fte: round2(fte),
      sundayReq: demand.sundayReq,
      warnings,
      mixes,
    };

    const res = NextResponse.json({ ok: true, result } as CalcResponse, { status: 200 });
    // anti-cache duro
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message ?? "Error" } as CalcResponse, { status: 400 });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  }
}