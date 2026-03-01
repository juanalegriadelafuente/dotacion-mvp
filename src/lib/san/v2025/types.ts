// src/lib/san/v2025/types.ts
import type { FactorsInput } from "./factors";
import type { RtdMealsInput } from "./rtd";

export type RoundingMode = "normativo" | "conservador";

export type SanScenario = {
  maxWeekHours: 44 | 42 | 40 | number;
  roundingMode: RoundingMode;
};

export type SanInput = {
  scenario: SanScenario;

  // -----------------------------
  // RTD (dos formas)
  // -----------------------------
  /** RTD pacientes + anexas directo (si NO usas meals) */
  rtdPatients?: number;

  /** RTD casino directo (si NO usas meals) */
  rtdCasino?: number;

  /** Modo RTD desde tiempos de comida (CR) */
  rtdMeals?: RtdMealsInput;

  // -----------------------------
  // RCD (dos formas)
  // -----------------------------
  /** MODO SIMPLE: RCD directa */
  rcd?: number;

  /** MODO AVANZADO: RTD total base para calcular RCD */
  rtdTotal?: number;

  /** Factores de complejidad (FC) para modo avanzado */
  factors?: FactorsInput;

  // -----------------------------
  // Clínica
  // -----------------------------
  bedsBasic: number;
  bedsMedium: number;
  bedsCritical: number;
};

export type TraceStep = {
  key: string;
  label: string;
  data?: Record<string, any>;
};

export type AreaStaff = {
  area:
    | "recepcion_almacenamiento"
    | "produccion"
    | "lavado"
    | "distribucion_clinica_anexas"
    | "distribucion_casino";
  basis: "RCD" | "RTD";
  rangeLabel: string;
  ratioLabel: string;
  raw: number;
  applied: number;
};

export type SanResult = {
  rtdPatients: number;
  rtdCasino: number;
  rtdTotal: number;

  rcd: number;

  ucpComplexity: "minima" | "mediana" | "maxima";

  ucpStaffByArea: AreaStaff[];
  ucpTotalFte44_raw: number;
  ucpTotalFte44_applied: number;

  clinicalDietitiansFte44_raw: number;
  clinicalDietitiansFte44_applied: number;

  totalHoursPerWeek_required: number;
  totalFte_equivalent: number;

  hoursToCoverPerWeek: number;

  trace: TraceStep[];
};