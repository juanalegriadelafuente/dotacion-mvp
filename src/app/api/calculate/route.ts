// src/app/api/calculate/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DayInput = {
  open: boolean;
  hoursOpen?: number; // fallback simple
  requiredPeople: number; // personas simultáneas
  overlapMinutes: number; // traslape (min)
  breakMinutes: number; // colación no imputable (min)
  // NOTA: shiftsPerDay existe en algunos front antiguos -> lo ignoramos
  shiftsPerDay?: number;
};

type ContractType = { name: string; hoursPerWeek: number };

type Preferences = {
  strategy?: "balanced" | "min_people" | "stable";
  allow_6x1?: boolean;
  allow_5x2?: boolean;
  allow_4x3?: boolean; // SOLO con contrato 40h
  allow_pt_weekend?: boolean;
  pt_weekend_strict?: boolean; // lógica silenciosa
};

type CalcInput = {
  fullHoursPerWeek: number; // para FTE (ej 42)
  fullTimeThresholdHours: number; // umbral PT/FT (ej 30)
  days: Record<DayKey, DayInput>;
  contracts: ContractType[];
  preferences?: Preferences;

  // FUTURO: input tipo Excel (30 min). Si lo mandas, el motor lo usa.
  // Formato: demanda30[day] = array de 48 slots (30 min) con "personas requeridas"
  // Slot 0 = 07:00, Slot 47 = 06:30
  demand30?: Partial<Record<DayKey, number[]>>;

  // debug opcional para evitar caching raro
  debugNonce?: number;
};

type CalcResponse = { ok: true; result: any } | { ok: false; error: string };

function safeNum(x: any, def = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function dayLabel(d: DayKey) {
  return (
    {
      mon: "Lun",
      tue: "Mar",
      wed: "Mié",
      thu: "Jue",
      fri: "Vie",
      sat: "Sáb",
      sun: "Dom",
    }[d] ?? d
  );
}

const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/**
 * Rate limit best-effort (serverless: no es garantía, pero ayuda)
 */
type RLState = { count: number; resetAt: number };
const RL = (globalThis as any).__DOT_RL__ as Map<string, RLState> | undefined;
const rlStore: Map<string, RLState> = RL ?? new Map<string, RLState>();
(globalThis as any).__DOT_RL__ = rlStore;

function getClientKey(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return ip;
}

function rateLimit(req: Request, limit = 60, windowMs = 60_000) {
  const key = getClientKey(req);
  const now = Date.now();
  const cur = rlStore.get(key);
  if (!cur || now > cur.resetAt) {
    rlStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (cur.count >= limit) return { ok: false, remaining: 0 };
  cur.count += 1;
  rlStore.set(key, cur);
  return { ok: true, remaining: limit - cur.count };
}

/**
 * Jornadas típicas (lo que ve gerencia)
 */
type Jornada = "6x1" | "5x2" | "4x3" | "PT_WE";
type Option = {
  optionId: string;
  contractName: string;
  hoursPerWeek: number;
  jornada: Jornada;
  workdays: number; // 6,5,4,2
  dailyHours: number; // hoursPerWeek / workdays
  eligibleDays: DayKey[]; // PT fin de semana: sat/sun; full: mon..sun
  isPt: boolean;
  isFull: boolean;
};

function jornadaPretty(j: Jornada) {
  if (j === "PT_WE") return "Part Time Sábado y Domingo";
  return j;
}

function buildOptions(params: {
  contracts: ContractType[];
  threshold: number;
  prefs: Required<Preferences>;
}) {
  const { contracts, threshold, prefs } = params;

  const clean = contracts
    .map((c) => ({
      name: String(c.name || "").trim(),
      hours: Math.max(1, safeNum(c.hoursPerWeek, 0)),
    }))
    .filter((c) => c.name.length > 0 && c.hours > 0);

  const has40 = clean.some((c) => c.hours === 40);

  const opts: Option[] = [];

  for (const c of clean) {
    const isFull = c.hours >= threshold;
    const isPt = !isFull;

    if (isPt) {
      if (!prefs.allow_pt_weekend) continue;

      // PT fin de semana "típico"
      // Si el cliente mete 16h/20h/24h, lo tratamos como PT_WE igual.
      opts.push({
        optionId: `${c.name}|${c.hours}|PT_WE`,
        contractName: c.name,
        hoursPerWeek: c.hours,
        jornada: "PT_WE",
        workdays: 2,
        dailyHours: c.hours / 2,
        eligibleDays: ["sat", "sun"],
        isPt: true,
        isFull: false,
      });
      continue;
    }

    // FULL: 5x2 / 6x1
    if (prefs.allow_6x1) {
      opts.push({
        optionId: `${c.name}|${c.hours}|6x1`,
        contractName: c.name,
        hoursPerWeek: c.hours,
        jornada: "6x1",
        workdays: 6,
        dailyHours: c.hours / 6,
        eligibleDays: [...DAY_ORDER],
        isPt: false,
        isFull: true,
      });
    }
    if (prefs.allow_5x2) {
      opts.push({
        optionId: `${c.name}|${c.hours}|5x2`,
        contractName: c.name,
        hoursPerWeek: c.hours,
        jornada: "5x2",
        workdays: 5,
        dailyHours: c.hours / 5,
        eligibleDays: [...DAY_ORDER],
        isPt: false,
        isFull: true,
      });
    }

    // 4x3 SOLO si contrato 40 y está permitido
    if (prefs.allow_4x3 && has40 && c.hours === 40) {
      opts.push({
        optionId: `${c.name}|${c.hours}|4x3`,
        contractName: c.name,
        hoursPerWeek: c.hours,
        jornada: "4x3",
        workdays: 4,
        dailyHours: 40 / 4,
        eligibleDays: [...DAY_ORDER],
        isPt: false,
        isFull: true,
      });
    }
  }

  // orden: primero full (para “cuerpo base”), después PT
  opts.sort((a, b) => {
    const af = a.isFull ? 0 : 1;
    const bf = b.isFull ? 0 : 1;
    if (af !== bf) return af - bf;
    // contratos grandes primero
    return b.hoursPerWeek - a.hoursPerWeek;
  });

  return { options: opts, has40 };
}

/**
 * Deriva DEMANDA semanal (horas-persona por día)
 * - Base: hoursOpen * personasSimultáneas
 * - Gap: max(0, colación - traslape) * personasSimultáneas
 *
 * Nota: si demand30 viene (tipo Excel), se usa para baseHoursByDay
 */
function computeDemand(params: { days: Record<DayKey, DayInput>; demand30?: CalcInput["demand30"] }) {
  const { days, demand30 } = params;

  const demandHoursByDay: Record<DayKey, number> = {
    mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
  };

  const peakPeopleByDay: Record<DayKey, number> = {
    mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
  };

  // 1) demanda base (si viene demand30)
  if (demand30 && typeof demand30 === "object") {
    for (const d of DAY_ORDER) {
      const arr = demand30[d];
      if (!Array.isArray(arr) || arr.length === 0) continue;

      // asumimos slots 30-min -> 0.5h
      let base = 0;
      let peak = 0;
      for (const v of arr) {
        const people = Math.max(0, safeNum(v, 0));
        base += people * 0.5;
        peak = Math.max(peak, people);
      }
      demandHoursByDay[d] = base;
      peakPeopleByDay[d] = peak;
    }
  }

  // 2) fallback simple (days)
  for (const d of DAY_ORDER) {
    const di = days[d];
    if (!di?.open) continue;

    const hoursOpen = Math.max(0, safeNum(di.hoursOpen, 0));
    const people = Math.max(0, safeNum(di.requiredPeople, 0));

    // si demand30 no trajo nada para ese día, usamos modo simple
    if (demandHoursByDay[d] <= 0 && hoursOpen > 0 && people > 0) {
      demandHoursByDay[d] = hoursOpen * people;
      peakPeopleByDay[d] = Math.max(peakPeopleByDay[d], people);
    } else {
      // igual actualizamos peak con lo del modo simple por si demand30 viene parcial
      peakPeopleByDay[d] = Math.max(peakPeopleByDay[d], people);
    }

    // gap por colación vs traslape (aprox)
    const brk = Math.max(0, safeNum(di.breakMinutes, 0)) / 60;
    const ov = Math.max(0, safeNum(di.overlapMinutes, 0)) / 60;
    const gap = Math.max(0, brk - ov);

    if (gap > 0 && peakPeopleByDay[d] > 0) {
      demandHoursByDay[d] += gap * peakPeopleByDay[d];
    }
  }

  const requiredHours = DAY_ORDER.reduce((s, d) => s + demandHoursByDay[d], 0);

  return { demandHoursByDay, peakPeopleByDay, requiredHours };
}

/**
 * Asigna “días trabajados” (worker-days) de una opción a los días con mayor demanda restante.
 * Cada worker-day aporta dailyHours.
 * Cada día no puede tener más de count worker-days de esa opción.
 */
function allocateOption(params: {
  option: Option;
  count: number;
  remaining: Record<DayKey, number>;
  supply: Record<DayKey, number>;
}) {
  const { option, count, remaining, supply } = params;
  if (count <= 0) return;

  const totalAssignments = count * option.workdays;
  const capPerDay = count;

  // tracking de cuántos worker-days ya le asignamos a cada día para esta opción
  const usedAssignments: Record<DayKey, number> = {
    mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
  };

  // PT fin de semana: primero cubrir sáb/dom
  const eligible = option.eligibleDays;

  for (let i = 0; i < totalAssignments; i++) {
    // elige el día elegible con mayor remaining (si todos <=0 igual asigna al "menos malo")
    let bestDay: DayKey | null = null;
    let bestScore = -Infinity;

    for (const d of eligible) {
      if (usedAssignments[d] >= capPerDay) continue;

      // score: demanda restante primero
      const r = remaining[d];
      const score = r;

      if (score > bestScore) {
        bestScore = score;
        bestDay = d;
      }
    }

    if (!bestDay) break;

    usedAssignments[bestDay] += 1;

    // aportamos horas
    supply[bestDay] += option.dailyHours;

    // reducimos demanda (no bajo 0)
    remaining[bestDay] = Math.max(0, remaining[bestDay] - option.dailyHours);
  }
}

/**
 * Evalúa un mix: cobertura por día + holgura + ranking “empresa”
 */
function evaluateMix(params: {
  options: Option[];
  counts: Record<string, number>; // optionId -> count
  demandHoursByDay: Record<DayKey, number>;
  requiredHours: number;
  strategy: "balanced" | "min_people" | "stable";
}) {
  const { options, counts, demandHoursByDay, requiredHours, strategy } = params;

  const remaining: Record<DayKey, number> = { ...demandHoursByDay };
  const supply: Record<DayKey, number> = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };

  let totalHours = 0;
  let headcount = 0;
  let ptHeadcount = 0;
  let fullHeadcount = 0;

  for (const opt of options) {
    const c = Math.max(0, safeNum(counts[opt.optionId], 0));
    if (!c) continue;

    headcount += c;
    totalHours += c * opt.hoursPerWeek;
    if (opt.isPt) ptHeadcount += c;
    if (opt.isFull) fullHeadcount += c;
  }

  // Asignación: primero FULL (cuerpo base), luego PT para rematar fines de semana
  const fullOpts = options.filter((o) => o.isFull);
  const ptOpts = options.filter((o) => o.isPt);

  for (const opt of fullOpts) {
    allocateOption({ option: opt, count: counts[opt.optionId] ?? 0, remaining, supply });
  }
  for (const opt of ptOpts) {
    allocateOption({ option: opt, count: counts[opt.optionId] ?? 0, remaining, supply });
  }

  // Cobertura ok si no queda demanda pendiente en ningún día
  const uncovered = DAY_ORDER.reduce((s, d) => s + remaining[d], 0);

  const slackHours = totalHours - requiredHours;
  const slackPct = requiredHours > 0 ? slackHours / requiredHours : 0;

  // Penalizaciones (para que NO recomiende basura con 70% holgura)
  let penalty = 0;

  if (uncovered > 1e-6) penalty += 1_000_000 + uncovered * 50_000;
  if (slackHours < 0) penalty += 1_000_000 + Math.abs(slackHours) * 50_000;

  // caps por estrategia (muy importante para tu crítica de holgura)
  const slackCap =
    strategy === "stable" ? 0.35 : strategy === "balanced" ? 0.25 : 0.18;

  if (slackPct > slackCap) penalty += 300_000 + (slackPct - slackCap) * 600_000;

  // balance “empresa”: no queremos 90% PT
  const ptShare = headcount > 0 ? ptHeadcount / headcount : 0;

  if (strategy === "balanced") {
    // castiga extremos: target 20–45% PT
    if (ptShare > 0.55) penalty += 120_000 + (ptShare - 0.55) * 250_000;
    if (ptShare < 0.05) penalty += 50_000; // muy rígido a veces sube costo/holgura
    // exige cuerpo base
    if (fullHeadcount < 2 && requiredHours > 120) penalty += 150_000;
  }

  if (strategy === "stable") {
    if (ptShare > 0.35) penalty += 150_000 + (ptShare - 0.35) * 300_000;
    if (fullHeadcount < 3 && requiredHours > 140) penalty += 150_000;
  }

  // objetivo: 1) penalidades, 2) slack, 3) headcount
  // en flexible/min_people prioriza headcount un poco más
  const wSlack = strategy === "min_people" ? 900 : 1100;
  const wHead = strategy === "min_people" ? 70 : 45;

  const score = penalty + Math.abs(slackHours) * wSlack + headcount * wHead;

  return {
    ok: uncovered <= 1e-6 && slackHours >= -1e-6,
    uncovered,
    headcount,
    totalHours,
    slackHours,
    slackPct,
    ptShare,
    fullHeadcount,
    supplyByDay: supply,
    demandByDay: demandHoursByDay,
    score,
  };
}

/**
 * Genera candidatos (mixes) enumerando counts acotados.
 * - exploramos más escenarios que antes
 * - pero con poda dura para que no explote
 */
function generateCandidates(params: {
  options: Option[];
  requiredHours: number;
  strategy: "balanced" | "min_people" | "stable";
}) {
  const { options, requiredHours, strategy } = params;

  if (options.length === 0) return [];

  // límites
  const minHours = Math.min(...options.map((o) => o.hoursPerWeek));
  const maxHeadcount = Math.min(50, Math.max(8, Math.ceil(requiredHours / Math.max(1, minHours)) + 10));

  // holgura máxima “aceptable” para no botar resultados ridículos
  const maxHours =
    strategy === "stable" ? requiredHours * 1.45 : strategy === "balanced" ? requiredHours * 1.30 : requiredHours * 1.20;

  // max por opción (acotado)
  const maxCounts = options.map((o) => {
    const base = Math.ceil(requiredHours / o.hoursPerWeek);
    const bump = o.isPt ? 8 : 5;
    return clamp(base + bump, 0, 40);
  });

  type CountMap = Record<string, number>;
  const results: CountMap[] = [];

  function rec(i: number, counts: CountMap, head: number, hours: number) {
    if (head > maxHeadcount) return;
    if (hours > maxHours) return;

    if (i === options.length) {
      if (head === 0) return;
      // requerimos estar "cerca" por horas para no llenar de basura
      if (hours >= requiredHours * 0.95 && hours <= maxHours) {
        results.push({ ...counts });
      }
      return;
    }

    const opt = options[i];
    const maxC = maxCounts[i];

    for (let k = 0; k <= maxC; k++) {
      const newHead = head + k;
      const newHours = hours + k * opt.hoursPerWeek;
      if (newHead > maxHeadcount) break;
      if (newHours > maxHours) break;

      if (k > 0) counts[opt.optionId] = k;
      else delete counts[opt.optionId];

      rec(i + 1, counts, newHead, newHours);
    }
  }

  rec(0, {}, 0, 0);

  // orden por cercanía a requiredHours (reduce búsqueda al evaluar)
  results.sort((a, b) => {
    const ha = options.reduce((s, o) => s + (a[o.optionId] ?? 0) * o.hoursPerWeek, 0);
    const hb = options.reduce((s, o) => s + (b[o.optionId] ?? 0) * o.hoursPerWeek, 0);
    return Math.abs(ha - requiredHours) - Math.abs(hb - requiredHours);
  });

  // cap fuerte
  return results.slice(0, 1200);
}

function groupComposition(options: Option[], counts: Record<string, number>, threshold: number) {
  // agrupa por (jornada + contrato)
  const map = new Map<string, { jornada: Jornada; contractHours: number; contractName: string; count: number }>();

  for (const opt of options) {
    const c = Math.max(0, safeNum(counts[opt.optionId], 0));
    if (!c) continue;

    const key = `${opt.jornada}|${opt.hoursPerWeek}|${opt.contractName}`;
    const prev = map.get(key);
    if (prev) prev.count += c;
    else {
      map.set(key, {
        jornada: opt.jornada,
        contractHours: opt.hoursPerWeek,
        contractName: opt.contractName,
        count: c,
      });
    }
  }

  const items = Array.from(map.values()).sort((a, b) => {
    // Full primero
    const af = a.contractHours >= threshold ? 0 : 1;
    const bf = b.contractHours >= threshold ? 0 : 1;
    if (af !== bf) return af - bf;
    // jornada “full” primero
    const order: Record<Jornada, number> = { "6x1": 0, "5x2": 1, "4x3": 2, "PT_WE": 3 };
    if (order[a.jornada] !== order[b.jornada]) return order[a.jornada] - order[b.jornada];
    return b.contractHours - a.contractHours;
  });

  return items.map((it) => ({
    count: it.count,
    jornada: it.jornada,
    jornadaLabel: jornadaPretty(it.jornada),
    contractName: it.contractName,
    hoursPerWeek: it.contractHours,
    isFull: it.contractHours >= threshold,
    isPt: it.contractHours < threshold,
  }));
}

function pickTopScenarios(scored: any[], options: Option[], threshold: number) {
  // scored viene ordenado por score asc
  const picks: any[] = [];

  // 1) mejor general
  if (scored[0]) picks.push({ ...scored[0], title: "Mix recomendado (balanceado)" });

  // 2) menos personas
  const minHead = [...scored].sort((a, b) => a.headcount - b.headcount || a.score - b.score)[0];
  if (minHead) picks.push({ ...minHead, title: "Alternativa (menos personas)" });

  // 3) menos PT
  const minPt = [...scored].sort((a, b) => a.ptShare - b.ptShare || a.score - b.score)[0];
  if (minPt) picks.push({ ...minPt, title: "Alternativa (menos PT)" });

  // 4) con 4x3 si existe
  const with4x3 = scored.find((m) => m.items.some((it: any) => it.jornada === "4x3"));
  if (with4x3) picks.push({ ...with4x3, title: "Alternativa (con 4x3)" });

  // 5) con más 6x1 si existe
  const more6x1 = [...scored].sort((a, b) => {
    const a6 = a.items.reduce((s: number, it: any) => s + (it.jornada === "6x1" ? it.count : 0), 0);
    const b6 = b.items.reduce((s: number, it: any) => s + (it.jornada === "6x1" ? it.count : 0), 0);
    return b6 - a6 || a.score - b.score;
  })[0];
  if (more6x1) picks.push({ ...more6x1, title: "Alternativa (más 6x1)" });

  // dedupe por firma
  const seen = new Set<string>();
  const out: any[] = [];
  for (const m of picks) {
    const sig = m.items
      .slice()
      .sort((a: any, b: any) => String(a.jornada).localeCompare(String(b.jornada)) || a.hoursPerWeek - b.hoursPerWeek)
      .map((it: any) => `${it.jornada}:${it.hoursPerWeek}:${it.count}`)
      .join("|");
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(m);
  }

  return out.slice(0, 5);
}

export async function POST(req: Request): Promise<NextResponse<CalcResponse>> {
  // Rate limit
  const rl = rateLimit(req, 80, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Demasiadas solicitudes. Intenta nuevamente en 1 minuto." }, { status: 429 });
  }

  let input: CalcInput;
  try {
    input = (await req.json()) as CalcInput;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  // Validación mínima de payload (evita basura gigante)
  const rawSize = JSON.stringify(input ?? {}).length;
  if (rawSize > 250_000) {
    return NextResponse.json({ ok: false, error: "Payload demasiado grande." }, { status: 413 });
  }

  const fullHoursPerWeek = Math.max(1, safeNum(input.fullHoursPerWeek, 42));
  const threshold = Math.max(1, safeNum(input.fullTimeThresholdHours, 30));

  const days = input.days as any;
  const contracts = Array.isArray(input.contracts) ? input.contracts : [];
  if (!days || typeof days !== "object") {
    return NextResponse.json({ ok: false, error: "Falta days." }, { status: 400 });
  }
  if (contracts.length === 0) {
    return NextResponse.json({ ok: false, error: "Debes definir al menos 1 contrato." }, { status: 400 });
  }

  const prefsIn = input.preferences ?? {};
  const prefs: Required<Preferences> = {
    strategy: prefsIn.strategy ?? "balanced",
    allow_6x1: prefsIn.allow_6x1 ?? true,
    allow_5x2: prefsIn.allow_5x2 ?? true,
    allow_4x3: prefsIn.allow_4x3 ?? true,
    allow_pt_weekend: prefsIn.allow_pt_weekend ?? true,
    pt_weekend_strict: prefsIn.pt_weekend_strict ?? true,
  };

  const strategy = prefs.strategy;

  const { demandHoursByDay, requiredHours } = computeDemand({ days, demand30: input.demand30 });

  const warnings: string[] = [];
  if (requiredHours <= 0.01) {
    warnings.push("No hay horas requeridas (revisa días abiertos y personas simultáneas).");
  }

  const { options, has40 } = buildOptions({ contracts, threshold, prefs });

  if (prefs.allow_4x3 && !has40) {
    warnings.push("4x3 está activado, pero no existe contrato 40h en tu set. Agrega 40h si quieres 4x3.");
  }

  if (options.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No hay jornadas posibles con tu configuración. Revisa jornadas permitidas y contratos." },
      { status: 400 }
    );
  }

  // Genera candidatos (muchos) y evalúa
  const candidates = generateCandidates({ options, requiredHours, strategy });

  const evaluated = candidates
    .map((counts) => {
      const ev = evaluateMix({ options, counts, demandHoursByDay, requiredHours, strategy });
      const items = groupComposition(options, counts, threshold);

      // “domingo” como chequeo en horas-persona del día domingo (no slots)
      const sundayReq = demandHoursByDay.sun;
      const sundayCap = ev.supplyByDay.sun;

      return {
        score: ev.score,
        headcount: ev.headcount,
        hoursTotal: Math.round(ev.totalHours * 10) / 10,
        slackHours: Math.round(ev.slackHours * 10) / 10,
        slackPct: ev.slackPct,
        sundayReq: Math.round(sundayReq * 10) / 10,
        sundayCap: Math.round(sundayCap * 10) / 10,
        sundayOk: sundayCap + 1e-6 >= sundayReq,
        ptShare: ev.ptShare,
        uncovered: ev.uncovered,
        items,
      };
    })
    .sort((a, b) => a.score - b.score);

  // Filtra los realmente decentes primero
  const decent = evaluated.filter((m) => m.uncovered <= 1e-6 && m.slackHours >= -1e-6);

  // si no hay decentes, igual devolvemos los mejores (para debug)
  const pool = decent.length > 0 ? decent : evaluated.slice(0, 50);

  const mixes = pickTopScenarios(pool, options, threshold);

  if (mixes.length === 0) {
    return NextResponse.json({ ok: false, error: "No se encontraron mixes razonables con tu set actual." }, { status: 400 });
  }

  // Warnings útiles
  const best = mixes[0];
  if (best && best.slackPct > 0.25) {
    warnings.push("Hay holgura relevante. Tip: agrega un contrato intermedio (ej 36h/30h/16h) o ajusta demanda.");
  }
  if (best && best.ptShare > 0.6) {
    warnings.push("El mix usa muchos PT. Si tu operación requiere ‘cuerpo base’, agrega más opciones full (36/42).");
  }

  const result = {
    requiredHours: Math.round(requiredHours * 10) / 10,
    fte: Math.round((requiredHours / fullHoursPerWeek) * 100) / 100,
    demandByDay: DAY_ORDER.map((d) => ({ day: dayLabel(d), hours: Math.round(demandHoursByDay[d] * 10) / 10 })),
    warnings,
    mixes,
  };

  return NextResponse.json({ ok: true, result });
}