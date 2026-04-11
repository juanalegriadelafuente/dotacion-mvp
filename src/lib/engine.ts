// src/lib/engine.ts
// Engine v2 — lógica real para retail chileno
// Restricciones basadas en Código del Trabajo Chile (Art. 22, 26, 28, 34, 38)

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayInput = {
  open: boolean;
  hoursOpen: number;        // horas abiertas ese día
  requiredPeople: number;   // peak de personas requeridas (de la curva)
  shiftsPerDay: number;
  overlapMinutes: number;
  breakMinutes: number;
};

export type ContractType = { name: string; hoursPerWeek: number };

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
  sundayCap: number;
  sundayReq: number;
  sundayOk: boolean;
  items: MixItem[];
};

export type CalcResult = {
  covHours: number;
  breakHours: number;
  overlapHours: number;
  gapHours: number;
  requiredHours: number;
  requiredHoursAdjusted: number;
  fte: number;
  fteAdjusted: number;
  replacementFactor: number;
  ptShare: number;
  sundayReq: number;
  warnings: string[];
  mixes: Mix[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function round2(x: number) { return Math.round(x * 100) / 100; }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

// ─── Jornadas legales (Código del Trabajo Chile) ────────────────────────────
//
// Art. 22:  máximo 45h semanales ordinarias (reducidas a 44h, en proceso a 42h - Ley 21.561)
// Art. 26:  descanso mínimo de 1 día por semana (al menos 1 domingo al mes en comercio - Art. 38)
// Art. 28:  máximo 10h diarias ordinarias
// Art. 34:  colación mínima 30 min no imputable a jornada si > 10h, o si estipulado
//
// Jornadas reales del retail chileno:
// - 5x2: 5 días trabajo, 2 descanso — la más común en retail con domingos rotativos
// - 6x1: 6 días trabajo, 1 descanso — permitida hasta 44h/sem, domingos rotativos
// - 4x3: solo para contratos ≤40h — jornada concentrada
// - PT fin de semana (Sáb+Dom): contratos ≤20h, trabajo solo en fines de semana
// - PT días de semana: contratos ≤20h, trabajo L-V (cuando ptWeekdaysAllowed)

type Jornada = {
  id: string;
  name: string;
  daysWorked: number;
  // Fracción del tiempo trabajado en domingo (real, no heurística)
  // 5x2: en 7 semanas, cada trabajador tiene 1 domingo cada ~5-6 semanas = ~15%
  // 6x1: en 7 semanas, cada trabajador tiene 1 domingo cada ~7 semanas = ~14%
  // 4x3: descanso fijo, domingo puede ser uno de los 3 días libres = rotativo ~25%
  // PT weekend: trabaja siempre sábado Y domingo = 100% disponible domingo
  sundayAvailability: number;
  weekendOnly?: boolean;
  weekdaysOnly?: boolean;
  maxHoursPerWeek?: number;
  minHoursPerWeek?: number;
};

const JORNADAS: Jornada[] = [
  {
    id: "J_5X2",
    name: "5×2",
    daysWorked: 5,
    sundayAvailability: 0.20, // 1 de cada 5 semanas cae domingo en rotación
  },
  {
    id: "J_6X1",
    name: "6×1 (rotativo)",
    daysWorked: 6,
    sundayAvailability: 0.14, // 1 de cada 7 semanas
    maxHoursPerWeek: 44,
  },
  {
    id: "J_4X3",
    name: "4×3 (concentrada)",
    daysWorked: 4,
    sundayAvailability: 0.25, // mayor disponibilidad relativa por 3 días libres rotativos
    maxHoursPerWeek: 40,
  },
  {
    id: "J_PT_WEEKEND",
    name: "PT fin de semana (Sáb+Dom)",
    daysWorked: 2,
    sundayAvailability: 1.0, // trabaja TODOS los domingos por definición
    weekendOnly: true,
    maxHoursPerWeek: 20,
  },
  {
    id: "J_PT_WEEKDAY",
    name: "PT días de semana (L–V)",
    daysWorked: 5,
    sundayAvailability: 0.0, // NO trabaja domingos
    weekdaysOnly: true,
    maxHoursPerWeek: 20,
  },
];

// ─── Asignación contrato → jornadas posibles ────────────────────────────────
//
// Lógica real:
// - Contratos >20h y ≤40h: pueden hacer 5x2, 4x3, o 6x1 (si <=44h)
// - Contratos >40h y ≤44h: pueden hacer 5x2 o 6x1
// - Contratos ≤20h: PT. Si hay demanda fin de semana → PT weekend.
//   Si ptWeekdaysAllowed → también PT weekday.
//   Si no hay domingos abiertos → preferir PT weekday.

function jornadasParaContrato(
  hoursPerWeek: number,
  ptWeekdaysAllowed: boolean,
  hasSundayDemand: boolean,
): Jornada[] {
  if (hoursPerWeek > 44) {
    // Fuera del límite legal Art. 22 — solo 5x2
    return [JORNADAS.find(j => j.id === "J_5X2")!];
  }

  if (hoursPerWeek > 20) {
    // Contratos full o semi-full
    const out: Jornada[] = [];

    // 5x2 siempre disponible para este rango
    out.push(JORNADAS.find(j => j.id === "J_5X2")!);

    // 6x1 solo si ≤44h
    if (hoursPerWeek <= 44) {
      out.push(JORNADAS.find(j => j.id === "J_6X1")!);
    }

    // 4x3 solo si ≤40h
    if (hoursPerWeek <= 40) {
      out.push(JORNADAS.find(j => j.id === "J_4X3")!);
    }

    return out;
  }

  // Contratos PT (≤20h)
  const out: Jornada[] = [];

  if (hasSundayDemand) {
    // Si hay domingos, PT weekend es la opción principal
    out.push(JORNADAS.find(j => j.id === "J_PT_WEEKEND")!);
  }

  if (ptWeekdaysAllowed || !hasSundayDemand) {
    // PT weekday disponible si se permite o si no hay domingos
    out.push(JORNADAS.find(j => j.id === "J_PT_WEEKDAY")!);
  }

  // Si no hay ninguna opción (no debería ocurrir), fallback a PT weekend
  if (out.length === 0) {
    out.push(JORNADAS.find(j => j.id === "J_PT_WEEKEND")!);
  }

  return out;
}

// ─── Demanda semanal ────────────────────────────────────────────────────────

function computeDemand(days: Record<DayKey, DayInput>) {
  const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  let totalHours = 0;
  let sundayHours = 0;
  let weekdayHours = 0;
  let weekendHours = 0;
  let openDays = 0;

  for (const k of DAY_KEYS) {
    const d = days[k];
    if (!d.open || d.hoursOpen <= 0) continue;
    const hp = d.requiredPeople * d.hoursOpen;
    totalHours += hp;
    openDays++;
    if (k === "sun") sundayHours = hp;
    if (k === "sat" || k === "sun") weekendHours += hp;
    else weekdayHours += hp;
  }

  return { totalHours, sundayHours, weekdayHours, weekendHours, openDays };
}

// ─── Colación y traslape ────────────────────────────────────────────────────

function computeBreaks(days: Record<DayKey, DayInput>) {
  const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  let breakHours = 0;
  let overlapHours = 0;

  for (const k of DAY_KEYS) {
    const d = days[k];
    if (!d.open) continue;
    breakHours += d.requiredPeople * (d.breakMinutes / 60);
    overlapHours += d.requiredPeople * (d.overlapMinutes / 60);
  }

  return {
    breakHours,
    overlapHours,
    gapHours: Math.max(0, breakHours - overlapHours),
  };
}

// ─── Construcción y evaluación de mix ──────────────────────────────────────

type Candidate = {
  contractName: string;
  hoursPerWeek: number;
  jornadaId: string;
  jornadaName: string;
  sundayAvailability: number;
  weekendOnly: boolean;
  weekdaysOnly: boolean;
};

function buildMix(
  fullHoursPerWeek: number,
  targetHours: number,
  sundayHours: number,
  weekendHours: number,
  weekdayHours: number,
  candidates: Candidate[],
  counts: number[],
): Mix {
  const items: MixItem[] = [];
  let hoursTotal = 0;
  let headcount = 0;

  // Capacidad dominical: suma de (personas × sundayAvailability × horasContrato/fullHours)
  // Representa cuántos "FTE de domingo" aporta cada tipo de contrato
  let sundayCapFTE = 0;
  let weekendCapHours = 0;
  let weekdayCapHours = 0;

  for (let i = 0; i < candidates.length; i++) {
    const n = counts[i] ?? 0;
    if (n <= 0) continue;
    const c = candidates[i];

    headcount += n;
    const contrib = n * c.hoursPerWeek;
    hoursTotal += contrib;

    // Capacidad dominical real
    const sundayFTE = (c.hoursPerWeek / fullHoursPerWeek) * c.sundayAvailability;
    sundayCapFTE += n * sundayFTE;

    // Capacidad fin de semana vs semana
    if (c.weekendOnly) {
      weekendCapHours += contrib;
    } else if (c.weekdaysOnly) {
      weekdayCapHours += contrib;
    } else {
      // Contratos full distribuyen proporcionalmente
      const weekendRatio = (weekendHours + weekdayHours) > 0
        ? weekendHours / (weekendHours + weekdayHours)
        : 0;
      weekendCapHours += contrib * weekendRatio;
      weekdayCapHours += contrib * (1 - weekendRatio);
    }

    items.push({
      count: n,
      contractName: c.contractName,
      hoursPerWeek: c.hoursPerWeek,
      jornadaId: c.jornadaId,
      jornadaName: c.jornadaName,
      sundayFactor: c.sundayAvailability,
    });
  }

  const slackHours = hoursTotal - targetHours;
  const slackPct = targetHours > 0 ? slackHours / targetHours : 0;

  // Requerimiento dominical en FTE equivalentes
  const sundayReqFTE = fullHoursPerWeek > 0
    ? sundayHours / fullHoursPerWeek
    : 0;

  const sundayOk = sundayHours <= 0 || (sundayCapFTE + 1e-9 >= sundayReqFTE);

  return {
    title: "",
    headcount,
    hoursTotal: round2(hoursTotal),
    slackHours: round2(slackHours),
    slackPct: round2(slackPct),
    sundayCap: round2(sundayCapFTE),
    sundayReq: round2(sundayReqFTE),
    sundayOk,
    items,
  };
}

// ─── Scoring de mix ─────────────────────────────────────────────────────────
//
// Criterios en orden de prioridad:
// 1. Cumple cobertura dominical (binario — no negociable)
// 2. Mínima holgura (no contratar más de lo necesario)
// 3. Menor headcount (menos personas = menor costo fijo)
// 4. Preferir contratos full sobre PT cuando posible (más estabilidad)

function scoreMix(m: Mix, ptShare: number): number {
  if (m.slackHours < 0) return Infinity; // no cubre la demanda — descartado

  const sundayPenalty = m.sundayOk ? 0 : 50000;
  const slackPenalty = m.slackHours * 2;
  const headcountPenalty = m.headcount * 10;
  const ptPenalty = ptShare * 100; // penalizar exceso de PT

  return sundayPenalty + slackPenalty + headcountPenalty + ptPenalty;
}

// ─── Motor principal ────────────────────────────────────────────────────────

export function calculate(input: CalcInput): CalcResult {
  const fullHoursPerWeek = clamp(input.fullHoursPerWeek, 20, 60);
  const ptWeekdaysAllowed = input.ptWeekdaysAllowed ?? false;
  const rf = (input.replacementFactor && input.replacementFactor > 0)
    ? input.replacementFactor
    : 1.0;

  const warnings: string[] = [];

  // ── 1. Demanda ──
  const { totalHours, sundayHours, weekdayHours, weekendHours, openDays } =
    computeDemand(input.days);

  const hasSundayDemand = sundayHours > 0;

  // ── 2. Colación y brecha ──
  const { breakHours, overlapHours, gapHours } = computeBreaks(input.days);

  // Horas efectivas a cubrir = demanda + brecha de colación
  const effectiveHours = totalHours + gapHours;

  if (gapHours > 0) {
    warnings.push(
      `⚠️ Brecha colación: ${round2(gapHours)}h extra a cubrir. Considera aumentar el traslape entre turnos.`
    );
  }

  if (openDays === 0) {
    warnings.push("⚠️ Ningún día tiene demanda configurada. Dibuja la curva de personas por tramo.");
  }

  if (!hasSundayDemand) {
    warnings.push("ℹ️ Sin demanda dominical — contratos PT fin de semana no son necesarios.");
  }

  // Advertencia legal: si fullHoursPerWeek > 44
  if (fullHoursPerWeek > 44) {
    warnings.push("⚠️ Jornada máxima legal en Chile es 44h semanales (Art. 22 CT). Ajusta el parámetro.");
  }

  // ── 3. Expandir contratos en candidatos (contrato × jornada) ──
  const candidates: Candidate[] = [];

  for (const c of input.contracts) {
    if (c.hoursPerWeek <= 0 || !c.name) continue;

    const jornadas = jornadasParaContrato(
      c.hoursPerWeek,
      ptWeekdaysAllowed,
      hasSundayDemand,
    );

    for (const j of jornadas) {
      // Validar que el contrato cumple los límites de la jornada
      if (j.maxHoursPerWeek && c.hoursPerWeek > j.maxHoursPerWeek) continue;
      if (j.minHoursPerWeek && c.hoursPerWeek < j.minHoursPerWeek) continue;

      candidates.push({
        contractName: c.name,
        hoursPerWeek: c.hoursPerWeek,
        jornadaId: j.id,
        jornadaName: j.name,
        sundayAvailability: j.sundayAvailability,
        weekendOnly: !!j.weekendOnly,
        weekdaysOnly: !!j.weekdaysOnly,
      });
    }
  }

  if (candidates.length === 0) {
    warnings.push("⚠️ Sin contratos válidos configurados. Agrega al menos un contrato.");
    return emptyResult(rf, fullHoursPerWeek, effectiveHours, breakHours, overlapHours, gapHours, warnings);
  }

  // ── 4. Ordenar candidatos para búsqueda más eficiente ──
  // Prioridad: contratos full > PT weekend (si hay domingo) > PT weekday
  candidates.sort((a, b) => {
    // Primero los contratos full (más horas = más eficientes)
    if (!a.weekendOnly && !a.weekdaysOnly && (b.weekendOnly || b.weekdaysOnly)) return -1;
    if (!b.weekendOnly && !b.weekdaysOnly && (a.weekendOnly || a.weekdaysOnly)) return 1;
    // Entre iguales, más horas primero
    return b.hoursPerWeek - a.hoursPerWeek;
  });

  // Limitar candidatos para evitar explosión combinatoria
  const CAND = candidates.slice(0, 6);

  // ── 5. Búsqueda inteligente ──
  // Límite por contrato: máximo personas necesarias para cubrir solo
  const limits = CAND.map(c => {
    const maxByHours = Math.ceil((effectiveHours / c.hoursPerWeek) * 1.3);
    return Math.min(80, Math.max(1, maxByHours));
  });

  // PT se itera de 2 en 2 (jornada fin de semana = siempre par para cobertura balanceada)
  const steps = CAND.map(c => c.weekendOnly ? 2 : 1);

  const MAX_ITERS = 600_000;
  let iters = 0;
  const collected: Array<{ mix: Mix; ptShare: number }> = [];

  outer:
  for (let a = 0; a <= (limits[0] ?? 0); a += (steps[0] ?? 1)) {
    for (let b = 0; b <= (limits[1] ?? 0); b += (steps[1] ?? 1)) {
      for (let c2 = 0; c2 <= (limits[2] ?? 0); c2 += (steps[2] ?? 1)) {
        for (let d = 0; d <= (limits[3] ?? 0); d += (steps[3] ?? 1)) {
          if (++iters > MAX_ITERS) break outer;

          const counts = [a, b, c2, d, 0, 0];
          const mix = buildMix(
            fullHoursPerWeek,
            effectiveHours,
            sundayHours,
            weekendHours,
            weekdayHours,
            CAND,
            counts,
          );

          // Filtros rápidos
          if (mix.slackHours < 0) continue;          // no cubre demanda
          if (mix.slackPct > 0.55) continue;          // demasiada holgura (>55%)
          if (mix.headcount === 0) continue;

          // Calcular PT share para scoring
          const ptHours = CAND
            .map((c, i) => (c.weekendOnly || c.weekdaysOnly) ? (counts[i] ?? 0) * c.hoursPerWeek : 0)
            .reduce((s, v) => s + v, 0);
          const ptShare = mix.hoursTotal > 0 ? ptHours / mix.hoursTotal : 0;

          collected.push({ mix, ptShare });

          if (collected.length > 3000) break outer;
        }
      }
    }
  }

  if (iters >= MAX_ITERS) {
    warnings.push("⚠️ Búsqueda acotada por volumen — resultado aproximado. Reduce la cantidad de tipos de contrato para mayor precisión.");
  }

  // ── 6. Ranking y selección ──
  collected.sort((x, y) =>
    scoreMix(x.mix, x.ptShare) - scoreMix(y.mix, y.ptShare)
  );

  // Elegir 3 mixes distintos con variedad real
  const picked: Mix[] = [];
  const signatures = new Set<string>();

  for (const { mix } of collected) {
    // Firma: headcount + composición
    const sig = mix.items
      .map(it => `${it.jornadaId}:${it.contractName}:${it.count}`)
      .sort()
      .join("|");

    if (signatures.has(sig)) continue;
    signatures.add(sig);
    picked.push(mix);
    if (picked.length >= 3) break;
  }

  // Fallback si no encontró nada
  if (picked.length === 0) {
    const fb = CAND.find(c => !c.weekendOnly && !c.weekdaysOnly) ?? CAND[0];
    if (fb) {
      const needed = Math.ceil(effectiveHours / fb.hoursPerWeek);
      const fallback = buildMix(
        fullHoursPerWeek, effectiveHours,
        sundayHours, weekendHours, weekdayHours,
        [fb], [needed],
      );
      fallback.title = "Mix básico — revisa la configuración de días";
      picked.push(fallback);
      warnings.push("⚠️ No se encontró un mix óptimo. Revisa que los días tengan demanda configurada.");
    }
  }

  // Intenta generar alternativas diferentes si solo hay 1
  if (picked.length < 2 && CAND.length > 1) {
    // Alternativa: más contratos full, menos PT
    const fullCands = CAND.filter(c => !c.weekendOnly && !c.weekdaysOnly);
    if (fullCands.length > 0) {
      const fb = fullCands[0];
      const needed = Math.ceil((effectiveHours * 1.1) / fb.hoursPerWeek);
      const alt = buildMix(
        fullHoursPerWeek, effectiveHours,
        sundayHours, weekendHours, weekdayHours,
        [fb], [needed],
      );
      if (alt.headcount > 0) picked.push(alt);
    }
  }

  // ── 7. Títulos descriptivos ──
  picked.forEach((m, idx) => {
    const domingoTag = !hasSundayDemand
      ? "sin domingos"
      : m.sundayOk ? "domingo cubierto" : "domingo ajustado";

    const ptItems = m.items.filter(it => it.hoursPerWeek <= 20);
    const fullItems = m.items.filter(it => it.hoursPerWeek > 20);

    let composicion = "";
    if (ptItems.length > 0 && fullItems.length > 0) {
      composicion = "mix full + PT";
    } else if (ptItems.length > 0) {
      composicion = "solo PT";
    } else {
      composicion = "solo full";
    }

    if (idx === 0) {
      m.title = `Recomendado — ${composicion}, ${domingoTag}`;
    } else if (idx === 1) {
      m.title = `Alternativa A — ${composicion}, ${domingoTag}`;
    } else {
      m.title = `Alternativa B — ${composicion}, ${domingoTag}`;
    }
  });

  // ── 8. Métricas finales ──
  const fte = fullHoursPerWeek > 0 ? effectiveHours / fullHoursPerWeek : 0;
  const bestMix = picked[0];
  const ptHoursTotal = bestMix?.items
    .filter(it => it.hoursPerWeek <= 20)
    .reduce((s, it) => s + it.count * it.hoursPerWeek, 0) ?? 0;
  const ptShare = (bestMix?.hoursTotal ?? 0) > 0
    ? round2(ptHoursTotal / bestMix!.hoursTotal)
    : 0;

  // Advertencia si PT share > 30% (recomendación práctica retail)
  if (ptShare > 0.30) {
    warnings.push(
      `ℹ️ El mix recomendado tiene ${Math.round(ptShare * 100)}% de horas en contratos PT. Considera si esto es sostenible operacionalmente.`
    );
  }

  // Advertencia si holgura > 25%
  if ((bestMix?.slackPct ?? 0) > 0.25) {
    warnings.push(
      `ℹ️ Holgura del ${Math.round((bestMix?.slackPct ?? 0) * 100)}% — considera si puedes reducir el headcount ajustando la curva de demanda.`
    );
  }

  return {
    covHours: bestMix?.hoursTotal ?? 0,
    breakHours: round2(breakHours),
    overlapHours: round2(overlapHours),
    gapHours: round2(gapHours),
    requiredHours: round2(effectiveHours),
    requiredHoursAdjusted: round2(effectiveHours * rf),
    fte: round2(fte),
    fteAdjusted: round2(fte * rf),
    replacementFactor: rf,
    ptShare,
    sundayReq: bestMix?.sundayReq ?? 0,
    warnings,
    mixes: picked,
  };
}

// ─── Resultado vacío (cuando no hay datos) ──────────────────────────────────

function emptyResult(
  rf: number,
  fullHoursPerWeek: number,
  effectiveHours: number,
  breakHours: number,
  overlapHours: number,
  gapHours: number,
  warnings: string[],
): CalcResult {
  return {
    covHours: 0,
    breakHours: round2(breakHours),
    overlapHours: round2(overlapHours),
    gapHours: round2(gapHours),
    requiredHours: round2(effectiveHours),
    requiredHoursAdjusted: round2(effectiveHours * rf),
    fte: 0,
    fteAdjusted: 0,
    replacementFactor: rf,
    ptShare: 0,
    sundayReq: 0,
    warnings,
    mixes: [],
  };
}