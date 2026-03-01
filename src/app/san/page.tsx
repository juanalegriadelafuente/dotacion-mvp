// src/app/san/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ApiResp = { ok: true; result: any } | { ok: false; error: string };
type MixApiResp = { ok: true; result: any } | { ok: false; error: string };

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type DayConfig = {
  open: boolean;
  hoursOpen: number;
  requiredPeople: number;
  overlapMinutes: number;
  breakMinutes: number;
};

const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function dayLabel(d: DayKey) {
  return (
    {
      mon: "Lun",
      tue: "Mar",
      wed: "Mié",
      thu: "Jue",
      fri: "Vie",
      sat: "Sáb",
      sun: "Dom",
    }[d] ?? d
  );
}

function safeNum(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function areaLabel(area: string) {
  switch (area) {
    case "recepcion_almacenamiento":
      return "Recepción / Almacenamiento";
    case "produccion":
      return "Producción";
    case "lavado":
      return "Lavado";
    case "distribucion_clinica_anexas":
      return "Distribución (Clínica + Anexas)";
    case "distribucion_casino":
      return "Distribución (Casino)";
    default:
      return area;
  }
}

function pct(x: number) {
  if (!Number.isFinite(x)) return "0%";
  return `${Math.round(x * 100)}%`;
}

export default function SanPage() {
  const [maxWeekHours, setMaxWeekHours] = useState<44 | 42 | 40>(42);
  const [roundingMode, setRoundingMode] = useState<"normativo" | "conservador">(
    "normativo"
  );

  // ---- RTD directos ----
  const [rtdPatients, setRtdPatients] = useState<number>(0);
  const [rtdCasino, setRtdCasino] = useState<number>(0);

  // ---- RTD por comidas (CR) ----
  const [useMeals, setUseMeals] = useState<boolean>(false);
  const [pDes, setPDes] = useState(0);
  const [pColAm, setPColAm] = useState(0);
  const [pAlm, setPAlm] = useState(0);
  const [pOnce, setPOnce] = useState(0);
  const [pCen, setPCen] = useState(0);
  const [cDes, setCDes] = useState(0);
  const [cAlm, setCAlm] = useState(0);
  const [cCen, setCCen] = useState(0);

  // ---- RCD ----
  const [rcd, setRcd] = useState<number>(0);

  // ---- RCD avanzado (RTD + FC) ----
  const [advanced, setAdvanced] = useState<boolean>(false);
  const [rtdTotal, setRtdTotal] = useState<number>(0);

  const [useExtraLines, setUseExtraLines] = useState<boolean>(false);
  const [extraMealsPerDay, setExtraMealsPerDay] = useState<number>(0);

  const [useVeg, setUseVeg] = useState<boolean>(false);
  const [vegPercent, setVegPercent] = useState<number>(0);

  // ---- Clínica ----
  const [bedsBasic, setBedsBasic] = useState<number>(0);
  const [bedsMedium, setBedsMedium] = useState<number>(0);
  const [bedsCritical, setBedsCritical] = useState<number>(0);

  // ---- Operación (horario simple) ----
  const [days, setDays] = useState<Record<DayKey, DayConfig>>({
    mon: { open: true, hoursOpen: 10, requiredPeople: 6, overlapMinutes: 0, breakMinutes: 30 },
    tue: { open: true, hoursOpen: 10, requiredPeople: 6, overlapMinutes: 0, breakMinutes: 30 },
    wed: { open: true, hoursOpen: 10, requiredPeople: 6, overlapMinutes: 0, breakMinutes: 30 },
    thu: { open: true, hoursOpen: 10, requiredPeople: 6, overlapMinutes: 0, breakMinutes: 30 },
    fri: { open: true, hoursOpen: 10, requiredPeople: 6, overlapMinutes: 0, breakMinutes: 30 },
    sat: { open: true, hoursOpen: 8, requiredPeople: 4, overlapMinutes: 0, breakMinutes: 30 },
    sun: { open: true, hoursOpen: 8, requiredPeople: 4, overlapMinutes: 0, breakMinutes: 30 },
  });

  function setDay(d: DayKey, patch: Partial<DayConfig>) {
    setDays((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  }

  // ---- Selección PRO (como retail) ----
  const [allowedContracts, setAllowedContracts] = useState<number[]>([
    44, 42, 40, 30, 20,
  ]);
  const [allowedJornadas, setAllowedJornadas] = useState({
    allow_6x1: true,
    allow_5x2: true,
    allow_4x3: true,
    allow_pt_weekend: true,
  });
  const [ptMaxShare, setPtMaxShare] = useState<number>(0.25);

  function toggleContract(h: number) {
    setAllowedContracts((prev) =>
      prev.includes(h)
        ? prev.filter((x) => x !== h)
        : [...prev, h].sort((a, b) => b - a)
    );
  }

  const payload = useMemo(() => {
    return {
      scenario: { maxWeekHours, roundingMode },

      rtdPatients: useMeals ? undefined : rtdPatients,
      rtdCasino: useMeals ? undefined : rtdCasino,

      rtdMeals: useMeals
        ? {
            enabled: true,
            integerMode: roundingMode === "conservador" ? "ceil" : "round",
            patients: {
              desayuno: pDes,
              colacion_am: pColAm,
              almuerzo: pAlm,
              once: pOnce,
              cena: pCen,
            },
            casino: {
              desayuno: cDes,
              almuerzo: cAlm,
              cena: cCen,
            },
          }
        : undefined,

      rcd: advanced ? undefined : rcd,

      rtdTotal: advanced ? rtdTotal : undefined,
      factors: advanced
        ? {
            extraProductionLines: { enabled: useExtraLines, extraMealsPerDay },
            vegUnprocessedShare: { enabled: useVeg, percent: vegPercent },
          }
        : undefined,

      bedsBasic,
      bedsMedium,
      bedsCritical,
    };
  }, [
    maxWeekHours,
    roundingMode,
    useMeals,
    rtdPatients,
    rtdCasino,
    pDes,
    pColAm,
    pAlm,
    pOnce,
    pCen,
    cDes,
    cAlm,
    cCen,
    advanced,
    rcd,
    rtdTotal,
    useExtraLines,
    extraMealsPerDay,
    useVeg,
    vegPercent,
    bedsBasic,
    bedsMedium,
    bedsCritical,
  ]);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);

  const [mixLoading, setMixLoading] = useState(false);
  const [mixResp, setMixResp] = useState<MixApiResp | null>(null);

  async function runSan() {
    setLoading(true);
    setResp(null);
    try {
      const r = await fetch("/api/san", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await r.json()) as ApiResp;
      setResp(data);
    } catch (e: any) {
      setResp({ ok: false, error: e?.message ?? "Error inesperado" });
    } finally {
      setLoading(false);
    }
  }

  async function generateMixPro() {
    setMixLoading(true);
    setMixResp(null);

    try {
      const daysPayload: any = {};
      for (const d of DAY_ORDER) {
        const di = days[d];
        daysPayload[d] = {
          open: !!di.open,
          hoursOpen: safeNum(di.hoursOpen),
          requiredPeople: safeNum(di.requiredPeople),
          overlapMinutes: safeNum(di.overlapMinutes),
          breakMinutes: safeNum(di.breakMinutes),
        };
      }

      const r = await fetch("/api/san/mix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: { maxWeekHours },
          days: daysPayload,
          allowedContracts,
          allowedJornadas,
          ptMaxShare,
        }),
      });

      const data = (await r.json()) as MixApiResp;
      setMixResp(data);
    } catch (e: any) {
      setMixResp({ ok: false, error: e?.message ?? "Error generando mix" });
    } finally {
      setMixLoading(false);
    }
  }

  async function downloadExcel() {
    setExporting(true);
    try {
      const exportBody = {
        ...payload,
        days,
        allowedContracts,
        allowedJornadas,
        ptMaxShare,
      };

      const r = await fetch("/api/san/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportBody),
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || `No se pudo generar el Excel (HTTP ${r.status})`);
      }

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SAN_dotacion.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? "Error descargando Excel");
    } finally {
      setExporting(false);
    }
  }

  const sanResult = resp && resp.ok ? resp.result : null;
  const mixResult = mixResp && mixResp.ok ? mixResp.result : null;

  return (
    <main className="container" style={{ paddingTop: 18 }}>
      <h1 className="h2">Calculadora SAN (Hospitalaria)</h1>
      <div className="small" style={{ marginTop: 6 }}>
        PRO: 1) Normativa SAN. 2) Operación (horario). 3) Mix (FT primero, PT solo para cerrar brechas).
      </div>

      <div className="small" style={{ marginTop: 8 }}>
        <Link href="/san/glosario">Ver glosario de siglas (RTD, RCD, FC, CR…)</Link>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardPad">
          {/* Escenario */}
          <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label className="label">Escenario jornada máxima</label>
              <select
                className="input"
                value={maxWeekHours}
                onChange={(e) => setMaxWeekHours(Number(e.target.value) as any)}
              >
                <option value={44}>44 horas</option>
                <option value={42}>42 horas</option>
                <option value={40}>40 horas</option>
              </select>
            </div>

            <div className="field">
              <label className="label">Modo de redondeo</label>
              <select
                className="input"
                value={roundingMode}
                onChange={(e) => setRoundingMode(e.target.value as any)}
              >
                <option value="normativo">Normativo</option>
                <option value="conservador">Conservador (anti-riesgo)</option>
              </select>
            </div>
          </div>

          <div className="hr" style={{ marginTop: 14 }} />

          {/* Selección PRO */}
          <h2 className="h3" style={{ marginTop: 10 }}>Selección PRO (como retail)</h2>

          <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 10 }}>
            <div className="field">
              <div className="label">Jornadas permitidas</div>
              <div className="small" style={{ marginTop: 6, display: "grid", gap: 6 }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={allowedJornadas.allow_6x1}
                    onChange={(e) =>
                      setAllowedJornadas((p) => ({ ...p, allow_6x1: e.target.checked }))
                    }
                  />
                  6x1
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={allowedJornadas.allow_5x2}
                    onChange={(e) =>
                      setAllowedJornadas((p) => ({ ...p, allow_5x2: e.target.checked }))
                    }
                  />
                  5x2
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={allowedJornadas.allow_4x3}
                    onChange={(e) =>
                      setAllowedJornadas((p) => ({ ...p, allow_4x3: e.target.checked }))
                    }
                  />
                  4x3 (solo 40h)
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={allowedJornadas.allow_pt_weekend}
                    onChange={(e) =>
                      setAllowedJornadas((p) => ({ ...p, allow_pt_weekend: e.target.checked }))
                    }
                  />
                  PT fin de semana
                </label>
              </div>
            </div>

            <div className="field">
              <div className="label">Contratos permitidos</div>
              <div className="small" style={{ marginTop: 6, display: "grid", gap: 6 }}>
                {[44, 42, 40, 30, 20].map((h) => (
                  <label key={h} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={allowedContracts.includes(h)}
                      onChange={() => toggleContract(h)}
                    />
                    {h}h/sem
                  </label>
                ))}
              </div>

              <div className="hr" style={{ marginTop: 12 }} />

              <label className="label">Política hospital: máximo % PT</label>
              <input
                className="input"
                type="number"
                value={Math.round(ptMaxShare * 100)}
                onChange={(e) =>
                  setPtMaxShare(Math.max(0, Math.min(1, safeNum(e.target.value) / 100)))
                }
                style={{ textAlign: "right" }}
              />
              <div className="small">Recomendado 25%. PT se usa solo para cerrar brechas.</div>
            </div>
          </div>

          <div className="hr" style={{ marginTop: 14 }} />

          {/* Etapa 1 (normativa) — se deja como ya la tenías */}
          <h2 className="h3" style={{ marginTop: 10 }}>Etapa 1 — Normativa SAN</h2>

          <div className="field" style={{ marginTop: 8 }}>
            <label className="label" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={useMeals} onChange={(e) => setUseMeals(e.target.checked)} />
              Calcular RTD desde tiempos de comida (CR)
            </label>
          </div>

          {!useMeals ? (
            <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 10 }}>
              <div className="field">
                <label className="label">RTD pacientes + anexas</label>
                <input className="input" type="number" value={rtdPatients} onChange={(e) => setRtdPatients(Number(e.target.value))} />
              </div>
              <div className="field">
                <label className="label">RTD casino</label>
                <input className="input" type="number" value={rtdCasino} onChange={(e) => setRtdCasino(Number(e.target.value))} />
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="cardPad">
                <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="field">
                    <label className="label">Pacientes: Desayuno</label>
                    <input className="input" type="number" value={pDes} onChange={(e) => setPDes(Number(e.target.value))} />
                  </div>
                  <div className="field">
                    <label className="label">Pacientes: Colación AM</label>
                    <input className="input" type="number" value={pColAm} onChange={(e) => setPColAm(Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 10 }}>
                  <div className="field">
                    <label className="label">Pacientes: Almuerzo</label>
                    <input className="input" type="number" value={pAlm} onChange={(e) => setPAlm(Number(e.target.value))} />
                  </div>
                  <div className="field">
                    <label className="label">Pacientes: Once</label>
                    <input className="input" type="number" value={pOnce} onChange={(e) => setPOnce(Number(e.target.value))} />
                  </div>
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <label className="label">Pacientes: Cena</label>
                  <input className="input" type="number" value={pCen} onChange={(e) => setPCen(Number(e.target.value))} />
                </div>

                <div className="hr" style={{ marginTop: 12 }} />

                <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="field">
                    <label className="label">Casino: Desayuno</label>
                    <input className="input" type="number" value={cDes} onChange={(e) => setCDes(Number(e.target.value))} />
                  </div>
                  <div className="field">
                    <label className="label">Casino: Almuerzo</label>
                    <input className="input" type="number" value={cAlm} onChange={(e) => setCAlm(Number(e.target.value))} />
                  </div>
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <label className="label">Casino: Cena</label>
                  <input className="input" type="number" value={cCen} onChange={(e) => setCCen(Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}

          <div className="hr" style={{ marginTop: 14 }} />

          <div className="field">
            <label className="label" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
              RCD avanzado (RTD + FC)
            </label>
          </div>

          {!advanced ? (
            <div className="field" style={{ marginTop: 10 }}>
              <label className="label">RCD (directo)</label>
              <input className="input" type="number" value={rcd} onChange={(e) => setRcd(Number(e.target.value))} />
            </div>
          ) : (
            <>
              <div className="field" style={{ marginTop: 10 }}>
                <label className="label">RTD total (base para RCD)</label>
                <input className="input" type="number" value={rtdTotal} onChange={(e) => setRtdTotal(Number(e.target.value))} />
              </div>

              <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 10 }}>
                <div className="field">
                  <label className="label" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={useExtraLines} onChange={(e) => setUseExtraLines(e.target.checked)} />
                    FC líneas adicionales
                  </label>
                  <input
                    className="input"
                    type="number"
                    value={extraMealsPerDay}
                    onChange={(e) => setExtraMealsPerDay(Number(e.target.value))}
                    disabled={!useExtraLines}
                  />
                </div>

                <div className="field">
                  <label className="label" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={useVeg} onChange={(e) => setUseVeg(e.target.checked)} />
                    FC vegetal sin procesar (%)
                  </label>
                  <input
                    className="input"
                    type="number"
                    value={vegPercent}
                    onChange={(e) => setVegPercent(Number(e.target.value))}
                    disabled={!useVeg}
                  />
                </div>
              </div>
            </>
          )}

          <div className="hr" style={{ marginTop: 14 }} />

          <h3 className="h3" style={{ marginTop: 10 }}>Clínica (Nutricionistas)</h3>
          <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label className="label">Camas básico</label>
              <input className="input" type="number" value={bedsBasic} onChange={(e) => setBedsBasic(Number(e.target.value))} />
            </div>
            <div className="field">
              <label className="label">Camas medio</label>
              <input className="input" type="number" value={bedsMedium} onChange={(e) => setBedsMedium(Number(e.target.value))} />
            </div>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label className="label">Camas crítico</label>
            <input className="input" type="number" value={bedsCritical} onChange={(e) => setBedsCritical(Number(e.target.value))} />
          </div>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" disabled={loading} onClick={runSan}>
              {loading ? "Calculando…" : "Calcular normativa SAN"}
            </button>
          </div>

          {resp ? (
            <div style={{ marginTop: 14 }}>
              {!resp.ok ? (
                <div className="alert alertError">❌ {resp.error}</div>
              ) : (
                <div className="card" style={{ marginTop: 10 }}>
                  <div className="cardPad">
                    <div className="h3">Resultado normativa</div>
                    <div className="small" style={{ marginTop: 6 }}>
                      Horas/semana requeridas (base 44h): <b>{sanResult.totalHoursPerWeek_required}</b><br />
                      FTE equivalente (sobre {maxWeekHours}): <b>{sanResult.totalFte_equivalent}</b>
                    </div>

                    <div className="hr" style={{ marginTop: 12 }} />

                    <div className="h3">UCP por área</div>
                    <div style={{ overflowX: "auto", marginTop: 8 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Área</th>
                            <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Aplicado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sanResult.ucpStaffByArea.map((a: any) => (
                            <tr key={a.area}>
                              <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>{areaLabel(a.area)}</td>
                              <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2", textAlign: "right" }}>{a.applied}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="hr" style={{ marginTop: 18 }} />

          {/* Operación + Mix PRO */}
          <h2 className="h3" style={{ marginTop: 10 }}>Etapa 2 — Operación (horario) + Mix PRO</h2>

          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Día</th>
                  <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #eee" }}>Abierto</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Horas</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Personas</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Colación</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Traslape</th>
                </tr>
              </thead>
              <tbody>
                {DAY_ORDER.map((d) => {
                  const di = days[d];
                  return (
                    <tr key={d}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>{dayLabel(d)}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2", textAlign: "center" }}>
                        <input type="checkbox" checked={di.open} onChange={(e) => setDay(d, { open: e.target.checked })} />
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>
                        <input className="input" type="number" value={di.hoursOpen} disabled={!di.open}
                          onChange={(e) => setDay(d, { hoursOpen: safeNum(e.target.value) })}
                          style={{ width: 120, textAlign: "right" }}
                        />
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>
                        <input className="input" type="number" value={di.requiredPeople} disabled={!di.open}
                          onChange={(e) => setDay(d, { requiredPeople: safeNum(e.target.value) })}
                          style={{ width: 120, textAlign: "right" }}
                        />
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>
                        <input className="input" type="number" value={di.breakMinutes} disabled={!di.open}
                          onChange={(e) => setDay(d, { breakMinutes: safeNum(e.target.value) })}
                          style={{ width: 120, textAlign: "right" }}
                        />
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>
                        <input className="input" type="number" value={di.overlapMinutes} disabled={!di.open}
                          onChange={(e) => setDay(d, { overlapMinutes: safeNum(e.target.value) })}
                          style={{ width: 120, textAlign: "right" }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnPrimary" disabled={mixLoading} onClick={generateMixPro}>
              {mixLoading ? "Generando mix…" : "Generar mix PRO (hospital)"}
            </button>

            <button className="btn btnPrimary" disabled={exporting} onClick={downloadExcel}>
              {exporting ? "Generando Excel…" : "Descargar Excel PRO (incluye operación + mix)"}
            </button>
          </div>

          {mixResp ? (
            <div style={{ marginTop: 14 }}>
              {!mixResp.ok ? (
                <div className="alert alertError">❌ {mixResp.error}</div>
              ) : (
                <div className="card" style={{ marginTop: 10 }}>
                  <div className="cardPad">
                    <div className="h3">Resultado mix hospital (FT primero)</div>
                    <div className="small" style={{ marginTop: 6 }}>
                      Horas requeridas operación: <b>{mixResult.requiredHours}</b> — FTE:{" "}
                      <b>{mixResult.fte}</b> — PT max: <b>{pct(mixResult.ptMaxShare)}</b>
                    </div>

                    {Array.isArray(mixResult.warnings) && mixResult.warnings.length ? (
                      <div className="alert alertError" style={{ marginTop: 12 }}>
                        ⚠️ {mixResult.warnings.join(" | ")}
                      </div>
                    ) : null}

                    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                      {(mixResult.mixes ?? []).map((m: any, i: number) => {
                        const breakdown = Array.isArray(m.dayBreakdown) ? m.dayBreakdown : [];
                        const maxBrecha = breakdown.reduce((mx: number, r: any) => {
                          const v = safeNum(r?.remaining);
                          return v > mx ? v : mx;
                        }, 0);

                        return (
                          <div key={i} className="card">
                            <div className="cardPad">
                              <div className="h3" style={{ margin: 0 }}>
                                {m.title ?? `Mix ${i + 1}`}
                              </div>
                              <div className="small" style={{ marginTop: 6 }}>
                                Personas: <b>{m.headcount}</b> — Horas:{" "}
                                <b>{m.hoursTotal}</b> — Holgura: <b>{m.slackHours}</b> — PT share:{" "}
                                <b>{pct(m.ptShare ?? 0)}</b>
                                {" — "}
                                <span>
                                  Brecha máxima (hrs-persona/día):{" "}
                                  <b>{Math.round(maxBrecha * 10) / 10}</b>
                                </span>
                              </div>

                              {/* Tabla mix */}
                              <div style={{ overflowX: "auto", marginTop: 8 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Jornada</th>
                                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Contrato</th>
                                      <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Horas/sem</th>
                                      <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Cantidad</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(m.items ?? []).map((it: any, j: number) => (
                                      <tr key={j}>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>{it.jornadaLabel}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>{it.contractName}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2", textAlign: "right" }}>{it.hoursPerWeek}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2", textAlign: "right" }}>{it.count}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Cobertura por día */}
                              {breakdown.length ? (
                                <details style={{ marginTop: 12 }}>
                                  <summary className="small" style={{ cursor: "pointer" }}>
                                    Ver cobertura por día (demanda vs cubre vs brecha)
                                  </summary>

                                  <div style={{ overflowX: "auto", marginTop: 8 }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                      <thead>
                                        <tr>
                                          <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Día</th>
                                          <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Demanda</th>
                                          <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Cubre</th>
                                          <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Brecha</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {breakdown.map((r: any, k: number) => {
                                          const brecha = safeNum(r?.remaining);
                                          const warn = brecha > 0.001;
                                          return (
                                            <tr key={k}>
                                              <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>{r.day}</td>
                                              <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2", textAlign: "right" }}>{r.demand}</td>
                                              <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2", textAlign: "right" }}>{r.supply}</td>
                                              <td
                                                style={{
                                                  padding: 8,
                                                  borderBottom: "1px solid #f2f2f2",
                                                  textAlign: "right",
                                                  fontWeight: warn ? 700 : 400,
                                                }}
                                              >
                                                {r.remaining}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="small" style={{ marginTop: 8 }}>
                                    Nota: Brecha &gt; 0 indica horas-persona sin cubrir en ese día (riesgo operacional).
                                  </div>
                                </details>
                              ) : (
                                <div className="small" style={{ marginTop: 10 }}>
                                  (Aún no llegó dayBreakdown desde el motor. Revisa que /api/calculate esté actualizado.)
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}