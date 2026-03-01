// src/lib/san/v2025/clinical.ts
import { round1, applyFinalRounding } from "./rounding";
import { RoundingMode, TraceStep } from "./types";

export function computeClinicalDietitians(params: {
  bedsBasic: number;
  bedsMedium: number;
  bedsCritical: number;
  roundingMode: RoundingMode;
}): { fte44_raw: number; fte44_applied: number; trace: TraceStep[] } {
  const { bedsBasic, bedsMedium, bedsCritical, roundingMode } = params;

  const raw =
    (Math.max(0, bedsBasic) / 32) +
    (Math.max(0, bedsMedium) / 24) +
    (Math.max(0, bedsCritical) / 16);

  const raw1 = round1(raw);
  const applied = applyFinalRounding(raw1, roundingMode);

  const trace: TraceStep[] = [
    {
      key: "clinical.nutri.raw",
      label: "Nutricionistas clínicos (FTE_44) - cálculo por camas",
      data: { bedsBasic, bedsMedium, bedsCritical, raw: raw1, applied, roundingMode },
    },
  ];

  return { fte44_raw: raw1, fte44_applied: applied, trace };
}