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

type CalcResponse =
  | { ok: true; result: any }
  | { ok: false; error: string };

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

  const result = resp && resp.ok ? resp.result : null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Calculadora de Dotación (MVP)</h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Calcula horas-persona/semana, brecha por colación vs traslape, y propone 3 mixes de contratos (con regla domingo).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Parámetros</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <label>
              Full (h/sem)
              <input
                type="number"
                value={fullHoursPerWeek}
                onChange={(e) => setFullHoursPerWeek(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>

            <label>
              Umbral full-time (h)
              <input
                type="number"
                value={fullTimeThresholdHours}
                onChange={(e) => setFullTimeThresholdHours(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>

            <label>
              Disponibilidad domingo full (&gt; umbral)
              <input
                type="number"
                step="0.1"
                value={fullTimeSundayAvailability}
                onChange={(e) => setFullTimeSundayAvailability(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>

            <label>
              Disponibilidad domingo part (≤ umbral)
              <input
                type="number"
                step="0.1"
                value={partTimeSundayAvailability}
                onChange={(e) => setPartTimeSundayAvailability(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => applyToAll({ shiftsPerDay: 2 })}>S=2 a toda la semana</button>
            <button onClick={() => applyToAll({ overlapMinutes: 30 })}>Traslape 30m a toda la semana</button>
            <button onClick={() => applyToAll({ breakMinutes: 60 })}>Colación 60m a toda la semana</button>
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Contratos</h2>

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {contracts.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px", gap: 8 }}>
                <input
                  value={c.name}
                  onChange={(e) => updateContract(i, { name: e.target.value })}
                />
                <input
                  type="number"
                  value={c.hoursPerWeek}
                  onChange={(e) => updateContract(i, { hoursPerWeek: Number(e.target.value) })}
                />
                <button onClick={() => removeContract(i)}>Eliminar</button>
              </div>
            ))}
          </div>

          <button style={{ marginTop: 12 }} onClick={addContract}>+ Agregar contrato</button>
        </div>
      </div>

      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Semana (L–D)</h2>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Día</th>
                <th>Abierto</th>
                <th>Horas</th>
                <th>Requeridos</th>
                <th>Turnos (S)</th>
                <th>Traslape (min)</th>
                <th>Colación (min)</th>
              </tr>
            </thead>
            <tbody>
              {DAY_ORDER.map((d) => (
                <tr key={d}>
                  <td style={{ padding: 6 }}>{DAY_LABEL[d]}</td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={days[d].open}
                      onChange={(e) => updateDay(d, { open: e.target.checked })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={days[d].hoursOpen}
                      onChange={(e) => updateDay(d, { hoursOpen: Number(e.target.value) })}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={days[d].requiredPeople}
                      onChange={(e) => updateDay(d, { requiredPeople: Number(e.target.value) })}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={days[d].shiftsPerDay}
                      onChange={(e) => updateDay(d, { shiftsPerDay: Number(e.target.value) })}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={days[d].overlapMinutes}
                      onChange={(e) => updateDay(d, { overlapMinutes: Number(e.target.value) })}
                      style={{ width: 110 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={days[d].breakMinutes}
                      onChange={(e) => updateDay(d, { breakMinutes: Number(e.target.value) })}
                      style={{ width: 110 }}
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
    background: loading ? "#991b1b" : "#dc2626", // rojo
    color: "white",
    fontWeight: 800, // negrita fuerte
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

      <div style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Resultados</h2>

        {!resp && <p style={{ color: "#666" }}>Presiona “Calcular”.</p>}

        {resp && !resp.ok && (
          <div style={{ border: "1px solid #f99", borderRadius: 12, padding: 12, color: "#900" }}>
            Error: {resp.error}
          </div>
        )}

        {result && (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
              <div><b>covHours:</b> {result.covHours}</div>
              <div><b>breakHours:</b> {result.breakHours}</div>
              <div><b>overlapHours:</b> {result.overlapHours}</div>
              <div><b>gapHours:</b> {result.gapHours}</div>
              <div><b>requiredHours:</b> {result.requiredHours}</div>
              <div><b>fte:</b> {result.fte}</div>
              <div><b>sundayReq:</b> {result.sundayReq}</div>

              {result.warnings?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <b>Warnings:</b>
                  <ul>
                    {result.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {result.mixes?.map((m: any, idx: number) => (
                <div key={idx} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                  <h3 style={{ margin: 0 }}>{m.title}</h3>
                  <div style={{ marginTop: 8 }}>
                    <div><b>Headcount:</b> {m.headcount}</div>
                    <div><b>Horas:</b> {m.hoursTotal} (holgura {m.slackHours} / {Math.round(m.slackPct * 100)}%)</div>
                    <div><b>Domingo:</b> {m.sundayCap} / {m.sundayReq} {m.sundayOk ? "✅" : "❌"}</div>
                  </div>
                  <ul style={{ marginTop: 8 }}>
                    {m.items.map((it: any, j: number) => (
                      <li key={j}>
                        {it.count}×{it.contractName} (h={it.hoursPerWeek}, dom_factor={it.sundayFactor})
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, color: "#777", fontSize: 12 }}>
  Dotaciones.cl — MVP v0.1
</div>
    </div>
  );
}