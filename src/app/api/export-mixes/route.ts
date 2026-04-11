// src/lib/engine.ts — v4
// Fix crítico: validación de cobertura por día
// PT weekend solo cubre sábado y domingo
// PT weekday solo cubre lunes a viernes
// Full (5x2, 6x1, 4x3) distribuye en todos los días abiertos

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
  costPerHour?: number;
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
  coverageOk: boolean;       // true si TODOS los días abiertos tienen cobertura suficiente
  worstDayCoverage: number;  // mínima cobertura relativa entre todos los días abiertos (0-1)
  items: MixItem[];
  isOptimal: boolean;
  isCheapest: boolean;
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

const WEEKDAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
const WEEKEND:  DayKey[] = ["sat", "sun"];
const ALL_DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// ─── Jornadas ─────────────────────────────────────────────────────────────────

type Jornada = {
  id: string;
  name: string;
  sundayAvailability: number;
  // Qué días puede cubrir este tipo de jornada
  eligibleDays: "all" | "weekdays" | "weekend";
  maxHours: number;
};

const JORNADAS: Jornada[] = [
  { id: "J_5X2",        name: "5×2",                       sundayAvailability: 0.20,  eligibleDays: "all",      maxHours: 44 },
  { id: "J_6X1",        name: "6×1 (rotativo)",             sundayAvailability: 0.143, eligibleDays: "all",      maxHours: 44 },
  { id: "J_4X3",        name: "4×3 (concentrada)",          sundayAvailability: 0.25,  eligibleDays: "all",      maxHours: 40 },
  { id: "J_PT_WEEKEND", name: "PT fin de semana (Sáb+Dom)", sundayAvailability: 1.0,   eligibleDays: "weekend",  maxHours: 20 },
  { id: "J_PT_WEEKDAY", name: "PT días de semana (L–V)",    sundayAvailability: 0.0,   eligibleDays: "weekdays", maxHours: 20 },
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
  if (hasSun)           out.push(JORNADAS.find(j => j.id === "J_PT_WEEKEND")!);
  if (ptOk || !hasSun)  out.push(JORNADAS.find(j => j.id === "J_PT_WEEKDAY")!);
  if (out.length === 0) out.push(JORNADAS.find(j => j.id === "J_PT_WEEKEND")!);
  return out;
}

// ─── Demanda por día ──────────────────────────────────────────────────────────

type DayDemand = {
  key: DayKey;
  hoursRequired: number; // horas-persona requeridas ese día (con reemplazo)
  isWeekend: boolean;
  isOpen: boolean;
};

function computeDayDemands(
  days: Record<DayKey, DayInput>,
  rf: number,
): DayDemand[] {
  return ALL_DAYS.map(k => {
    const d = days[k];
    const open = d.open && d.hoursOpen > 0 && d.requiredPeople > 0;
    const raw  = open ? d.requiredPeople * d.hoursOpen : 0;
    // Brecha colación por día
    const gap  = open ? Math.max(0, (d.breakMinutes - d.overlapMinutes) / 60) * d.requiredPeople : 0;
    return {
      key: k,
      hoursRequired: r2((raw + gap) * rf),
      isWeekend: k === "sat" || k === "sun",
      isOpen: open,
    };
  });
}

// ─── Candidato expandido ──────────────────────────────────────────────────────

type Candidate = {
  contractName: string;
  hoursPerWeek: number;
  costPerHour?: number;
  jornadaId: string;
  jornadaName: string;
  sundayAvailability: number;
  eligibleDays: "all" | "weekdays" | "weekend";
  // Horas que aporta POR DÍA este tipo de contrato (por persona)
  // Para full: hoursPerWeek / daysWorked distribuidos en días elegibles
  // Para PT weekend: hoursPerWeek / 2 en Sáb+Dom
  // Para PT weekday: hoursPerWeek / 5 en L-V
  dailyHours: number;
};

function buildCandidates(
  contracts: ContractType[],
  ptOk: boolean,
  hasSun: boolean,
): Candidate[] {
  const out: Candidate[] = [];
  for (const c of contracts) {
    if (c.hoursPerWeek <= 0 || !c.name) continue;
    for (const j of jornadasParaContrato(c.hoursPerWeek, ptOk, hasSun)) {
      if (c.hoursPerWeek > j.maxHours) continue;
      let dailyHours: number;
      if (j.eligibleDays === "weekend")  dailyHours = c.hoursPerWeek / 2;
      else if (j.eligibleDays === "weekdays") dailyHours = c.hoursPerWeek / 5;
      else {
        // full: distribuye en los 7 días pero trabaja 5 o 6
        const daysWorked = j.id === "J_6X1" ? 6 : j.id === "J_4X3" ? 4 : 5;
        dailyHours = c.hoursPerWeek / daysWorked;
      }
      out.push({
        contractName: c.name,
        hoursPerWeek: c.hoursPerWeek,
        costPerHour: c.costPerHour,
        jornadaId: j.id,
        jornadaName: j.name,
        sundayAvailability: j.sundayAvailability,
        eligibleDays: j.eligibleDays,
        dailyHours: r2(dailyHours),
      });
    }
  }
  // Full primero (más eficientes), luego PT weekend, luego PT weekday
  out.sort((a, b) => {
    const ra = a.eligibleDays === "all" ? 0 : a.eligibleDays === "weekend" ? 1 : 2;
    const rb = b.eligibleDays === "all" ? 0 : b.eligibleDays === "weekend" ? 1 : 2;
    if (ra !== rb) return ra - rb;
    return b.hoursPerWeek - a.hoursPerWeek;
  });
  return out;
}

// ─── Construir y validar mix ──────────────────────────────────────────────────
//
// VALIDACIÓN CLAVE: para cada día abierto, verificamos que la suma de horas
// aportadas por los contratos elegibles para ese día sea >= hoursRequired del día.
//
// Contratos full (eligibleDays="all") distribuyen sus horas en días de semana
// y fin de semana proporcionalmente a la demanda.
// PT weekend solo cuenta en Sáb+Dom.
// PT weekday solo cuenta en L-V.

function buildMix(
  fullH: number,
  dayDemands: DayDemand[],
  totalTargetHours: number,
  cands: Candidate[],
  counts: number[],
  id: number,
): Mix | null {
  let hoursTotal = 0;
  let headcount  = 0;
  let weeklyCost = 0;
  let hasCostData = true;
  let sundayCapFTE = 0;
  const items: MixItem[] = [];

  // Cobertura por día: cuántas horas aporta este mix a cada día
  const coverageByDay: Partial<Record<DayKey, number>> = {};
  for (const dd of dayDemands) {
    if (dd.isOpen) coverageByDay[dd.key] = 0;
  }

  for (let i = 0; i < cands.length; i++) {
    const n = counts[i] ?? 0;
    if (n <= 0) continue;
    const c = cands[i];

    headcount  += n;
    const wkHours = n * c.hoursPerWeek;
    hoursTotal += wkHours;

    if (c.costPerHour != null) weeklyCost += wkHours * c.costPerHour;
    else hasCostData = false;

    sundayCapFTE += n * (c.hoursPerWeek / fullH) * c.sundayAvailability;

    // Sumar cobertura diaria por tipo de jornada
    for (const dd of dayDemands) {
      if (!dd.isOpen) continue;
      const covers =
        c.eligibleDays === "all"      ? true :
        c.eligibleDays === "weekend"  ? dd.isWeekend :
        /* weekdays */                  !dd.isWeekend;
      if (covers) {
        coverageByDay[dd.key] = (coverageByDay[dd.key] ?? 0) + n * c.dailyHours;
      }
    }

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

  if (headcount === 0) return null;

  // Validar cobertura total
  if (hoursTotal < totalTargetHours) return null;

  const slackHours = hoursTotal - totalTargetHours;
  const slackPct   = totalTargetHours > 0 ? slackHours / totalTargetHours : 0;
  if (slackPct > 0.55) return null; // demasiada holgura

  // ── VALIDACIÓN POR DÍA (el fix crítico) ──
  // Para cada día abierto, verificar que la cobertura >= demanda del día
  let coverageOk = true;
  let worstCoverage = 1;

  for (const dd of dayDemands) {
    if (!dd.isOpen || dd.hoursRequired <= 0) continue;
    const cap = coverageByDay[dd.key] ?? 0;
    const ratio = cap / dd.hoursRequired;
    if (ratio < worstCoverage) worstCoverage = ratio;
    if (cap < dd.hoursRequired - 0.01) {
      coverageOk = false;
    }
  }

  // Descartar mixes que no cubren algún día (coverage ratio < 0.5 = imposible)
  if (worstCoverage < 0.5) return null;

  // Domingo
  const sundayDemand = dayDemands.find(d => d.key === "sun");
  const sundayReqFTE = sundayDemand?.isOpen && fullH > 0
    ? sundayDemand.hoursRequired / fullH
    : 0;
  const sundayOk = !sundayDemand?.isOpen || sundayCapFTE + 1e-9 >= sundayReqFTE;

  const ptHours = items.filter(it => it.hoursPerWeek <= 20).reduce((s, it) => s + it.count * it.hoursPerWeek, 0);
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
    coverageOk,
    worstDayCoverage:     r2(worstCoverage),
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

  // 1. Demanda por día (con reemplazo integrado)
  const dayDemands = computeDayDemands(input.days, rf);
  const openDays   = dayDemands.filter(d => d.isOpen);
  const hasSun     = dayDemands.some(d => d.key === "sun" && d.isOpen);

  // Totales para métricas
  const totalHoursRaw = openDays.reduce((s, d) => s + d.hoursRequired / rf, 0);
  const totalTarget   = openDays.reduce((s, d) => s + d.hoursRequired, 0);

  // Colación (para mostrar en UI, ya incluida en dayDemands)
  let breakHours = 0, overlapHours = 0;
  for (const k of ALL_DAYS) {
    const d = input.days[k];
    if (!d.open) continue;
    breakHours   += d.requiredPeople * (d.breakMinutes  / 60);
    overlapHours += d.requiredPeople * (d.overlapMinutes / 60);
  }
  const gapHours = Math.max(0, breakHours - overlapHours);

  if (openDays.length === 0) warns.push("⚠️ Ningún día tiene demanda. Dibuja la curva de personas por tramo.");
  if (gapHours > 0)          warns.push(`⚠️ Brecha colación: ${r2(gapHours)}h/sem extra. Aumenta el traslape.`);
  if (!hasSun)               warns.push("ℹ️ Sin demanda dominical — PT fin de semana no es necesario.");
  if (fullH > 44)            warns.push("⚠️ Jornada máxima legal en Chile es 44h semanales (Art. 22 CT).");

  const hasCosts = input.contracts.some(c => c.costPerHour != null && c.costPerHour > 0);

  // 2. Candidatos
  const cands = buildCandidates(input.contracts, ptOk, hasSun);
  if (cands.length === 0) {
    warns.push("⚠️ Sin contratos válidos. Agrega al menos un contrato.");
    return emptyResult(rf, fullH, totalHoursRaw, totalTarget, breakHours, overlapHours, gapHours, warns);
  }

  const CAND   = cands.slice(0, 6);

  // Límite por candidato: máximo para cubrir toda la demanda solo × 1.4
  // PT weekend: limitado por demanda de fin de semana, no total
  const weekendTarget  = dayDemands.filter(d => d.isWeekend && d.isOpen).reduce((s, d) => s + d.hoursRequired, 0);
  const weekdayTarget  = dayDemands.filter(d => !d.isWeekend && d.isOpen).reduce((s, d) => s + d.hoursRequired, 0);

  const limits = CAND.map(c => {
    let target = totalTarget;
    if (c.eligibleDays === "weekend")  target = weekendTarget;
    if (c.eligibleDays === "weekdays") target = weekdayTarget;
    const maxNeeded = c.dailyHours > 0
      ? Math.ceil(target / (c.dailyHours * (c.eligibleDays === "weekend" ? 2 : c.eligibleDays === "weekdays" ? 5 : 5)))
      : Math.ceil(target / Math.max(1, c.hoursPerWeek));
    return Math.min(40, Math.max(2, Math.ceil(maxNeeded * 1.4)));
  });

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
      warns.push("⚠️ Búsqueda acotada — reduce tipos de contrato para mayor precisión.");
      break outer;
    }

    const counts = [a, b, c2, d, 0, 0];
    const mix = buildMix(fullH, dayDemands, totalTarget, CAND, counts, mixId++);
    if (!mix) continue;

    // Solo aceptar mixes con cobertura aceptable en todos los días
    if (!mix.coverageOk) continue;

    const sig = mix.items.map(it => `${it.jornadaId}|${it.contractName}|${it.count}`).sort().join(",");
    if (seen.has(sig)) continue;
    seen.add(sig);

    allMixes.push(mix);
    if (allMixes.length >= 5000) {
      warns.push("⚠️ Más de 5.000 combinaciones — se muestran las mejores.");
      break outer;
    }
  }

  // Fallback: si no hay mixes válidos, intentar con solo contratos full
  if (allMixes.length === 0) {
    const fullCands = CAND.filter(c => c.eligibleDays === "all");
    const fb = fullCands[0] ?? CAND[0];
    if (fb) {
      // Calcular cuántos necesitamos para cubrir cada día
      const neededForWorstDay = Math.max(...openDays.map(d => Math.ceil(d.hoursRequired / fb.dailyHours)));
      const fallback = buildMix(fullH, dayDemands, totalTarget, [fb], [neededForWorstDay], 0);
      if (fallback) {
        allMixes.push(fallback);
        warns.push("⚠️ Mix calculado como fallback — revisa la configuración de contratos.");
      }
    }
  }

  if (allMixes.length === 0) {
    warns.push("⚠️ No se encontró ningún mix válido. Revisa que los contratos puedan cubrir todos los días abiertos.");
    return emptyResult(rf, fullH, totalHoursRaw, totalTarget, breakHours, overlapHours, gapHours, warns);
  }

  // 3. Ordenar: domingo OK → coverageOk → menor headcount → menor slack → menor costo
  allMixes.sort((x, y) => {
    if (x.sundayOk !== y.sundayOk) return x.sundayOk ? -1 : 1;
    if (x.coverageOk !== y.coverageOk) return x.coverageOk ? -1 : 1;
    if (x.headcount !== y.headcount) return x.headcount - y.headcount;
    if (x.slackHours !== y.slackHours) return x.slackHours - y.slackHours;
    if (x.weeklyCost != null && y.weeklyCost != null) return x.weeklyCost - y.weeklyCost;
    return 0;
  });

  const firstOk = allMixes.find(m => m.sundayOk && m.coverageOk);
  if (firstOk) firstOk.isOptimal = true;

  if (hasCosts) {
    const okWithCost = allMixes.filter(m => m.sundayOk && m.coverageOk && m.weeklyCost != null);
    if (okWithCost.length > 0) {
      okWithCost.reduce((a, b) => a.weeklyCost! <= b.weeklyCost! ? a : b).isCheapest = true;
    }
  }

  // Advertencias sobre el óptimo
  const best = allMixes[0];
  if (best.ptShare > 0.35) {
    warns.push(`ℹ️ El mix óptimo tiene ${Math.round(best.ptShare * 100)}% de horas PT — evalúa impacto en rotación.`);
  }

  const fte = fullH > 0 ? r2(totalHoursRaw / fullH) : 0;

  return {
    breakHours:            r2(breakHours),
    overlapHours:          r2(overlapHours),
    gapHours:              r2(gapHours),
    requiredHours:         r2(totalHoursRaw),
    requiredHoursAdjusted: r2(totalTarget),
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
  totalHoursRaw: number, totalTarget: number,
  breakHours: number, overlapHours: number, gapHours: number,
  warnings: string[],
): CalcResult {
  const fte = fullH > 0 ? r2(totalHoursRaw / fullH) : 0;
  return {
    breakHours: r2(breakHours), overlapHours: r2(overlapHours), gapHours: r2(gapHours),
    requiredHours: r2(totalHoursRaw), requiredHoursAdjusted: r2(totalTarget),
    fte, fteAdjusted: r2(fte * rf), replacementFactor: rf,
    sundayReq: 0, hasCosts: false, totalMixes: 0, warnings, mixes: [],
  };
}

// ─── Export helper para Excel ─────────────────────────────────────────────────
// Convierte los mixes a filas planas para exportar

export type MixRow = {
  id: number;
  headcount: number;
  composicion: string;
  domingo: string;
  horasTotal: number;
  holguraHoras: number;
  holguarPct: number;
  ptPct: number;
  costSemanal?: number;
  esOptimo: boolean;
  esMasBarato: boolean;
};

export function mixesToRows(mixes: Mix[]): MixRow[] {
  return mixes.map(m => ({
    id: m.id + 1,
    headcount: m.headcount,
    composicion: m.items.map(it => `${it.count}×${it.contractName} ${it.jornadaName}`).join(" | "),
    domingo: m.sundayOk ? "OK" : "Ajustado",
    horasTotal: m.hoursTotal,
    holguraHoras: m.slackHours,
    holguarPct: Math.round(m.slackPct * 100),
    ptPct: Math.round(m.ptShare * 100),
    costSemanal: m.weeklyCost,
    esOptimo: m.isOptimal,
    esMasBarato: m.isCheapest,
  }));
}