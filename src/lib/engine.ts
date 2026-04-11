// src/lib/engine.ts — v3
// Motor completo para retail chileno
// Genera TODOS los mixes válidos, ordenables por headcount o costo
// Restricciones: Código del Trabajo Chile (Art. 22, 26, 28, 34, 38)

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayInput = {
  open: boolean;
  hoursOpen: number;
  requiredPeople: number;
  shiftsPerDay: number;
  overlapMinutes: number;
  breakMinutes: number;
};

export type ContractType = {
  name: string;
  hoursPerWeek: number;
  costPerHour?: number; // opcional — si viene, se calcula costo semanal
};

export type CalcInput = {
  fullHoursPerWeek: number;
  days: Record<DayKey, DayInput>;
  contracts: ContractType[];
  replacementFactor?: number;
  ptWeekdaysAllowed?: boolean;
};

export type MixItem = {
  count: number;
  contractName: string;
  hoursPerWeek: number;
  costPerHour?: number;
  jornadaId: string;
  jornadaName: string;
  sundayAvailability: number;
};

export type Mix = {
  id: number;
  headcount: number;
  hoursTotal: number;
  slackHours: number;
  slackPct: number;
  sundayOk: boolean;
  sundayCap: number;
  sundayReq: number;
  weeklyCost?: number;
  costPerHourEffective?: number;
  ptShare: number;
  items: MixItem[];
  isOptimal: boolean;   // mejor headcount con domingo OK
  isCheapest: boolean;  // menor costo con domingo OK
};

export type CalcResult = {
  breakHours: number;
  overlapHours: number;
  gapHours: number;
  requiredHours: number;
  requiredHoursAdjusted: number;
  fte: number;
  fteAdjusted: number;
  replacementFactor: number;
  sundayReq: number;
  hasCosts: boolean;
  totalMixes: number;
  warnings: string[];
  mixes: Mix[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r2(x: number) { return Math.round(x * 100) / 100; }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

// ─── Jornadas legales Chile ───────────────────────────────────────────────────

type Jornada = {
  id: string;
  name: string;
  sundayAvailability: number;
  weekendOnly: boolean;
  weekdaysOnly: boolean;
  maxHours: number;
};

const JORNADAS: Jornada[] = [
  { id: "J_5X2",        name: "5×2",                       sundayAvailability: 0.20,  weekendOnly: false, weekdaysOnly: false, maxHours: 44 },
  { id: "J_6X1",        name: "6×1 (rotativo)",             sundayAvailability: 0.143, weekendOnly: false, weekdaysOnly: false, maxHours: 44 },
  { id: "J_4X3",        name: "4×3 (concentrada)",          sundayAvailability: 0.25,  weekendOnly: false, weekdaysOnly: false, maxHours: 40 },
  { id: "J_PT_WEEKEND", name: "PT fin de semana (Sáb+Dom)", sundayAvailability: 1.0,   weekendOnly: true,  weekdaysOnly: false, maxHours: 20 },
  { id: "J_PT_WEEKDAY", name: "PT días de semana (L–V)",    sundayAvailability: 0.0,   weekendOnly: false, weekdaysOnly: true,  maxHours: 20 },
];

function jornadasParaContrato(h: number, ptOk: boolean, hasSun: boolean): Jornada[] {
  if (h > 44) return [JORNADAS.find(j => j.id === "J_5X2")!];

  if (h > 20) {
    const out: Jornada[] = [JORNADAS.find(j => j.id === "J_5X2")!];
    if (h <= 44) out.push(JORNADAS.find(j => j.id === "J_6X1")!);
    if (h <= 40) out.push(JORNADAS.find(j => j.id === "J_4X3")!);
    return out;
  }

  // PT ≤20h
  const out: Jornada[] = [];
  if (hasSun)              out.push(JORNADAS.find(j => j.id === "J_PT_WEEKEND")!);
  if (ptOk || !hasSun)    out.push(JORNADAS.find(j => j.id === "J_PT_WEEKDAY")!);
  if (out.length === 0)    out.push(JORNADAS.find(j => j.id === "J_PT_WEEKEND")!);
  return out;
}

// ─── Demanda ──────────────────────────────────────────────────────────────────

function computeDemand(days: Record<DayKey, DayInput>) {
  const KEYS: DayKey[] = ["mon","tue","wed","thu","fri","sat","sun"];
  let totalHours = 0, sundayHours = 0, weekendHours = 0, weekdayHours = 0, openDays = 0;
  for (const k of KEYS) {
    const d = days[k];
    if (!d.open || d.hoursOpen <= 0 || d.requiredPeople <= 0) continue;
    const hp = d.requiredPeople * d.hoursOpen;
    totalHours += hp;
    openDays++;
    if (k === "sun") sundayHours = hp;
    if (k === "sat" || k === "sun") weekendHours += hp;
    else weekdayHours += hp;
  }
  return { totalHours, sundayHours, weekendHours, weekdayHours, openDays };
}

// ─── Colación ─────────────────────────────────────────────────────────────────

function computeBreaks(days: Record<DayKey, DayInput>) {
  const KEYS: DayKey[] = ["mon","tue","wed","thu","fri","sat","sun"];
  let bh = 0, oh = 0;
  for (const k of KEYS) {
    const d = days[k];
    if (!d.open) continue;
    bh += d.requiredPeople * (d.breakMinutes  / 60);
    oh += d.requiredPeople * (d.overlapMinutes / 60);
  }
  return { breakHours: bh, overlapHours: oh, gapHours: Math.max(0, bh - oh) };
}

// ─── Candidato expandido ──────────────────────────────────────────────────────

type Candidate = {
  contractName: string;
  hoursPerWeek: number;
  costPerHour?: number;
  jornadaId: string;
  jornadaName: string;
  sundayAvailability: number;
  weekendOnly: boolean;
  weekdaysOnly: boolean;
};

// ─── Construir mix ────────────────────────────────────────────────────────────

function buildMix(
  fullH: number,
  targetHours: number,
  sundayHours: number,
  weekendHours: number,
  weekdayHours: number,
  cands: Candidate[],
  counts: number[],
  id: number,
): Mix | null {
  let hoursTotal = 0, headcount = 0, sundayCapFTE = 0;
  let weekendCap = 0, weekdayCap = 0;
  let weeklyCost = 0; let hasCostData = true;
  const items: MixItem[] = [];

  for (let i = 0; i < cands.length; i++) {
    const n = counts[i] ?? 0;
    if (n <= 0) continue;
    const c = cands[i];
    headcount  += n;
    const horas = n * c.hoursPerWeek;
    hoursTotal += horas;
    sundayCapFTE += n * (c.hoursPerWeek / fullH) * c.sundayAvailability;

    const tot = weekendHours + weekdayHours;
    if (c.weekendOnly)      weekendCap += horas;
    else if (c.weekdaysOnly) weekdayCap += horas;
    else {
      const wr = tot > 0 ? weekendHours / tot : 0;
      weekendCap += horas * wr;
      weekdayCap += horas * (1 - wr);
    }

    if (c.costPerHour != null) weeklyCost += n * c.hoursPerWeek * c.costPerHour;
    else hasCostData = false;

    items.push({
      count: n,
      contractName: c.contractName,
      hoursPerWeek: c.hoursPerWeek,
      costPerHour: c.costPerHour,
      jornadaId: c.jornadaId,
      jornadaName: c.jornadaName,
      sundayAvailability: c.sundayAvailability,
    });
  }

  if (hoursTotal < targetHours) return null;
  if (headcount === 0)          return null;

  const slackHours = hoursTotal - targetHours;
  const slackPct   = targetHours > 0 ? slackHours / targetHours : 0;
  if (slackPct > 0.55) return null;

  const sundayReqFTE = fullH > 0 ? sundayHours / fullH : 0;
  const sundayOk     = sundayHours <= 0 || sundayCapFTE + 1e-9 >= sundayReqFTE;

  const ptHours = items
    .filter(it => it.hoursPerWeek <= 20)
    .reduce((s, it) => s + it.count * it.hoursPerWeek, 0);
  const ptShare = hoursTotal > 0 ? r2(ptHours / hoursTotal) : 0;

  return {
    id,
    headcount,
    hoursTotal:           r2(hoursTotal),
    slackHours:           r2(slackHours),
    slackPct:             r2(slackPct),
    sundayOk,
    sundayCap:            r2(sundayCapFTE),
    sundayReq:            r2(sundayReqFTE),
    weeklyCost:           hasCostData ? r2(weeklyCost) : undefined,
    costPerHourEffective: (hasCostData && hoursTotal > 0) ? r2(weeklyCost / hoursTotal) : undefined,
    ptShare,
    items,
    isOptimal:  false,
    isCheapest: false,
  };
}

// ─── Motor principal ──────────────────────────────────────────────────────────

export function calculate(input: CalcInput): CalcResult {
  const fullH = clamp(input.fullHoursPerWeek, 20, 60);
  const rf    = (input.replacementFactor && input.replacementFactor > 0) ? input.replacementFactor : 1.0;
  const ptOk  = input.ptWeekdaysAllowed ?? false;
  const warns: string[] = [];

  // 1. Demanda y colación
  const { totalHours, sundayHours, weekendHours, weekdayHours, openDays } = computeDemand(input.days);
  const { breakHours, overlapHours, gapHours } = computeBreaks(input.days);

  const effectiveHours = totalHours + gapHours;
  // TARGET REAL: incluye factor de reemplazo
  const targetHours    = r2(effectiveHours * rf);

  const hasSun = sundayHours > 0;
  const hasCosts = input.contracts.some(c => c.costPerHour != null && c.costPerHour > 0);

  if (openDays === 0)  warns.push("⚠️ Ningún día tiene demanda. Dibuja la curva de personas por tramo.");
  if (gapHours > 0)    warns.push(`⚠️ Brecha colación: ${r2(gapHours)}h extra. Aumenta el traslape.`);
  if (!hasSun)         warns.push("ℹ️ Sin demanda dominical — PT fin de semana no es necesario.");
  if (fullH > 44)      warns.push("⚠️ Jornada máxima legal en Chile es 44h (Art. 22 CT).");

  // 2. Expandir contratos × jornadas
  const cands: Candidate[] = [];
  for (const c of input.contracts) {
    if (c.hoursPerWeek <= 0 || !c.name) continue;
    for (const j of jornadasParaContrato(c.hoursPerWeek, ptOk, hasSun)) {
      if (c.hoursPerWeek > j.maxHours) continue;
      cands.push({
        contractName: c.name, hoursPerWeek: c.hoursPerWeek,
        costPerHour: c.costPerHour, jornadaId: j.id, jornadaName: j.name,
        sundayAvailability: j.sundayAvailability,
        weekendOnly: j.weekendOnly, weekdaysOnly: j.weekdaysOnly,
      });
    }
  }

  if (cands.length === 0) {
    warns.push("⚠️ Sin contratos válidos. Agrega al menos un contrato.");
    return emptyResult(rf, fullH, effectiveHours, targetHours, breakHours, overlapHours, gapHours, warns);
  }

  // Full primero (más eficientes), luego PT weekend, luego PT weekday
  cands.sort((a, b) => {
    const ra = a.weekendOnly ? 1 : a.weekdaysOnly ? 2 : 0;
    const rb = b.weekendOnly ? 1 : b.weekdaysOnly ? 2 : 0;
    if (ra !== rb) return ra - rb;
    return b.hoursPerWeek - a.hoursPerWeek;
  });

  const CAND   = cands.slice(0, 6);
  const limits = CAND.map(c => Math.min(60, Math.max(2, Math.ceil((targetHours / c.hoursPerWeek) * 1.4))));

  const MAX_ITERS = 800_000;
  let iters = 0, mixId = 0;
  const allMixes: Mix[] = [];
  const seen = new Set<string>();

  outer:
  for (let a = 0; a <= (limits[0]??0); a++)
  for (let b = 0; b <= (limits[1]??0); b++)
  for (let c2= 0; c2<= (limits[2]??0); c2++)
  for (let d = 0; d <= (limits[3]??0); d++) {
    if (++iters > MAX_ITERS) {
      warns.push("⚠️ Búsqueda acotada — algunos mixes pueden no aparecer. Reduce tipos de contrato.");
      break outer;
    }

    const counts = [a, b, c2, d, 0, 0];
    const mix = buildMix(fullH, targetHours, sundayHours, weekendHours, weekdayHours, CAND, counts, mixId++);
    if (!mix) continue;

    const sig = mix.items.map(it => `${it.jornadaId}|${it.contractName}|${it.count}`).sort().join(",");
    if (seen.has(sig)) continue;
    seen.add(sig);

    allMixes.push(mix);
    if (allMixes.length >= 5000) {
      warns.push("⚠️ Se encontraron más de 5.000 mixes — se muestran los mejores.");
      break outer;
    }
  }

  // Fallback
  if (allMixes.length === 0) {
    const fb = CAND.find(c => !c.weekendOnly && !c.weekdaysOnly) ?? CAND[0];
    if (fb) {
      const needed = Math.ceil(targetHours / fb.hoursPerWeek);
      const fallback = buildMix(fullH, targetHours, sundayHours, weekendHours, weekdayHours, [fb], [needed], 0);
      if (fallback) { fallback.isOptimal = true; allMixes.push(fallback); }
    }
    if (allMixes.length === 0) {
      warns.push("⚠️ No se encontró ningún mix válido. Revisa la configuración.");
      return emptyResult(rf, fullH, effectiveHours, targetHours, breakHours, overlapHours, gapHours, warns);
    }
  }

  // 3. Ordenar: domingo OK primero → headcount → slack → costo
  allMixes.sort((x, y) => {
    if (x.sundayOk !== y.sundayOk)       return x.sundayOk ? -1 : 1;
    if (x.headcount !== y.headcount)      return x.headcount - y.headcount;
    if (x.slackHours !== y.slackHours)   return x.slackHours - y.slackHours;
    if (x.weeklyCost != null && y.weeklyCost != null) return x.weeklyCost - y.weeklyCost;
    return 0;
  });

  // Marcar óptimo y más barato
  const firstOk = allMixes.find(m => m.sundayOk);
  if (firstOk) firstOk.isOptimal = true;

  if (hasCosts) {
    const okWithCost = allMixes.filter(m => m.sundayOk && m.weeklyCost != null);
    if (okWithCost.length > 0) {
      okWithCost.reduce((a, b) => (a.weeklyCost! <= b.weeklyCost! ? a : b)).isCheapest = true;
    }
  }

  // Advertencias sobre el óptimo
  if (firstOk && firstOk.ptShare > 0.35) {
    warns.push(`ℹ️ El mix óptimo tiene ${Math.round(firstOk.ptShare * 100)}% de horas PT — evalúa rotación y capacitación.`);
  }

  const fte = fullH > 0 ? r2(effectiveHours / fullH) : 0;
  const best = allMixes[0];

  return {
    breakHours:            r2(breakHours),
    overlapHours:          r2(overlapHours),
    gapHours:              r2(gapHours),
    requiredHours:         r2(effectiveHours),
    requiredHoursAdjusted: r2(targetHours),
    fte,
    fteAdjusted:           r2(fte * rf),
    replacementFactor:     rf,
    sundayReq:             best?.sundayReq ?? 0,
    hasCosts,
    totalMixes:            allMixes.length,
    warnings:              warns,
    mixes:                 allMixes,
  };
}

// ─── Resultado vacío ──────────────────────────────────────────────────────────

function emptyResult(
  rf: number, fullH: number,
  effectiveHours: number, targetHours: number,
  breakHours: number, overlapHours: number, gapHours: number,
  warnings: string[],
): CalcResult {
  const fte = fullH > 0 ? r2(effectiveHours / fullH) : 0;
  return {
    breakHours: r2(breakHours), overlapHours: r2(overlapHours), gapHours: r2(gapHours),
    requiredHours: r2(effectiveHours), requiredHoursAdjusted: r2(targetHours),
    fte, fteAdjusted: r2(fte * rf), replacementFactor: rf,
    sundayReq: 0, hasCosts: false, totalMixes: 0, warnings, mixes: [],
  };
}