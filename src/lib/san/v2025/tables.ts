// src/lib/san/v2025/tables.ts

export type Range = { min: number; max: number | null; label: string };

export const RCD_COMPLEXITY_TABLE = [
  { max: 149, complexity: "minima" as const },
  { min: 150, max: 299, complexity: "mediana" as const },
  { min: 300, max: null, complexity: "maxima" as const },
];

// Rangos usados en Tablas 4 y 5 (0-50, 51-100, 101-200, 201-400, 401-600, 601-900, 901-1200, >1200)
export const COMMON_RANGES: Range[] = [
  { min: 0, max: 50, label: "0-50" },
  { min: 51, max: 100, label: "51-100" },
  { min: 101, max: 200, label: "101-200" },
  { min: 201, max: 400, label: "201-400" },
  { min: 401, max: 600, label: "401-600" },
  { min: 601, max: 900, label: "601-900" },
  { min: 901, max: 1200, label: "901-1200" },
  { min: 1201, max: null, label: ">1200" },
];

// Tabla N°4 (RCD) — ratios por área
// Interpretación: dotación = RCD / denom
export const TABLE_4 = {
  recepcion_almacenamiento: [
    "1:50",
    "1:100",
    "1:100",
    "1:150",
    "1:150",
    "1:150",
    "1:200",
    "1:200",
  ],
  produccion: [
    "1:20",
    "1:30",
    "1:35",
    "1:40",
    "1:50",
    "1:50",
    "1:50",
    "1:50",
  ],
  lavado: [
    "1:50",
    "1:50",
    "1:50",
    "1:60",
    "1:70",
    "1:70",
    "1:80",
    "1:80",
  ],
} as const;

// Tabla N°5 (RTD) — distribución
export const TABLE_5 = {
  distribucion_clinica_anexas: [
    // en el texto aparece "1.20" en el primer rango, pero por consistencia es 1:20.
    "1:20",
    "1:20",
    "1:20",
    "1:20",
    "1:20",
    "1:20",
    "1:20",
    "1:20",
  ],
  distribucion_casino: [
    "1:50",
    "1:100",
    "1:100",
    "1:100",
    "1:100",
    "1:100",
    "1:100",
    "1:100",
  ],
} as const;

export function pickRange(value: number, ranges: Range[]) {
  const v = Math.max(0, value);
  for (const r of ranges) {
    if (r.max == null) {
      if (v >= r.min) return r;
    } else if (v >= r.min && v <= r.max) {
      return r;
    }
  }
  // fallback
  return ranges[ranges.length - 1];
}

export function parseRatio(ratioLabel: string): number {
  // "1:50" -> 50
  const m = ratioLabel.match(/1\s*:\s*(\d+)/);
  if (!m) throw new Error(`Ratio inválido: ${ratioLabel}`);
  return Number(m[1]);
}

export function ucpComplexityFromRcd(rcd: number) {
  const v = Math.max(0, rcd);
  if (v <= 149) return "minima" as const;
  if (v <= 299) return "mediana" as const;
  return "maxima" as const;
}