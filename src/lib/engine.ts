// src/lib/engine.ts
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayInput = {
  open: boolean;
  hoursOpen: number;
  requiredPeople: number;
  shiftsPerDay: number;
  overlapMinutes: number;
  breakMinutes: number;
};

export type ContractType = { name: string; hoursPerWeek: number };

export type CalcInput = {
  fullHoursPerWeek: number; // ej 42
  days: Record<DayKey, DayInput>;
  contracts: ContractType[];
};

export type MixItem = {
  count: number;
  contractName: string;
  hoursPerWeek: number;
  jornadaId: string;
  jornadaName: string;
  sundayFactor: number;
};

export type Mix = {
  title: string;
  headcount: number;
  hoursTotal: number;
  slackHours: number;
  slackPct: number;
  sundayCap: number; // “capacidad domingo” en equivalentes relativos
  sundayReq: number; // “requerimiento domingo” en equivalentes relativos
  sundayOk: boolean;
  items: MixItem[];
};

export type CalcResult = {
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

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}

/**
 * Jornadas (MODELO GENERAL / OPERATIVO)
 * Opción 2 (la que elegiste):
 * - 6x1: 0.55
 * - 5x2: 0.50
 * - 4x3: 0.45 (solo si <= 40h)
 * - PT fin de semana: 1.00 (Sáb+Dom fijo)
 */
type Jornada = {
  id: string;
  name: string;
  daysWorked: number;
  sundayFactor: number;
  weekendOnly?: boolean;
  maxHours?: number; // regla dura para 4x3
};

const JORNADAS: Jornada[] = [
  { id: "J_6X1", name: "6x1 (rotativo)", daysWorked: 6, sundayFactor: 0.55 },
  { id: "J_5X2", name: "5x2", daysWorked: 5, sundayFactor: 0.5 },
  {
    id: "J_4X3",
    name: "4x3 (ley 40h)",
    daysWorked: 4,
    sundayFactor: 0.45,
    maxHours: 40,
  },
  {
    id: "J_PT_WEEKEND",
    name: "PT fin de semana (Sáb+Dom)",
    daysWorked: 2,
    sundayFactor: 1.0,
    weekendOnly: true,
  },
];

function getJornada(id: string) {
  const j = JORNADAS.find((x) => x.id === id);
  if (!j) throw new Error(`Jornada desconocida: ${id}`);
  return j;
}

/**
 * Mapping de contratos -> jornadas posibles (simple, pero muy real para retail).
 * - PT (<=20h): fin de semana fijo Sáb+Dom
 * - Full/semi-full: 5x2 siempre; 6x1 si >=40h; 4x3 si <=40h
 */
function jornadasParaContrato(hoursPerWeek: number): Jornada[] {
  const h = hoursPerWeek;

  if (h <= 20) return [getJornada("J_PT_WEEKEND")];

  const out: Jornada[] = [];
  out.push(getJornada("J_5X2"));

  if (h >= 40) out.push(getJornada("J_6X1"));

  const j43 = getJornada("J_4X3");
  if (h <= (j43.maxHours ?? 999)) out.push(j43);

  // unique by id
  return Array.from(new Map(out.map((x) => [x.id, x])).values());
}

/**
 * Demanda semanal en horas-persona (sin solver de turnos aún):
 * sum(día abierto) requiredPeople * hoursOpen
 */
function computeRequiredHours(days: Record<DayKey, DayInput>) {
  let requiredHours = 0;
  let sundayReqHours = 0;

  const keys = Object.keys(days) as DayKey[];
  for (const k of keys) {
    const d = days[k];
    if (!d.open) continue;
    const need = d.requiredPeople * d.hoursOpen;
    requiredHours += need;
    if (k === "sun") sundayReqHours = need;
  }
  return { requiredHours, sundayReqHours };
}

/**
 * Brecha colación vs traslape (modelo simple y útil):
 * breakHours = sum(requiredPeople * breakMinutes/60)
 * overlapHours = sum(requiredPeople * overlapMinutes/60)
 * gap = max(0, break - overlap)
 */
function computeBreakOverlapGap(days: Record<DayKey, DayInput>) {
  let breakHours = 0;
  let overlapHours = 0;

  const keys = Object.keys(days) as DayKey[];
  for (const k of keys) {
    const d = days[k];
    if (!d.open) continue;
    breakHours += d.requiredPeople * (d.breakMinutes / 60);
    overlapHours += d.requiredPeople * (d.overlapMinutes / 60);
  }

  const gapHours = Math.max(0, breakHours - overlapHours);
  return { breakHours, overlapHours, gapHours };
}

/**
 * Evalúa un mix con un proxy dominical:
 * - Convertimos “horas domingo” a “equivalentes” usando baseDayHours = fullHours/7
 * - Capacidad domingo:
 *    por contrato-jornada: (hoursPerWeek/fullHours) * sundayFactor
 *   (PT weekend sale bien parado porque sundayFactor=1.0)
 *
 * Esto NO calendariza (eso sería Turnera), pero sí modela el “cuello” dominical.
 */
function buildMix(
  fullHoursPerWeek: number,
  effectiveRequiredHours: number,
  sundayReqHours: number,
  cand: Array<{
    contractName: string;
    hoursPerWeek: number;
    jornadaId: string;
    jornadaName: string;
    sundayFactor: number;
  }>,
  counts: number[],
): Mix {
  const items: MixItem[] = [];
  let hoursTotal = 0;
  let headcount = 0;
  let sundayCapEquiv = 0;

  for (let i = 0; i < cand.length; i++) {
    const n = counts[i] ?? 0;
    if (n <= 0) continue;
    const c = cand[i];

    headcount += n;
    hoursTotal += n * c.hoursPerWeek;

    // Capacidad dominical relativa (equivalentes)
    const sundayEquivPerPerson =
      (c.hoursPerWeek / fullHoursPerWeek) * c.sundayFactor;
    sundayCapEquiv += n * sundayEquivPerPerson;

    items.push({
      count: n,
      contractName: c.contractName,
      hoursPerWeek: c.hoursPerWeek,
      jornadaId: c.jornadaId,
      jornadaName: c.jornadaName,
      sundayFactor: c.sundayFactor,
    });
  }

  const slackHours = hoursTotal - effectiveRequiredHours;
  const slackPct =
    effectiveRequiredHours > 0 ? slackHours / effectiveRequiredHours : 0;

  // Requerimiento domingo en equivalentes (si fullHours=42, baseDay=6h)
  const baseDayHours = fullHoursPerWeek / 7;
  const sundayReqEquiv = baseDayHours > 0 ? sundayReqHours / baseDayHours : 0;

  const sundayOk = sundayCapEquiv + 1e-9 >= sundayReqEquiv;

  return {
    title: "",
    headcount,
    hoursTotal: round2(hoursTotal),
    slackHours: round2(slackHours),
    slackPct,
    sundayCap: round2(sundayCapEquiv),
    sundayReq: round2(sundayReqEquiv),
    sundayOk,
    items,
  };
}

function scoreMix(m: Mix) {
  // Penaliza fuerte si no cumple domingo
  const sundayPenalty = m.sundayOk
    ? 0
    : 1000 + Math.max(0, m.sundayReq - m.sundayCap) * 100;

  // Penaliza demasiada holgura (pero no mata el mix)
  const slackPenalty = Math.max(0, m.slackHours) * 0.3;

  // Penaliza headcount (queremos menos personas, pero no a costa de romper domingo)
  return m.headcount * 10 + slackPenalty + sundayPenalty;
}

function maxCountByHours(h: number) {
  if (h >= 40) return 20;
  if (h >= 30) return 25;
  if (h >= 20) return 35;
  return 40;
}

/**
 * Motor principal
 */
export function calculate(input: CalcInput): CalcResult {
  const fullHoursPerWeek = clamp(input.fullHoursPerWeek, 1, 60);

  const warnings: string[] = [];

  // Requerimiento
  const { requiredHours, sundayReqHours } = computeRequiredHours(input.days);

  // Colación vs traslape
  const { breakHours, overlapHours, gapHours } = computeBreakOverlapGap(
    input.days,
  );

  // “Horas efectivas” a cubrir: demanda + brecha
  const effectiveRequiredHours = requiredHours + gapHours;

  if (gapHours > 0)
    warnings.push(
      "⚠️ Brecha por colación vs traslape: sube traslape o ajusta turnos.",
    );
  if (sundayReqHours === 0)
    warnings.push(
      "ℹ️ Domingo cerrado o sin demanda: el cuello dominical no influye.",
    );

  // Expandir contratos en (contrato + jornada)
  const expanded = input.contracts.flatMap((c) => {
    const jornadas = jornadasParaContrato(c.hoursPerWeek);
    return jornadas.map((j) => ({
      contractName: c.name,
      hoursPerWeek: c.hoursPerWeek,
      jornadaId: j.id,
      jornadaName: j.name,
      sundayFactor: j.sundayFactor,
      weekendOnly: !!j.weekendOnly,
    }));
  });

  // Orden: primero PT weekend (porque salva domingo), luego lo demás
  expanded.sort((a, b) => {
    if (a.weekendOnly !== b.weekendOnly) return a.weekendOnly ? -1 : 1;
    // luego mayor factor domingo
    return b.sundayFactor - a.sundayFactor;
  });

  // Candidatos (top N)
  const CAND = expanded.slice(0, 6);

  // Búsqueda acotada (heurística)
  const mixesAll: Mix[] = [];
  const limits = CAND.map((c) => maxCountByHours(c.hoursPerWeek));
  const steps = CAND.map((c) => (c.hoursPerWeek >= 30 ? 1 : 2));

  for (let a = 0; a <= (limits[0] ?? 0); a += steps[0] ?? 1) {
    for (let b = 0; b <= (limits[1] ?? 0); b += steps[1] ?? 1) {
      for (let c = 0; c <= (limits[2] ?? 0); c += steps[2] ?? 1) {
        for (let d = 0; d <= (limits[3] ?? 0); d += steps[3] ?? 1) {
          const counts = [a, b, c, d, 0, 0];

          const m = buildMix(
            fullHoursPerWeek,
            effectiveRequiredHours,
            sundayReqHours,
            CAND,
            counts,
          );

          // Reglas básicas de filtro
          if (m.hoursTotal < effectiveRequiredHours) continue;
          if (m.slackPct > 0.6) continue;

          mixesAll.push(m);
          if (mixesAll.length > 2500) break;
        }
        if (mixesAll.length > 2500) break;
      }
      if (mixesAll.length > 2500) break;
    }
    if (mixesAll.length > 2500) break;
  }

  // Fallback si no encuentra nada
  if (mixesAll.length === 0) {
    const fb = expanded.find((x) => x.hoursPerWeek >= 30) ?? expanded[0];
    const needed = Math.ceil(effectiveRequiredHours / fb.hoursPerWeek);
    const fallback = buildMix(
      fullHoursPerWeek,
      effectiveRequiredHours,
      sundayReqHours,
      [fb],
      [needed],
    );
    fallback.title = "Fallback — revisa parámetros";
    mixesAll.push(fallback);
  }

  // Rank
  mixesAll.sort((x, y) => scoreMix(x) - scoreMix(y));

  // Elegir top 3 distintos
  const picked: Mix[] = [];
  for (const m of mixesAll) {
    const sig = `${m.headcount}-${m.sundayOk}-${Math.round(m.slackHours)}`;
    if (
      picked.some(
        (p) =>
          `${p.headcount}-${p.sundayOk}-${Math.round(p.slackHours)}` === sig,
      )
    )
      continue;
    picked.push(m);
    if (picked.length >= 3) break;
  }

  picked.forEach((m, idx) => {
    const base =
      idx === 0
        ? "Mix recomendado (balance)"
        : idx === 1
          ? "Alternativa (menos personas)"
          : "Alternativa (mejor domingo)";
    const tag = m.sundayOk ? "✅ domingo OK" : "⚠️ domingo justo";
    m.title = `${base} — ${tag}`;
  });

  const fte =
    fullHoursPerWeek > 0 ? effectiveRequiredHours / fullHoursPerWeek : 0;

  return {
    covHours: picked[0]?.hoursTotal ?? 0,
    breakHours: round2(breakHours),
    overlapHours: round2(overlapHours),
    gapHours: round2(gapHours),
    requiredHours: round2(effectiveRequiredHours),
    fte: round2(fte),
    sundayReq: picked[0]?.sundayReq ?? 0,
    warnings,
    mixes: picked,
  };
}
