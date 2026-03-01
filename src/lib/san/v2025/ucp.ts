// src/lib/san/v2025/ucp.ts
import { COMMON_RANGES, TABLE_4, TABLE_5, parseRatio, pickRange } from "./tables";
import { round1, applyFinalRounding, enforceUcpMinimum } from "./rounding";
import { AreaStaff, RoundingMode, TraceStep } from "./types";

function computeArea(
  area: AreaStaff["area"],
  basis: AreaStaff["basis"],
  value: number,
  ratios: readonly string[],
  roundingMode: RoundingMode
): { staff: AreaStaff; trace: TraceStep } {
  const r = pickRange(value, COMMON_RANGES);
  const ratioLabel = ratios[COMMON_RANGES.indexOf(r)] ?? ratios[ratios.length - 1];
  const denom = parseRatio(ratioLabel);

  const raw = value / denom;
  const raw1 = round1(raw);

  // por área: dejamos raw1 (normativo pide 1 decimal)
  const applied =
    roundingMode === "conservador" ? Math.ceil(raw1) : raw1;

  return {
    staff: {
      area,
      basis,
      rangeLabel: r.label,
      ratioLabel,
      raw: raw1,
      applied,
    },
    trace: {
      key: `ucp.${area}`,
      label: `UCP ${area} (${basis})`,
      data: { value, range: r.label, ratioLabel, denom, raw: raw1, applied },
    },
  };
}

export function computeUcpStaff(params: {
  rcd: number;
  rtdPatients: number;
  rtdCasino: number;
  roundingMode: RoundingMode;
}): {
  byArea: AreaStaff[];
  totalFte44_raw: number;
  totalFte44_applied: number;
  trace: TraceStep[];
} {
  const { rcd, rtdPatients, rtdCasino, roundingMode } = params;

  const out: AreaStaff[] = [];
  const trace: TraceStep[] = [];

  // Tabla 4 (RCD)
  for (const area of ["recepcion_almacenamiento", "produccion", "lavado"] as const) {
    const ratios = TABLE_4[area];
    const { staff, trace: t } = computeArea(area, "RCD", rcd, ratios, roundingMode);
    out.push(staff);
    trace.push(t);
  }

  // Tabla 5 (RTD)
  {
    const { staff, trace: t } = computeArea(
      "distribucion_clinica_anexas",
      "RTD",
      rtdPatients,
      TABLE_5.distribucion_clinica_anexas,
      roundingMode
    );
    out.push(staff);
    trace.push(t);
  }
  {
    const { staff, trace: t } = computeArea(
      "distribucion_casino",
      "RTD",
      rtdCasino,
      TABLE_5.distribucion_casino,
      roundingMode
    );
    out.push(staff);
    trace.push(t);
  }

  const totalRaw = round1(out.reduce((s, a) => s + a.raw, 0));

  // Regla del doc: aproximación al total (normativo) + mínimo 3 UCP
  const totalAppliedPreMin = applyFinalRounding(totalRaw, roundingMode);
  const totalApplied = enforceUcpMinimum(totalAppliedPreMin);

  trace.push({
    key: "ucp.total",
    label: "UCP total (FTE_44)",
    data: { totalRaw, totalAppliedPreMin, totalApplied, roundingMode, minRule: ">=3" },
  });

  return {
    byArea: out,
    totalFte44_raw: totalRaw,
    totalFte44_applied: totalApplied,
    trace,
  };
}