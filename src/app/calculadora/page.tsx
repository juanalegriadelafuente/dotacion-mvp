// src/app/calculadora/page.tsx
"use client";

import { track } from "@vercel/analytics";
import { useMemo, useRef, useState } from "react";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type DayInput = {
  open: boolean;
  hoursOpen: number;
  requiredPeople: number;
  shiftsPerDay: number;
  overlapMinutes: number;
  breakMinutes: number;
};

type ContractType = { name: string; hoursPerWeek: number };

type AllowedJornadas = {
  FT_6X1: boolean;
  FT_5X2: boolean;
  FT_4X3: boolean;
  PT_WEEKEND: boolean;
  PT_3DAYS: boolean;
};

type CalcInput = {
  requestId?: string;
  fullHoursPerWeek: number;
  fullTimeThresholdHours: number;
  fullTimeSundayAvailability: number;
  partTimeSundayAvailability: number;
  allowedJornadas: AllowedJornadas;
  days: Record<DayKey, DayInput>;
  contracts: ContractType[];
};

type CalcResponse = { ok: true; result: any } | { ok: false; error: string };

const DAY_LABEL: Record<DayKey, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
};

const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function defaultDays(): Record<DayKey, DayInput> {
  const base: DayInput = {
    open: true,
    hoursOpen: 12,
    requiredPeople: 2,
    shiftsPerDay: 2,
    overlapMinutes: 30,
    breakMinutes: 60,
  };
  const days = Object.fromEntries(DAY_ORDER.map((d) => [d, { ...base }])) as Record<DayKey, DayInput>;
  days.sun = { ...base, hoursOpen: 8, requiredPeople: 1 };
  return days;
}

function defaultAllowedJornadas(): AllowedJornadas {
  return {
    FT_6X1: true,
    FT_5X2: true,
    FT_4X3: true,
    PT_WEEKEND: true,
    PT_3DAYS: true,
  };
}

export default function CalculadoraPage() {
  const [fullHoursPerWeek, setFullHoursPerWeek] = useState(42);
  const [fullTimeThresholdHours, setFullTimeThresholdHours] = useState(30);
  const [fullTimeSundayAvailability, setFullTimeSundayAvailability] = useState(0.5);
  const [partTimeSundayAvailability, setPartTimeSundayAvailability] = useState(1.0);

  const [allowedJornadas, setAllowedJornadas] = useState<AllowedJornadas>(defaultAllowedJornadas());

  const [days, setDays] = useState<Record<DayKey, DayInput>>(defaultDays());

  const [contracts, setContracts] = useState<ContractType[]>([
    { name: "42h", hoursPerWeek: 42 },
    { name: "40h", hoursPerWeek: 40 },
    { name: "20h", hoursPerWeek: 20 },
    { name: "16h", hoursPerWeek: 16 },
  ]);

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<CalcResponse | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const input: CalcInput = useMemo(
    () => ({
      fullHoursPerWeek,
      fullTimeThresholdHours,
      fullTimeSundayAvailability,
      partTimeSundayAvailability,
      allowedJornadas,
      days,
      contracts,
    }),
    [
      fullHoursPerWeek,
      fullTimeThresholdHours,
      fullTimeSundayAvailability,
      partTimeSundayAvailability,
      allowedJornadas,
      days,
      contracts,
    ]
  );

  function updateDay(d: DayKey, patch: Partial<DayInput>) {
    setDays((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  }

  function applyToAll(patch: Partial<DayInput>) {
    setDays((prev) => {
      const out = { ...prev };
      for (const d of DAY_ORDER) out[d] = { ...out[d], ...patch };
      return out;
    });
  }

  function updateContract(i: number, patch: Partial<ContractType>) {
    setContracts((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function addContract() {
    setContracts((prev) => [...prev, { name: "Nuevo", hoursPerWeek: 10 }]);
  }

  function removeContract(i: number) {
    setContracts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleJornada(key: keyof AllowedJornadas) {
    setAllowedJornadas((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function onCalculate() {
    setLoading(true);
    setResp(null);

    // abort request anterior si existe (evita carreras)
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const requestId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const payload = { ...input, requestId };

    // Analytics (evento)
    track("calculate_clicked", {
      threshold: fullTimeThresholdHours,
      fullHoursPerWeek,
      reqId: requestId,
    });

    try {
      const r = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        cache: "no-store",
        signal: ac.signal,
        body: JSON.stringify(payload),
      });

      const data = (await r.json()) as CalcResponse;
      setResp(data);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setResp({ ok: false, error: e?.message ?? "Error" });
    } finally {
      setLoading(false);
    }
  }

  const result = resp && resp.ok ? resp.result : null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Calculadora de Dotación Retail</h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Completa tu semana y presiona <b>CALCULAR</b>. El motor propone mixes considerando jornada (5x2/6x1/4x3/PT)
        y el efecto domingo.
      </p>

      {/* Paso 1: Parámetros + Jornadas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Paso 1 — Parámetros</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              Full (h/sem)
              <div style={{ fontSize: 12, color: "#666" }}>Ej: 42 (máximo legal próximo).</div>
              <input
                type="number"
                value={fullHoursPerWeek}
                onChange={(e) => setFullHoursPerWeek(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Umbral full-time (h)
              <div style={{ fontSize: 12, color: "#666" }}>Desde cuántas horas se considera full (ej: 30).</div>
              <input
                type="number"
                value={fullTimeThresholdHours}
                onChange={(e) => setFullTimeThresholdHours(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Factor domingo full (&gt; umbral)
              <div style={{ fontSize: 12, color: "#666" }}>Ej: 0.5 (pierdes 2 domingos al mes).</div>
              <input
                type="number"
                step="0.1"
                value={fullTimeSundayAvailability}
                onChange={(e) => setFullTimeSundayAvailability(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Factor domingo part (≤ umbral)
              <div style={{ fontSize: 12, color: "#666" }}>Ej: 1.0 (pueden trabajar todos los domingos).</div>
              <input
                type="number"
                step="0.1"
                value={partTimeSundayAvailability}
                onChange={(e) => setPartTimeSundayAvailability(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => applyToAll({ shiftsPerDay: 2 })}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
            >
              2 turnos por día
            </button>
            <button
              onClick={() => applyToAll({ overlapMinutes: 30 })}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Traslape 30 min
            </button>
            <button
              onClick={() => applyToAll({ breakMinutes: 60 })}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Colación 60 min
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Paso 1.5 — Política de jornadas</h2>
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Marca lo que tu empresa permite. Esto cambia completamente los mixes.
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={allowedJornadas.FT_5X2} onChange={() => toggleJornada("FT_5X2")} />
              <div>
                <b>Full 5x2</b> <span style={{ color: "#666" }}>(cuerpo base típico)</span>
              </div>
            </label>

            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={allowedJornadas.FT_6X1} onChange={() => toggleJornada("FT_6X1")} />
              <div>
                <b>Full 6x1</b> <span style={{ color: "#666" }}>(útil para cobertura extendida)</span>
              </div>
            </label>

            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={allowedJornadas.FT_4X3} onChange={() => toggleJornada("FT_4X3")} />
              <div>
                <b>Full 4x3</b> <span style={{ color: "#666" }}>(solo si el contrato es ≤ 40h)</span>
              </div>
            </label>

            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={allowedJornadas.PT_WEEKEND} onChange={() => toggleJornada("PT_WEEKEND")} />
              <div>
                <b>PT fin de semana</b> <span style={{ color: "#666" }}>(Sáb+Dom fijo, típico 20h/16h)</span>
              </div>
            </label>

            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={allowedJornadas.PT_3DAYS} onChange={() => toggleJornada("PT_3DAYS")} />
              <div>
                <b>PT 3 días</b> <span style={{ color: "#666" }}>(flex, para empresas que lo permiten)</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Paso 2: Contratos */}
      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Paso 2 — Contratos</h2>
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {contracts.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 130px 90px", gap: 8 }}>
              <input
                value={c.name}
                onChange={(e) => updateContract(i, { name: e.target.value })}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
              <input
                type="number"
                value={c.hoursPerWeek}
                onChange={(e) => updateContract(i, { hoursPerWeek: Number(e.target.value) })}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
              <button
                onClick={() => removeContract(i)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #fca5a5",
                  background: "#fff",
                  color: "#991b1b",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        <button
          style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer", fontWeight: 800 }}
          onClick={addContract}
        >
          + Agregar contrato
        </button>
      </div>

      {/* Paso 3: Semana */}
      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Paso 3 — Semana (Lun a Dom)</h2>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 6 }}>Día</th>
                <th style={{ padding: 6 }}>Abierto</th>
                <th style={{ padding: 6 }}>Horas abierto</th>
                <th style={{ padding: 6 }}>Personas req.</th>
                <th style={{ padding: 6 }}>Turnos/día</th>
                <th style={{ padding: 6 }}>Traslape (min)</th>
                <th style={{ padding: 6 }}>Colación (min)</th>
              </tr>
            </thead>
            <tbody>
              {DAY_ORDER.map((d) => (
                <tr key={d} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: 6, fontWeight: 700 }}>{DAY_LABEL[d]}</td>
                  <td style={{ textAlign: "center", padding: 6 }}>
                    <input type="checkbox" checked={days[d].open} onChange={(e) => updateDay(d, { open: e.target.checked })} />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      type="number"
                      value={days[d].hoursOpen}
                      onChange={(e) => updateDay(d, { hoursOpen: Number(e.target.value) })}
                      style={{ width: 110, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      type="number"
                      value={days[d].requiredPeople}
                      onChange={(e) => updateDay(d, { requiredPeople: Number(e.target.value) })}
                      style={{ width: 140, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      type="number"
                      value={days[d].shiftsPerDay}
                      onChange={(e) => updateDay(d, { shiftsPerDay: Number(e.target.value) })}
                      style={{ width: 110, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      type="number"
                      value={days[d].overlapMinutes}
                      onChange={(e) => updateDay(d, { overlapMinutes: Number(e.target.value) })}
                      style={{ width: 130, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      type="number"
                      value={days[d].breakMinutes}
                      onChange={(e) => updateDay(d, { breakMinutes: Number(e.target.value) })}
                      style={{ width: 130, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={onCalculate}
          disabled={loading}
          style={{
            marginTop: 12,
            background: loading ? "#991b1b" : "#dc2626",
            color: "white",
            fontWeight: 900,
            padding: "14px 18px",
            borderRadius: 14,
            border: "2px solid #ef4444",
            boxShadow: "0 10px 24px rgba(220,38,38,0.25)",
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          {loading ? "CALCULANDO..." : "CALCULAR"}
        </button>
      </div>

      {/* Resultados */}
      <div style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Resultados</h2>

        {!resp && <p style={{ color: "#666" }}>Presiona <b>CALCULAR</b> para ver resultados.</p>}

        {resp && !resp.ok && (
          <div style={{ border: "1px solid #f99", borderRadius: 12, padding: 12, color: "#900", marginTop: 12 }}>
            Error: {resp.error}
          </div>
        )}

        {result && (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>
                Estimación: <span>{Number(result.fte).toFixed(2)}</span> FTE
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 6, color: "#333" }}>
                <div><b>Horas requeridas:</b> {result.requiredHours}</div>
                <div><b>Brecha colación vs traslape:</b> {result.gapHours}</div>
                <div><b>Domingo requerido:</b> {result.sundayReq}</div>
                {result.requestId && (
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Debug requestId: <b>{result.requestId}</b> (debería cambiar cada cálculo)
                  </div>
                )}
              </div>

              {result.warnings?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 900 }}>Avisos</div>
                  <ul style={{ marginTop: 6, color: "#444" }}>
                    {result.warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {result.mixes?.map((m: any, idx: number) => (
                <div key={idx} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                  <h3 style={{ margin: 0, fontWeight: 900 }}>{m.title}</h3>

                  <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                    <div><b>Total personas:</b> {m.headcount}</div>
                    <div>
                      <b>Horas totales:</b> {m.hoursTotal}{" "}
                      <span style={{ color: "#666" }}>
                        (holgura {m.slackHours} / {Math.round(m.slackPct * 100)}%)
                      </span>
                    </div>
                    <div>
                      <b>Domingo:</b> capacidad {m.sundayCap} / requerido {m.sundayReq}{" "}
                      <span style={{ fontWeight: 900 }}>{m.sundayOk ? "✅" : "❌"}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, fontWeight: 900 }}>Composición</div>
                  <ul style={{ marginTop: 6 }}>
                    {m.items.map((it: any, j: number) => (
                      <li key={j}>
                        {it.count} × {it.contractName}{" "}
                        <span style={{ color: "#666" }}>
                          ({it.jornada}, {it.hoursPerWeek}h/sem, factor dom {it.sundayFactor})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 18, color: "#777", fontSize: 12 }}>
          Dotaciones.cl — MVP v0.2
        </div>
      </div>
    </div>
  );
}