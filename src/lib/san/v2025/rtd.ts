// src/lib/san/v2025/rtd.ts

export type MealKey =
  | "desayuno"
  | "colacion_am"
  | "almuerzo"
  | "once"
  | "cena"
  | "colacion_pm"
  | "colacion_nocturna";

export type MealCounts = Record<MealKey, number>;
export type MealCoefficients = Record<MealKey, number>;

export type RtdMealsInput = {
  enabled: boolean;

  /**
   * Cantidad de raciones/usuarios por tiempo de comida (pacientes + anexas).
   * Ejemplo: desayuno=733, almuerzo=733, etc.
   */
  patients: Partial<MealCounts>;

  /**
   * Cantidad de raciones/usuarios por tiempo de comida (casino funcionarios).
   */
  casino: Partial<MealCounts>;

  /**
   * Coeficientes de ración (CR). Defaults según ejemplo típico.
   * Puedes ajustar después cuando confirmemos la tabla exacta del manual.
   */
  coefficients?: {
    patients?: Partial<MealCoefficients>;
    casino?: Partial<MealCoefficients>;
  };

  /**
   * Cómo convertir el RTD final a entero (el manual pide expresarlo en enteros).
   * - "round": redondeo estándar
   * - "ceil": hacia arriba (conservador)
   */
  integerMode?: "round" | "ceil";
};

export type RtdMealsResult = {
  patientsRTD: number; // entero
  casinoRTD: number; // entero
  totalRTD: number; // entero
  details: {
    patients: { key: MealKey; count: number; cr: number; product: number }[];
    casino: { key: MealKey; count: number; cr: number; product: number }[];
    rawPatients: number;
    rawCasino: number;
    rawTotal: number;
    integerMode: "round" | "ceil";
  };
};

export const DEFAULT_PATIENT_COEFFICIENTS: MealCoefficients = {
  desayuno: 0.15,
  colacion_am: 0.1,
  almuerzo: 0.25,
  once: 0.15,
  cena: 0.25,
  colacion_pm: 0.1,
  colacion_nocturna: 0.1,
};

export const DEFAULT_CASINO_COEFFICIENTS: MealCoefficients = {
  desayuno: 0.15,
  colacion_am: 0.0,
  almuerzo: 0.25,
  once: 0.0,
  cena: 0.25,
  colacion_pm: 0.0,
  colacion_nocturna: 0.0,
};

const ALL_MEALS: MealKey[] = [
  "desayuno",
  "colacion_am",
  "almuerzo",
  "once",
  "cena",
  "colacion_pm",
  "colacion_nocturna",
];

function n0(x: any) {
  const v = Number(x);
  return Number.isFinite(v) ? Math.max(0, v) : 0;
}

function chooseInt(x: number, mode: "round" | "ceil") {
  return mode === "ceil" ? Math.ceil(x) : Math.round(x);
}

export function computeRtdFromMeals(input: RtdMealsInput): RtdMealsResult {
  const integerMode = input.integerMode ?? "round";

  const crPatients: MealCoefficients = {
    ...DEFAULT_PATIENT_COEFFICIENTS,
    ...(input.coefficients?.patients ?? {}),
  };

  const crCasino: MealCoefficients = {
    ...DEFAULT_CASINO_COEFFICIENTS,
    ...(input.coefficients?.casino ?? {}),
  };

  const patientsDetails: RtdMealsResult["details"]["patients"] = [];
  const casinoDetails: RtdMealsResult["details"]["casino"] = [];

  let rawPatients = 0;
  let rawCasino = 0;

  for (const key of ALL_MEALS) {
    const countP = n0(input.patients?.[key]);
    const crP = n0(crPatients[key]);
    const prodP = countP * crP;
    rawPatients += prodP;
    if (countP > 0 || crP > 0) {
      patientsDetails.push({ key, count: countP, cr: crP, product: prodP });
    }

    const countC = n0(input.casino?.[key]);
    const crC = n0(crCasino[key]);
    const prodC = countC * crC;
    rawCasino += prodC;
    if (countC > 0 || crC > 0) {
      casinoDetails.push({ key, count: countC, cr: crC, product: prodC });
    }
  }

  const rawTotal = rawPatients + rawCasino;

  const patientsRTD = chooseInt(rawPatients, integerMode);
  const casinoRTD = chooseInt(rawCasino, integerMode);
  const totalRTD = chooseInt(rawTotal, integerMode);

  return {
    patientsRTD,
    casinoRTD,
    totalRTD,
    details: {
      patients: patientsDetails,
      casino: casinoDetails,
      rawPatients,
      rawCasino,
      rawTotal,
      integerMode,
    },
  };
}