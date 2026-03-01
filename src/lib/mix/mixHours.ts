// src/lib/mix/mixHours.ts

export type MixItem = {
  hoursPerWeek: number;
  count: number;
  totalHours: number;
};

export type MixResult = {
  ok: boolean;
  requiredHours: number;
  totalHours: number;
  slackHours: number;
  headcount: number;
  items: MixItem[];
  note?: string;
};

function n0(x: any) {
  const v = Number(x);
  return Number.isFinite(v) ? Math.max(0, v) : 0;
}

function uniqSorted(nums: number[]) {
  return Array.from(new Set(nums)).sort((a, b) => b - a);
}

/**
 * Genera un mix para cubrir requiredHours minimizando:
 * 1) slackHours (sobrante)
 * 2) headcount
 * 3) cantidad de tipos (simpleza)
 *
 * contractsHours: lista de jornadas permitidas (ej [42,40,36,30,24,20]).
 * Si no viene, usamos un set recomendado en base a maxWeekHours.
 */
export function computeMixHours(params: {
  requiredHours: number;
  maxWeekHours: number;
  minContractHours?: number; // default 20
  contractsHours?: number[];
}): MixResult {
  const required = n0(params.requiredHours);
  const maxW = n0(params.maxWeekHours);
  const minC = Math.max(1, n0(params.minContractHours ?? 20));

  if (required <= 0.01) {
    return {
      ok: true,
      requiredHours: 0,
      totalHours: 0,
      slackHours: 0,
      headcount: 0,
      items: [],
      note: "No hay horas requeridas.",
    };
  }

  if (maxW < minC) {
    return {
      ok: false,
      requiredHours: required,
      totalHours: 0,
      slackHours: 0,
      headcount: 0,
      items: [],
      note: "maxWeekHours < minContractHours",
    };
  }

  const defaultContracts = uniqSorted([
    Math.round(maxW),
    40,
    36,
    30,
    24,
    20,
  ]);

  const hoursList = uniqSorted(
    (params.contractsHours?.length ? params.contractsHours : defaultContracts)
      .map((x) => Math.round(n0(x)))
      .filter((h) => h >= minC && h <= maxW)
  );

  if (hoursList.length === 0) {
    return {
      ok: false,
      requiredHours: required,
      totalHours: 0,
      slackHours: 0,
      headcount: 0,
      items: [],
      note: "No hay contratos válidos en el rango permitido.",
    };
  }

  // límite de búsqueda por headcount (acotado)
  const minHour = Math.min(...hoursList);
  const base = Math.ceil(required / minHour);
  const maxHead = Math.min(300, base + 20); // suficiente para SAN

  // Buscamos el mínimo totalHours >= required,
  // y dentro de eso: mínimo headcount, y dentro de eso: mínimo tipos.
  // DP por "totalHours" hasta required + margen.
  const maxHours = Math.ceil(required + maxW * 20); // margen razonable

  type State = {
    head: number;
    types: number;
    prevH: number | null;
    used: number | null; // contrato usado para llegar aquí
  };

  const INF = 1e9;
  const dp: State[] = Array.from({ length: maxHours + 1 }, () => ({
    head: INF,
    types: INF,
    prevH: null,
    used: null,
  }));
  dp[0] = { head: 0, types: 0, prevH: null, used: null };

  // Para conteo de tipos, mantenemos una heurística simple:
  // penalizamos introducir un contrato nuevo, pero como DP clásico no guarda set,
  // en la práctica minimizamos headcount y slack; y luego simplificamos el mix al final.
  for (let h = 0; h <= maxHours; h++) {
    if (dp[h].head === INF) continue;
    if (dp[h].head >= maxHead) continue;

    for (const c of hoursList) {
      const nh = h + c;
      if (nh > maxHours) continue;

      const nHead = dp[h].head + 1;

      // types lo dejamos como head-based (aprox); luego simplificamos de verdad al final
      const nTypes = dp[h].types; // placeholder

      if (
        nHead < dp[nh].head ||
        (nHead === dp[nh].head && nTypes < dp[nh].types)
      ) {
        dp[nh] = { head: nHead, types: nTypes, prevH: h, used: c };
      }
    }
  }

  // Elegir el mejor h >= required:
  // 1) slack mínimo
  // 2) headcount mínimo
  let bestH = -1;
  let bestSlack = INF;
  let bestHead = INF;

  for (let h = Math.ceil(required); h <= maxHours; h++) {
    if (dp[h].head === INF) continue;
    const slack = h - required;
    const head = dp[h].head;

    if (
      slack < bestSlack ||
      (slack === bestSlack && head < bestHead)
    ) {
      bestSlack = slack;
      bestHead = head;
      bestH = h;
    }
    // si slack 0 y head muy bueno, corta temprano
    if (bestSlack === 0 && bestHead <= base) break;
  }

  if (bestH < 0) {
    return {
      ok: false,
      requiredHours: required,
      totalHours: 0,
      slackHours: 0,
      headcount: 0,
      items: [],
      note: "No se pudo encontrar mix dentro del rango de búsqueda.",
    };
  }

  // Reconstruir items
  const counts = new Map<number, number>();
  let cur = bestH;
  while (cur > 0) {
    const st = dp[cur];
    if (st.prevH == null || st.used == null) break;
    counts.set(st.used, (counts.get(st.used) ?? 0) + 1);
    cur = st.prevH;
  }

  // Simplificar (opcional): ordenar desc
  const items: MixItem[] = Array.from(counts.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([hoursPerWeek, count]) => ({
      hoursPerWeek,
      count,
      totalHours: hoursPerWeek * count,
    }));

  const totalHours = items.reduce((s, it) => s + it.totalHours, 0);
  const headcount = items.reduce((s, it) => s + it.count, 0);

  return {
    ok: true,
    requiredHours: Math.round(required * 10) / 10,
    totalHours,
    slackHours: Math.round((totalHours - required) * 10) / 10,
    headcount,
    items,
  };
}