export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayInput = {
  open: boolean;
  hoursOpen: number; // H_d (already computed)
  requiredPeople: number; // R_d
  shiftsPerDay: number; // S_d
  overlapMinutes: number; // O_d
  breakMinutes: number; // Bk_d
};

export type ContractType = {
  name: string;         // "42h", "20h", etc
  hoursPerWeek: number; // h_i
};

export type CalcInput = {
  fullHoursPerWeek: number; // default 42, editable
  fullTimeThresholdHours: number; // default 30
  fullTimeSundayAvailability: number; // default 0.5 (A)
  partTimeSundayAvailability: number; // default 1.0
  days: Record<DayKey, DayInput>;
  contracts: ContractType[];
};

export type MixItem = {
  contractName: string;
  hoursPerWeek: number;
  count: number;
  sundayFactor: number;
};

export type MixResult = {
  title: string;
  items: MixItem[];
  headcount: number;
  hoursTotal: number;
  slackHours: number;
  slackPct: number;
  sundayReq: number;
  sundayCap: number;
  sundayOk: boolean;
};

export type CalcOutput = {
  covHours: number;
  breakHours: number;
  overlapHours: number;
  gapHours: number;
  requiredHours: number;
  fte: number;

  sundayReq: number;
  warnings: string[];

  mixes: MixResult[];
};

function clampInt(n: number, min: number, max: number): number {
  const x = Math.floor(n);
  return Math.max(min, Math.min(max, x));
}

function ceilDiv(a: number, b: number): number {
  return Math.ceil(a / b);
}

function sundayFactorForContract(
  hoursPerWeek: number,
  threshold: number,
  ftSunday: number,
  ptSunday: number
): number {
  return hoursPerWeek > threshold ? ftSunday : ptSunday;
}

export function calculate(input: CalcInput): CalcOutput {
  const warnings: string[] = [];
  if (!input.contracts?.length) throw new Error("No contracts provided.");
  if (input.fullHoursPerWeek <= 0) throw new Error("fullHoursPerWeek must be > 0.");
  if (input.fullTimeSundayAvailability < 0 || input.fullTimeSundayAvailability > 1) {
    throw new Error("fullTimeSundayAvailability must be in [0,1].");
  }

  // --- compute weekly coverage (cov) ---
  let covHours = 0;
  let breakHours = 0;
  let overlapHours = 0;

  (Object.keys(input.days) as DayKey[]).forEach((d) => {
    const day = input.days[d];

    if (!day.open || day.hoursOpen <= 0) return;

    const H = Math.max(0, day.hoursOpen);
    const R = Math.max(0, Math.floor(day.requiredPeople));
    const S = Math.max(0, Math.floor(day.shiftsPerDay));
    const O = Math.max(0, day.overlapMinutes);
    const Bk = Math.max(0, day.breakMinutes);

    covHours += R * H;

    if (S <= 0) {
      warnings.push(`${d}: open day but shiftsPerDay <= 0. Check shifts.`);
      return;
    }

    // Break hours = R * S * Bk
    if (Bk > 0) {
      breakHours += R * S * (Bk / 60);
    }

    // Overlap hours = R * (S-1) * O
    if (S === 1 && O > 0) {
      warnings.push(`${d}: overlap ignored because shiftsPerDay=1.`);
    }
    if (S > 1 && O > 0) {
      overlapHours += R * (S - 1) * (O / 60);
    }

    // sanity
    if (S >= 2 && H <= (Bk / 60)) {
      warnings.push(`${d}: hoursOpen looks too low vs breakMinutes. Check inputs.`);
    }
  });

  const gapHours = Math.max(0, breakHours - overlapHours);
  const requiredHours = covHours + gapHours;
  const fte = requiredHours / input.fullHoursPerWeek;

  if (gapHours > 0.01) {
    warnings.push(
      `Break gap detected: breaks=${breakHours.toFixed(1)}h, overlap=${overlapHours.toFixed(1)}h, gap=${gapHours.toFixed(1)}h.`
    );
  }

  // --- Sunday requirement in "slots" ---
  const sun = input.days.sun;
  const sundayReq = (sun?.open && sun.hoursOpen > 0)
    ? Math.max(0, Math.floor(sun.requiredPeople)) * Math.max(0, Math.floor(sun.shiftsPerDay))
    : 0;

  // --- generate mixes (brute force bounded) ---
  const contracts = input.contracts
    .map((c) => {
      const h = Math.max(1, Math.floor(c.hoursPerWeek));
      return {
        ...c,
        hoursPerWeek: h,
        sundayFactor: sundayFactorForContract(
          h,
          input.fullTimeThresholdHours,
          input.fullTimeSundayAvailability,
          input.partTimeSundayAvailability
        ),
      };
    })
    .sort((a, b) => b.hoursPerWeek - a.hoursPerWeek);

  const bounds = contracts.map((c) => clampInt(ceilDiv(requiredHours, c.hoursPerWeek) + 2, 0, 30));

  type Combo = number[];
  const combos: { counts: Combo; hoursTotal: number; headcount: number; sundayCap: number }[] = [];

  function rec(i: number, counts: number[], hoursAcc: number, headAcc: number, sunAcc: number) {
    if (i === contracts.length) {
      if (hoursAcc + 1e-9 >= requiredHours && sunAcc + 1e-9 >= sundayReq) {
        combos.push({ counts: [...counts], hoursTotal: hoursAcc, headcount: headAcc, sundayCap: sunAcc });
      }
      return;
    }

    const c = contracts[i];
    const maxN = bounds[i];

    for (let n = 0; n <= maxN; n++) {
      const newHours = hoursAcc + n * c.hoursPerWeek;
      const newHead = headAcc + n;
      const newSun = sunAcc + n * c.sundayFactor;

      if (newHead > 60) break;

      counts.push(n);
      rec(i + 1, counts, newHours, newHead, newSun);
      counts.pop();
    }
  }

  rec(0, [], 0, 0, 0);

  if (combos.length === 0) {
    warnings.push(
      "No feasible mix found with current contracts + Sunday rule. Add more <=30h contracts or adjust Sunday availability."
    );
    return {
      covHours, breakHours, overlapHours, gapHours, requiredHours, fte,
      sundayReq,
      warnings,
      mixes: [],
    };
  }

  function toMixResult(title: string, combo: (typeof combos)[number]): MixResult {
    const items: MixItem[] = contracts.map((c, idx) => ({
      contractName: c.name,
      hoursPerWeek: c.hoursPerWeek,
      count: combo.counts[idx],
      sundayFactor: c.sundayFactor,
    })).filter(x => x.count > 0);

    const slackHours = combo.hoursTotal - requiredHours;
    const slackPct = requiredHours > 0 ? slackHours / requiredHours : 0;

    return {
      title,
      items,
      headcount: combo.headcount,
      hoursTotal: combo.hoursTotal,
      slackHours,
      slackPct,
      sundayReq,
      sundayCap: combo.sundayCap,
      sundayOk: combo.sundayCap + 1e-9 >= sundayReq,
    };
  }

  const byMinHeadcount = [...combos].sort((a, b) =>
    (a.headcount - b.headcount) ||
    ((a.hoursTotal - requiredHours) - (b.hoursTotal - requiredHours))
  )[0];

  const byMinSlack = [...combos].sort((a, b) =>
    ((a.hoursTotal - requiredHours) - (b.hoursTotal - requiredHours)) ||
    (a.headcount - b.headcount)
  )[0];

  const byRobust = [...combos].sort((a, b) => {
    const aPct = (a.hoursTotal - requiredHours) / Math.max(1e-9, requiredHours);
    const bPct = (b.hoursTotal - requiredHours) / Math.max(1e-9, requiredHours);
    const aDist = Math.abs(aPct - 0.10);
    const bDist = Math.abs(bPct - 0.10);
    return (aDist - bDist) || (a.headcount - b.headcount);
  })[0];

  const unique = new Map<string, typeof combos[number]>();
  [byMinHeadcount, byMinSlack, byRobust].forEach((c) => {
    const key = c.counts.join(",");
    if (!unique.has(key)) unique.set(key, c);
  });

  const chosen = Array.from(unique.values());
  const mixes: MixResult[] = [];
  if (chosen[0]) mixes.push(toMixResult("Menos personas", chosen[0]));
  if (chosen[1]) mixes.push(toMixResult("Más eficiente", chosen[1]));
  if (chosen[2]) mixes.push(toMixResult("Más robusto", chosen[2]));

  return {
    covHours, breakHours, overlapHours, gapHours, requiredHours, fte,
    sundayReq,
    warnings,
    mixes,
  };
}