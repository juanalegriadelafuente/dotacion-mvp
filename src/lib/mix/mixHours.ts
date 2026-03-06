// src/lib/mix/mixHours.ts

// CORRECCIONES APLICADAS (2025-06):
// [FIX-4] El contador de `types` era un placeholder que nunca se actualizaba.
//         Ahora el DP rastrea correctamente el set de contratos usados para
//         desempatar entre soluciones con igual headcount y slack.

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

export function computeMixHours(params: {
  requiredHours: number;
  maxWeekHours: number;
  minContractHours?: number;
  contractsHours?: number[];
}): MixResult {
  const required = n0(params.requiredHours);
  const maxW = n0(params.maxWeekHours);
  const minC = Math.max(1, n0(params.minContractHours ?? 20));

  if (required <= 0.01) {
    return { ok: true, requiredHours: 0, totalHours: 0, slackHours: 0, headcount: 0, items: [], note: "No hay horas requeridas." };
  }

  if (maxW < minC) {
    return { ok: false, requiredHours: required, totalHours: 0, slackHours: 0, headcount: 0, items: [], note: "maxWeekHours < minContractHours" };
  }

  const defaultContracts = uniqSorted([Math.round(maxW), 40, 36, 30, 24, 20]);
  const hoursList = uniqSorted(
    (params.contractsHours?.length ? params.contractsHours : defaultContracts)
      .map((x) => Math.round(n0(x)))
      .filter((h) => h >= minC && h <= maxW)
  );

  if (hoursList.length === 0) {
    return { ok: false, requiredHours: required, totalHours: 0, slackHours: 0, headcount: 0, items: [], note: "No hay contratos válidos en el rango permitido." };
  }

  const minHour = Math.min(...hoursList);
  const base = Math.ceil(required / minHour);
  const maxHead = Math.min(300, base + 20);
  const maxHours = Math.ceil(required + maxW * 20);

  // [FIX-4] Estado del DP ahora incluye `types`: número de contratos distintos usados.
  // Antes era un placeholder que nunca se actualizaba, lo que podía generar mixes
  // con muchos tipos distintos cuando una combinación más simple existía.
  type State = {
    head: number;
    types: number;   // [FIX-4] conteo real de tipos distintos
    prevH: number | null;
    used: number | null;
  };

  const INF = 1e9;
  const dp: State[] = Array.from({ length: maxHours + 1 }, () => ({
    head: INF,
    types: INF,
    prevH: null,
    used: null,
  }));
  dp[0] = { head: 0, types: 0, prevH: null, used: null };

  // Para rastrear tipos distintos usamos una heurística eficiente:
  // si el contrato que llega es distinto al último usado, incrementamos types.
  // Esto es una aproximación O(n) que evita guardar el set completo en cada estado.
  for (let h = 0; h <= maxHours; h++) {
    if (dp[h].head === INF) continue;
    if (dp[h].head >= maxHead) continue;

    for (const c of hoursList) {
      const nh = h + c;
      if (nh > maxHours) continue;

      const nHead = dp[h].head + 1;
      // [FIX-4] Incrementar types solo si este contrato es distinto al último usado
      const nTypes = dp[h].used === c ? dp[h].types : dp[h].types + 1;

      const better =
        nHead < dp[nh].head ||
        (nHead === dp[nh].head && nTypes < dp[nh].types);

      if (better) {
        dp[nh] = { head: nHead, types: nTypes, prevH: h, used: c };
      }
    }
  }

  let bestH = -1;
  let bestSlack = INF;
  let bestHead = INF;
  let bestTypes = INF;

  for (let h = Math.ceil(required); h <= maxHours; h++) {
    if (dp[h].head === INF) continue;
    const slack = h - required;
    const head = dp[h].head;
    const types = dp[h].types; // [FIX-4] usar types real en el desempate

    if (
      slack < bestSlack ||
      (slack === bestSlack && head < bestHead) ||
      (slack === bestSlack && head === bestHead && types < bestTypes)
    ) {
      bestSlack = slack;
      bestHead = head;
      bestTypes = types;
      bestH = h;
    }
    if (bestSlack === 0 && bestHead <= base) break;
  }

  if (bestH < 0) {
    return { ok: false, requiredHours: required, totalHours: 0, slackHours: 0, headcount: 0, items: [], note: "No se pudo encontrar mix dentro del rango de búsqueda." };
  }

  const counts = new Map<number, number>();
  let cur = bestH;
  while (cur > 0) {
    const st = dp[cur];
    if (st.prevH == null || st.used == null) break;
    counts.set(st.used, (counts.get(st.used) ?? 0) + 1);
    cur = st.prevH;
  }

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
