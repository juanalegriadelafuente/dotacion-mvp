// src/lib/san/v2025/rounding.ts
import { RoundingMode } from "./types";

export function round1(x: number) {
  // 1 decimal
  return Math.round(x * 10) / 10;
}

/**
 * Normativo: 1 decimal por área, y aproximación al total.
 * Conservador: todo hacia arriba al final (evita quedar corto).
 */
export function applyFinalRounding(totalRaw: number, mode: RoundingMode) {
  if (mode === "conservador") return Math.ceil(totalRaw);
  // normativo: aproximación al total (redondeo estándar)
  return Math.round(totalRaw);
}

/** Regla del doc: mínimo 3 personas para UCP */
export function enforceUcpMinimum(applied: number) {
  return Math.max(3, applied);
}
