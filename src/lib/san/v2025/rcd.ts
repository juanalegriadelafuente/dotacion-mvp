// src/lib/san/v2025/rcd.ts
import { computeFactors, type AppliedFactor, type FactorsInput } from "./factors";

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
  const multiplier = factors.reduce((acc, f) => acc * f.value, 1);

  const rcd = rtd * multiplier;

  return {
    rtd,
    factors,
    multiplier,
    rcd,
  };
}