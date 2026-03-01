// src/lib/san/v2025/factors.ts

export type FactorKey =
  | "extra_production_lines"
  | "veg_unprocessed_share";

export type FactorsInput = {
  /**
   * Líneas adicionales de producción (almuerzo o cena).
   * Importante (manual):
   * - NO sumar almuerzos + cenas.
   * - Si almuerzo y cena dan FC distinto, usar el FC más alto.
   *
   * En el MVP usamos un solo número: el MAYOR entre almuerzo y cena.
   */
  extraProductionLines?: {
    enabled: boolean;

    /**
     * Cantidad de almuerzos O cenas (elige el mayor, NO la suma)
     * en líneas adicionales de producción.
     */
    extraMealsPerDay: number;
  };

  /**
   * % de materias primas vegetales sin procesar (0..100)
   * (No considerar frutas entregadas en estado natural).
   */
  vegUnprocessedShare?: {
    enabled: boolean;
    percent: number;
  };
};

export type AppliedFactor = {
  key: FactorKey;
  label: string;
  value: number; // multiplicador
  reason: string;
};

/**
 * Calcula FC según líneas adicionales de producción (manual).
 * 0-29  => 1.0
 * 30-59 => 1.1
 * 60-89 => 1.2
 * 90-120 => 1.3
 *
 * Nota práctica:
 * - Si viene >120, lo dejamos en 1.3 (conservador por tabla disponible)
 * - Si quieres, luego lo hacemos parametrizable.
 */
export function fcExtraProductionLines(extraMealsPerDay: number): number {
  const n = Math.max(0, Number(extraMealsPerDay || 0));

  if (n <= 29) return 1.0;
  if (n <= 59) return 1.1;
  if (n <= 89) return 1.2;
  // 90-120 (y >120: se mantiene en el último nivel definido en el cuadro)
  return 1.3;
}

/**
 * FC por materias primas vegetales sin procesar (manual):
 * <30% => 1.0
 * >=30% => 1.1
 */
export function fcVegUnprocessedShare(percent: number): number {
  const p = Math.max(0, Math.min(100, Number(percent || 0)));
  return p >= 30 ? 1.1 : 1.0;
}

export function computeFactors(f: FactorsInput | undefined): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  if (!f) return factors;

  // 1) Líneas adicionales de producción (manual)
  if (f.extraProductionLines?.enabled) {
    const n = Math.max(0, Number(f.extraProductionLines.extraMealsPerDay || 0));
    const value = fcExtraProductionLines(n);

    factors.push({
      key: "extra_production_lines",
      label: "Líneas adicionales de producción (almuerzo o cena, usar el mayor)",
      value,
      reason: `extraMealsPerDay=${n} ⇒ FC=${value} (tabla 0-29/30-59/60-89/90-120)`,
    });
  }

  // 2) Materia prima vegetal sin procesar (manual)
  if (f.vegUnprocessedShare?.enabled) {
    const p = Math.max(
      0,
      Math.min(100, Number(f.vegUnprocessedShare.percent || 0))
    );
    const value = fcVegUnprocessedShare(p);

    factors.push({
      key: "veg_unprocessed_share",
      label: "MP vegetal sin procesar",
      value,
      reason: `percent=${p}% ⇒ FC=${value} (<30%:1.0, >=30%:1.1)`,
    });
  }

  return factors;
}