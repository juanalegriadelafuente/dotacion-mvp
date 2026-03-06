// src/lib/san/v2025/rcd.ts
// [FIX-5] Usa combineFactors (aditivo) en lugar de reduce multiplicativo
import { computeFactors, combineFactors, type AppliedFactor, type FactorsInput } from "./factors";

export type RcdComputation = {
  rtd: number;
  factors: AppliedFactor[];
  multiplier: number;
  rcd: number;
};

/**
 * Calcula RCD desde RTD y Factores de Complejidad (FC).
 * - rtd: raciones totales día (base)
 * - factors: selección de FC (multiplicadores)
 *
 * RCD = RTD * Π(FC_i)
 */
export function computeRcdFromRtd(params: {
  rtd: number;
  factors?: FactorsInput;
}): RcdComputation {
  const rtd = Math.max(0, Number(params.rtd || 0));

  const factors = computeFactors(params.factors);
  // [FIX-5] Combinación aditiva: 1.0 + Σ(delta_i), no multiplicativa
  const multiplier = combineFactors(factors);

  const rcd = rtd * multiplier;

  return {
    rtd,
    factors,
    multiplier,
    rcd,
  };
}