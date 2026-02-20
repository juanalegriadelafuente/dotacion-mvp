// src/app/calculadora/page.tsx
"use client";

import { useMemo, useState } from "react";

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

type CalcInput = {
  fullHoursPerWeek: number;
  fullTimeThresholdHours: number;
  fullTimeSundayAvailability: number;
  partTimeSundayAvailability: number;
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
  // domingo más chico por defecto
  days.sun = { ...base, hoursOpen: 8, requiredPeople: 1 };
  return days;
}

export default function CalculadoraPage() {
  const [fullHoursPerWeek, setFullHoursPerWeek] = useState(42);
  const [fullTimeThresholdHours, setFullTimeThresholdHours] = useState(30);
  const [fullTimeSundayAvailability, setFullTimeSundayAvailability] = useState(0.5);
  const [partTimeSundayAvailability, setPartTimeSundayAvailability] = useState(1.0);

  const [days, setDays] = useState<Record<DayKey, DayInput>>(defaultDays());

  const [contracts, setContracts] = useState<ContractType[]>([
    { name: "42h", hoursPerWeek: 42 },
    { name: "36h", hoursPerWeek: 36 },
    { name: "30h", hoursPerWeek: 30 },
    { name: "20h", hoursPerWeek: 20 },
    { name: "16h", hoursPerWeek: 16 },
  ]);

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<CalcResponse | null>(null);

  const input: CalcInput = useMemo(
    () => ({
      fullHoursPerWeek,
      fullTimeThresholdHours,
      fullTimeSundayAvailability,
      partTimeSundayAvailability,
      days,
      contracts,
    }),
    [fullHoursPerWeek, fullTimeThresholdHours, fullTimeSundayAvailability, partTimeSundayAvailability, days, contracts]
  );

  async function onCalculate() {
    setLoading(true);
    setResp(null);
    try {
      const r = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await r.json()) as CalcResponse;
      setResp(data);
    } catch (e: any) {
      setResp({ ok: false, error: e?.message ?? "Error" });
    } finally {
      setLoading(false);
    }
  }

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

  function loadRetailExample() {
    setFullHoursPerWeek(42);
    setFullTimeThresholdHours(30);
    setFullTimeSundayAvailability(0.5);
    setPartTimeSundayAvailability(1.0);

    // Semana típica: 2 personas casi todo el día; viernes algo más; domingo más corto.
    setDays(() => {
      const base: DayInput = {
        open: true,
        hoursOpen: 12,
        requiredPeople: 2,
        shiftsPerDay: 2,
        overlapMinutes: 30,
        breakMinutes: 60,
      };
      const out = Object.fromEntries(DAY_ORDER.map((d) => [d, { ...base }])) as Record<DayKey, DayInput>;
      out.fri = { ...base, hoursOpen: 13, requiredPeople: 3 };
      out.sun = { ...base, hoursOpen: 8, requiredPeople: 1 };
      return out;
    });

    setContracts([
      { name: "42h", hoursPerWeek: 42 },
      { name: "36h", hoursPerWeek: 36 },
      { name: "30h", hoursPerWeek: 30 },
      { name: "20h", hoursPerWeek: 20 },
      { name: "16h", hoursPerWeek: 16 },
    ]);

    setResp(null);
  }

  const result = resp && resp.ok ? resp.result : null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Calculadora de Dotación Retail</h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Rellena tu semana y presiona <b>CALCULAR</b>. Te entregará un estimado de FTE (personas full-time equivalentes)
        y 2–3 propuestas de mix de contratos.
      </p>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={loadRetailExample}
          style={{
            background: "#111827",
            color: "white",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111827",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Cargar ejemplo retail típico
        </button>

        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "#111",
            fontWeight: 700,
          }}
        >
          Volver al inicio
        </a>
      </div>

      {/* PASO 1: Parámetros + Contratos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Paso 1 — Parámetros</h2>
            <span style={{ fontSize: 12, color: "#666" }}>Define reglas base</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              Full (h/sem)
              <div style={{ fontSize: 12, color: "#666" }}>
                Horas semanales de un contrato full típico (ej: 42).
              </div>
              <input
                type="number"
                value={fullHoursPerWeek}
                onChange={(e) => setFullHoursPerWeek(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Umbral full-time (h)
              <div style={{ fontSize: 12, color: "#666" }}>
                Desde cuántas horas semanales se considera full time para aplicar el “efecto domingo” (ej: 30h).
              </div>
              <input
                type="number"
                value={fullTimeThresholdHours}
                onChange={(e) => setFullTimeThresholdHours(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Domingo full (&gt; umbral)
              <div style={{ fontSize: 12, color: "#666" }}>
                Factor domingo para full time. Ej: 0.5 significa que “rinden la mitad” los domingos.
              </div>
              <input
                type="number"
                step="0.1"
                value={fullTimeSundayAvailability}
                onChange={(e) => setFullTimeSundayAvailability(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Domingo part (≤ umbral)
              <div style={{ fontSize: 12, color: "#666" }}>
                Factor domingo para part time. Normalmente 1.0 (sin castigo).
              </div>
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
              2 turnos por día (semana completa)
            </button>
            <button
              onClick={() => applyToAll({ overlapMinutes: 30 })}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Traslape 30 min (semana completa)
            </button>
            <button
              onClick={() => applyToAll({ breakMinutes: 60 })}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Colación 60 min (semana completa)
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            <b>Tip:</b> “Traslape” es el tiempo que se cruzan turnos (sirve para colación/cambio de turno).
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Paso 2 — Contratos</h2>
            <span style={{ fontSize: 12, color: "#666" }}>Define el set de contratos</span>
          </div>

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
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: 800,
            }}
            onClick={addContract}
          >
            + Agregar contrato
          </button>

          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            El motor probará combinaciones y te propondrá 2–3 mixes razonables para cubrir la semana.
          </div>
        </div>
      </div>

      {/* PASO 3: Semana */}
      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Paso 3 — Semana (Lun a Dom)</h2>
          <span style={{ fontSize: 12, color: "#666" }}>Qué necesitas cada día</span>
        </div>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 6 }}>Día</th>
                <th style={{ padding: 6 }}>Abierto</th>
                <th style={{ padding: 6 }}>Horas abierto</th>
                <th style={{ padding: 6 }}>Personas requeridas</th>
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
                    <input
                      type="checkbox"
                      checked={days[d].open}
                      onChange={(e) => updateDay(d, { open: e.target.checked })}
                    />
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

        {/* BOTÓN ROJO */}
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

        <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
          Si aparece “brecha por colación”, normalmente se resuelve subiendo el traslape o ajustando turnos.
        </div>
      </div>

      {/* PASO 4: Resultados */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Paso 4 — Resultados</h2>
          <span style={{ fontSize: 12, color: "#666" }}>Resumen + mixes sugeridos</span>
        </div>

        {!resp && <p style={{ color: "#666" }}>Presiona <b>CALCULAR</b> para ver resultados.</p>}

        {resp && !resp.ok && (
          <div style={{ border: "1px solid #f99", borderRadius: 12, padding: 12, color: "#900", marginTop: 12 }}>
            Error: {resp.error}
          </div>
        )}

        {result && (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {/* RESUMEN HUMANO */}
            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>
                Estimación: necesitas aproximadamente <span style={{ color: "#111" }}>{Number(result.fte).toFixed(2)}</span>{" "}
                FTE (personas full-time equivalentes).
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 6, color: "#333" }}>
                <div><b>Horas requeridas (semana):</b> {result.requiredHours}</div>
                <div><b>Horas cubiertas (según mix):</b> {result.covHours}</div>
                <div><b>Brecha por colación vs traslape:</b> {result.gapHours}</div>
              </div>

              <div style={{ marginTop: 10 }}>
                {result.gapHours > 0 ? (
                  <div style={{ color: "#b45309", fontWeight: 800 }}>
                    ⚠️ Hay brecha por colación. Recomendación típica: subir traslape o ajustar turnos.
                  </div>
                ) : (
                  <div style={{ color: "#166534", fontWeight: 800 }}>
                    ✅ Colación cubierta (no hay brecha relevante).
                  </div>
                )}
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800 }}>
                  Domingo requerido: {result.sundayReq}
                </div>
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

            {/* MIXES */}
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
                          (h/sem {it.hoursPerWeek}, factor domingo {it.sundayFactor})
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
          Dotaciones.cl — MVP v0.1
        </div>
      </div>
    </div>
  );
}