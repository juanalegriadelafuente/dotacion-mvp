// src/lib/san/v2025/factors.ts
//
// CORRECCIONES APLICADAS:
// [FIX-5] FC se combinan ADITIVAMENTE: FC_total = 1 + Σ(FC_i - 1)
//         No multiplicativo. Manual SAN OT-2025, pág. 30-32.
//
// FACTORES SEGÚN OT-SAN ENERO 2025:
// 1. FC nivel tecnológico equipos  (pág. 30)
// 2. FC líneas adicionales producción (pág. 31)
// 3. FC materia prima vegetal sin procesar (pág. 32)

export type FactorKey =
  | "equipment_technology"
  | "extra_production_lines"
  | "veg_unprocessed_share";

// ─── FC 1: Nivel tecnológico de equipos ─────────────────────────────────────
// FC 1.0 → tiene TODOS: lavavajillas + hornos combinados + marmitas automáticas
// FC 1.1 → tiene AL MENOS UNO de los anteriores
// FC 1.2 → NO tiene ninguno de los anteriores
export type EquipmentLevel = "all" | "some" | "none";

export function fcEquipmentTechnology(level: EquipmentLevel): number {
  switch (level) {
    case "all":  return 1.0;
    case "some": return 1.1;
    case "none": return 1.2;
  }
}

// ─── FC 2: Líneas adicionales de producción ──────────────────────────────────
// Base: 5 líneas estándar (líquido, papilla, sin residuos, liviano, común)
// Si hay líneas adicionales, usar la mayor entre almuerzo y cena (NO sumar):
//   0-29   → FC 1.0
//   30-59  → FC 1.1
//   60-89  → FC 1.2
//   90-120 → FC 1.3
export function fcExtraProductionLines(extraMealsPerDay: number): number {
  const n = Math.max(0, Number(extraMealsPerDay || 0));
  if (n <= 29) return 1.0;
  if (n <= 59) return 1.1;
  if (n <= 89) return 1.2;
  return 1.3;
}

// ─── FC 3: Materia prima vegetal sin procesar ────────────────────────────────
// < 30% → FC 1.0
// ≥ 30% → FC 1.1
// NOTA: No contar frutas en estado natural sin procesar.
export function fcVegUnprocessedShare(percent: number): number {
  const p = Math.max(0, Math.min(100, Number(percent || 0)));
  return p >= 30 ? 1.1 : 1.0;
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type FactorsInput = {
  equipmentTechnology?: {
    enabled: boolean;
    level: EquipmentLevel; // "all" | "some" | "none"
  };
  extraProductionLines?: {
    enabled: boolean;
    extraMealsPerDay: number; // mayor entre almuerzo y cena en líneas adicionales
  };
  vegUnprocessedShare?: {
    enabled: boolean;
    percent: number; // % MP vegetal sin procesar (excluye fruta natural)
  };
};

export type AppliedFactor = {
  key: FactorKey;
  label: string;
  value: number;   // multiplicador individual (ej. 1.1)
  delta: number;   // ajuste sobre 1.0 (ej. 0.1)
  reason: string;
};

// ─── Compute ─────────────────────────────────────────────────────────────────

export function computeFactors(f: FactorsInput | undefined): AppliedFactor[] {
  const factors: AppliedFactor[] = [];
  if (!f) return factors;

  if (f.equipmentTechnology?.enabled) {
    const level = f.equipmentTechnology.level ?? "all";
    const value = fcEquipmentTechnology(level);
    if (value > 1.0) {
      factors.push({
        key: "equipment_technology",
        label: "Nivel tecnológico de equipos",
        value,
        delta: value - 1.0,
        reason: `nivel="${level}" ⇒ FC=${value} (all=1.0, some=1.1, none=1.2)`,
      });
    }
  }

  if (f.extraProductionLines?.enabled) {
    const n = Math.max(0, Number(f.extraProductionLines.extraMealsPerDay || 0));
    const value = fcExtraProductionLines(n);
    if (value > 1.0) {
      factors.push({
        key: "extra_production_lines",
        label: "Líneas adicionales de producción",
        value,
        delta: value - 1.0,
        reason: `extraMealsPerDay=${n} (usar el mayor entre almuerzo/cena) ⇒ FC=${value}`,
      });
    }
  }

  if (f.vegUnprocessedShare?.enabled) {
    const p = Math.max(0, Math.min(100, Number(f.vegUnprocessedShare.percent || 0)));
    const value = fcVegUnprocessedShare(p);
    if (value > 1.0) {
      factors.push({
        key: "veg_unprocessed_share",
        label: "MP vegetal sin procesar",
        value,
        delta: value - 1.0,
        reason: `percent=${p}% ⇒ FC=${value} (<30%:1.0, ≥30%:1.1, excluye fruta natural)`,
      });
    }
  }

  return factors;
}

/**
 * Combina factores ADITIVAMENTE según OT-SAN 2025.
 * FC_total = 1.0 + Σ(delta_i)
 * Ej: FC_equipos=1.1 + FC_vegetal=1.1 → 1.0 + 0.1 + 0.1 = 1.2 ✅
 */
export function combineFactors(factors: AppliedFactor[]): number {
  const totalDelta = factors.reduce((sum, f) => sum + f.delta, 0);
  return parseFloat((1.0 + totalDelta).toFixed(4));
}
