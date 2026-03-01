// src/lib/san/v2025/index.ts
import { computeUcpStaff } from "./ucp";
import { computeClinicalDietitians } from "./clinical";
import { ucpComplexityFromRcd } from "./tables";
import { round1 } from "./rounding";
import type { SanInput, SanResult, TraceStep } from "./types";
import { computeRcdFromRtd } from "./rcd";
import { computeRtdFromMeals } from "./rtd";

function n0(x: any) {
  const v = Number(x);
  return Number.isFinite(v) ? Math.max(0, v) : 0;
}

export function computeSAN2025(input: SanInput): SanResult {
  const trace: TraceStep[] = [];

  const scenario = input.scenario;
  const maxWeekHours = Number(scenario.maxWeekHours);
  if (!Number.isFinite(maxWeekHours) || maxWeekHours <= 0) {
    throw new Error("scenario.maxWeekHours inválido");
  }

  // -------- RTD --------
  let rtdPatients = n0(input.rtdPatients ?? 0);
  let rtdCasino = n0(input.rtdCasino ?? 0);
  let rtdTotal = rtdPatients + rtdCasino;

  if (input.rtdMeals?.enabled) {
    const r = computeRtdFromMeals(input.rtdMeals);
    rtdPatients = r.patientsRTD;
    rtdCasino = r.casinoRTD;
    rtdTotal = r.totalRTD;

    trace.push({
      key: "rtd.meals",
      label: "RTD calculada desde tiempos de comida (CR)",
      data: r.details,
    });
  }

  // -------- RCD --------
  let rcd = n0(input.rcd ?? 0);
  let usedAdvancedRcd = false;

  // prioridad:
  // 1) si viene input.rtdTotal => usar ese para RCD
  // 2) si viene rtdMeals => usar rtdTotal calculado
  // 3) si no => usar rcd directo
  const rtdBaseForRcd =
    input.rtdTotal !== undefined && input.rtdTotal !== null
      ? n0(input.rtdTotal)
      : input.rtdMeals?.enabled
        ? rtdTotal
        : null;

  if (rtdBaseForRcd !== null) {
    const adv = computeRcdFromRtd({ rtd: rtdBaseForRcd, factors: input.factors });
    rcd = adv.rcd;
    usedAdvancedRcd = true;

    trace.push({
      key: "rcd.advanced",
      label: "RCD calculada desde RTD + FC",
      data: {
        rtdBaseForRcd,
        multiplier: adv.multiplier,
        factors: adv.factors,
        rcd: adv.rcd,
      },
    });
  }

  trace.push({
    key: "input.normalized",
    label: "Inputs normalizados",
    data: {
      scenario,
      rtdPatients,
      rtdCasino,
      rtdTotal,
      rcd,
      usedAdvancedRcd,
      bedsBasic: input.bedsBasic,
      bedsMedium: input.bedsMedium,
      bedsCritical: input.bedsCritical,
    },
  });

  // -------- Complejidad UCP --------
  const ucpComplexity = ucpComplexityFromRcd(rcd);
  trace.push({
    key: "ucp.complexity",
    label: "Complejidad UCP (por RCD)",
    data: { rcd, ucpComplexity },
  });

  // -------- UCP --------
  const ucp = computeUcpStaff({
    rcd,
    rtdPatients,
    rtdCasino,
    roundingMode: scenario.roundingMode,
  });
  trace.push(...ucp.trace);

  // -------- Clínica --------
  const clinical = computeClinicalDietitians({
    bedsBasic: input.bedsBasic,
    bedsMedium: input.bedsMedium,
    bedsCritical: input.bedsCritical,
    roundingMode: scenario.roundingMode,
  });
  trace.push(...clinical.trace);

  // -------- Totales --------
  const totalFte44_applied = ucp.totalFte44_applied + clinical.fte44_applied;
  const totalHoursPerWeek_required = totalFte44_applied * 44;
  const totalFte_equivalent = round1(totalHoursPerWeek_required / maxWeekHours);

  trace.push({
    key: "scenario.convert",
    label: "Conversión 44h → escenario",
    data: {
      totalFte44_applied,
      totalHoursPerWeek_required,
      maxWeekHours,
      totalFte_equivalent,
    },
  });

  return {
    rtdPatients,
    rtdCasino,
    rtdTotal,
    rcd,
    ucpComplexity,
    ucpStaffByArea: ucp.byArea,
    ucpTotalFte44_raw: ucp.totalFte44_raw,
    ucpTotalFte44_applied: ucp.totalFte44_applied,
    clinicalDietitiansFte44_raw: clinical.fte44_raw,
    clinicalDietitiansFte44_applied: clinical.fte44_applied,
    totalHoursPerWeek_required,
    totalFte_equivalent,
    hoursToCoverPerWeek: totalHoursPerWeek_required,
    trace,
  };
}