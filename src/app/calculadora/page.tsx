// src/app/calculadora/page.tsx
"use client";

import { track } from "@vercel/analytics";
import {
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type DayInput = {
  open: boolean;
  hoursOpen: number;
  requiredPeople: number; // Personas simultáneas
  shiftsPerDay: number; // Cambios de turno/día
  overlapMinutes: number; // Traslape
  breakMinutes: number; // Colación no imputable
};

type ContractType = { name: string; hoursPerWeek: number };

type Preferences = {
  strategy: "balanced" | "min_people";
  allow_6x1: boolean;
  allow_5x2: boolean;
  allow_4x3: boolean;
  allow_pt_weekend: boolean;
  pt_weekend_strict: boolean; // lógica silenciosa
};

type CalcInput = {
  fullHoursPerWeek: number;
  fullTimeThresholdHours: number;
  fullTimeSundayAvailability: number;
  partTimeSundayAvailability: number;
  days: Record<DayKey, DayInput>;
  contracts: ContractType[];
  preferences: Preferences;
  debugNonce?: number;
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

function Tooltip({ label, text }: { label: string; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
      <span>{label}</span>
      <span
        title={text}
        aria-label={text}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: 999,
          border: "1px solid var(--border)",
          color: "var(--muted)",
          fontSize: 12,
          lineHeight: "18px",
          cursor: "help",
          userSelect: "none",
        }}
      >
        ?
      </span>
    </span>
  );
}

function Card({ title, right, children }: { title: string; right?: string; children: ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--panel)",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "var(--text)" }}>{title}</h2>
        {right ? <span style={{ fontSize: 12, color: "var(--muted)" }}>{right}</span> : null}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

/**
 * INPUT PRO: evita “globos”/artefactos en dark mode
 * - alto fijo
 * - backgroundClip + boxSizing
 * - appearance tipado (sin MozAppearance -> era el error TS)
 */
function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const isNumber = props.type === "number";

  const baseStyle: CSSProperties = {
    width: "100%",
    height: 42,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--input-bg)",
    color: "var(--text)",
    outline: "none",
    boxSizing: "border-box",
    backgroundClip: "padding-box",
    fontSize: 14,
    lineHeight: "20px",
  };

  // ✅ Sin MozAppearance (rompía TS)
  const appearanceStyle: CSSProperties = isNumber
    ? {
        WebkitAppearance: "none",
        appearance: "textfield",
      }
    : {
        appearance: "auto",
      };

  return (
    <input
      {...props}
      style={{
        ...baseStyle,
        ...appearanceStyle,
        ...(props.style ?? {}),
      }}
    />
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        height: 42,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--input-bg)",
        color: "var(--text)",
        outline: "none",
        boxSizing: "border-box",
        backgroundClip: "padding-box",
        fontSize: 14,
        ...(props.style ?? {}),
      }}
    />
  );
}

function Button({
  children,
  onClick,
  variant = "secondary",
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    height: 42,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--btn)",
    color: "var(--text)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
    opacity: disabled ? 0.7 : 1,
    boxSizing: "border-box",
    backgroundClip: "padding-box",
  };

  const variants: Record<string, CSSProperties> = {
    secondary: {},
    primary: {
      background: "var(--primary)",
      border: "1px solid rgba(0,0,0,0.08)",
      color: "white",
    },
    danger: {
      background: "transparent",
      border: "1px solid rgba(239,68,68,0.55)",
      color: "var(--text)",
    },
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
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

  const [preferences, setPreferences] = useState<Preferences>({
    strategy: "balanced",
    allow_6x1: true,
    allow_5x2: true,
    allow_4x3: true,
    allow_pt_weekend: true,
    pt_weekend_strict: true,
  });

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
      preferences,
      debugNonce: Date.now(),
    }),
    [
      fullHoursPerWeek,
      fullTimeThresholdHours,
      fullTimeSundayAvailability,
      partTimeSundayAvailability,
      days,
      contracts,
      preferences,
    ]
  );

  async function onCalculate() {
    setLoading(true);
    setResp(null);

    track("calculate_clicked", {
      fullHoursPerWeek,
      threshold: fullTimeThresholdHours,
      strategy: preferences.strategy,
    });

    try {
      const r = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        cache: "no-store",
        body: JSON.stringify(input),
      });
      const data = await r.json();
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

    setPreferences({
      strategy: "balanced",
      allow_6x1: true,
      allow_5x2: true,
      allow_4x3: true,
      allow_pt_weekend: true,
      pt_weekend_strict: true,
    });

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
    <>
      <style jsx global>{`
        :root {
          --bg: #f6f7fb;
          --panel: #ffffff;
          --text: #0f172a;
          --muted: rgba(15, 23, 42, 0.64);
          --border: rgba(15, 23, 42, 0.12);
          --input-bg: rgba(15, 23, 42, 0.04);
          --btn: rgba(15, 23, 42, 0.04);
          --primary: #1f3a8a;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0b1220;
            --panel: rgba(255, 255, 255, 0.06);
            --text: rgba(255, 255, 255, 0.92);
            --muted: rgba(255, 255, 255, 0.62);
            --border: rgba(255, 255, 255, 0.14);
            --input-bg: rgba(255, 255, 255, 0.08);
            --btn: rgba(255, 255, 255, 0.08);
            --primary: #2563eb;
          }
        }
        body {
          background: var(--bg);
        }

        /* Quita spinners en number inputs (Chrome/Safari/Edge) */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 950, color: "var(--text)" }}>
          Calculadora de Dotación Retail
        </h1>
        <p style={{ marginTop: 10, color: "var(--muted)" }}>
          Rellena tu semana y presiona <b>CALCULAR</b>. Te entregará un estimado de FTE y mixes sugeridos.
        </p>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={loadRetailExample} variant="secondary">
            Cargar ejemplo retail típico
          </Button>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0 12px",
              height: 42,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--btn)",
              color: "var(--text)",
              textDecoration: "none",
              fontWeight: 900,
              boxSizing: "border-box",
            }}
          >
            Volver al inicio
          </a>
        </div>

        {/* Bloque superior: Paso 1 y Paso 3 */}
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card title="Paso 1 — Parámetros" right="Reglas base">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>Full (h/sem)</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Horas semanales de un contrato full típico (ej: 42).
                </span>
                <Input type="number" value={fullHoursPerWeek} onChange={(e) => setFullHoursPerWeek(Number(e.target.value))} />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>Umbral full-time (h)</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Desde cuántas horas se considera “full” (ej: 30).
                </span>
                <Input type="number" value={fullTimeThresholdHours} onChange={(e) => setFullTimeThresholdHours(Number(e.target.value))} />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>Domingo full (&gt; umbral)</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Ej: 0.5 = “rinden la mitad” los domingos.
                </span>
                <Input
                  type="number"
                  step="0.1"
                  value={fullTimeSundayAvailability}
                  onChange={(e) => setFullTimeSundayAvailability(Number(e.target.value))}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>Domingo PT (≤ umbral)</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Ej: 1.0 = sin castigo (trabajan todos).
                </span>
                <Input
                  type="number"
                  step="0.1"
                  value={partTimeSundayAvailability}
                  onChange={(e) => setPartTimeSundayAvailability(Number(e.target.value))}
                />
              </label>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button onClick={() => applyToAll({ shiftsPerDay: 2 })}>2 cambios de turno/día (semana completa)</Button>
              <Button onClick={() => applyToAll({ overlapMinutes: 30 })}>Traslape 30 min (semana completa)</Button>
              <Button onClick={() => applyToAll({ breakMinutes: 60 })}>Colación 60 min (semana completa)</Button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
              <b>Tip:</b> Traslape = cruce de turnos (colación/cambio).
            </div>
          </Card>

          <Card title="Paso 3 — Contratos" right="Tu set real">
            <div style={{ display: "grid", gap: 10 }}>
              {contracts.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px", gap: 10 }}>
                  <Input value={c.name} onChange={(e) => updateContract(i, { name: e.target.value })} />
                  <Input type="number" value={c.hoursPerWeek} onChange={(e) => updateContract(i, { hoursPerWeek: Number(e.target.value) })} />
                  <Button variant="danger" onClick={() => removeContract(i)}>
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <Button onClick={addContract}>+ Agregar contrato</Button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
              Tip empresa: si falta “cuerpo base”, agrega 30h / 36h / 42h como opciones.
            </div>
          </Card>
        </div>

        {/* Paso 2 visible y separado */}
        <div style={{ marginTop: 16 }}>
          <Card title="Paso 2 — Preferencias" right="Criterios del mix">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <Tooltip
                  label="Estrategia"
                  text="Balanceado = cuerpo base full + PT para ajustar. Menos personas = compacta headcount."
                />
                <Select
                  value={preferences.strategy}
                  onChange={(e) => setPreferences((p) => ({ ...p, strategy: e.target.value as Preferences["strategy"] }))}
                >
                  <option value="balanced">Balanceado (recomendado)</option>
                  <option value="min_people">Menos personas</option>
                </Select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <Tooltip label="PT fin de semana" text="Si está activado: se consideran PT para cubrir sáb+dom." />
                <Select
                  value={preferences.allow_pt_weekend ? "yes" : "no"}
                  onChange={(e) => setPreferences((p) => ({ ...p, allow_pt_weekend: e.target.value === "yes" }))}
                >
                  <option value="yes">Permitido</option>
                  <option value="no">No permitido</option>
                </Select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <Tooltip label="PT estricto Sáb+Dom" text="Lógica silenciosa: PT 20h/16h se asume fijo Sáb+Dom." />
                <Select
                  value={preferences.pt_weekend_strict ? "yes" : "no"}
                  onChange={(e) => setPreferences((p) => ({ ...p, pt_weekend_strict: e.target.value === "yes" }))}
                  disabled={!preferences.allow_pt_weekend}
                >
                  <option value="yes">Sí (Sáb+Dom)</option>
                  <option value="no">No (flexible)</option>
                </Select>
              </label>

              <div style={{ display: "grid", gap: 6 }}>
                <Tooltip
                  label="Jornadas full permitidas"
                  text="Activa/desactiva las jornadas que tu empresa permite usar."
                />
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingTop: 6 }}>
                  {[
                    { key: "allow_6x1", label: "6x1" },
                    { key: "allow_5x2", label: "5x2" },
                    { key: "allow_4x3", label: "4x3" },
                  ].map((x) => (
                    <label
                      key={x.key}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        color: "var(--text)",
                        fontWeight: 800,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={preferences[x.key as keyof Preferences] as boolean}
                        onChange={(e) =>
                          setPreferences((p) => ({
                            ...p,
                            [x.key]: e.target.checked,
                          }))
                        }
                      />
                      {x.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
              Estas preferencias guían el motor para proponer mixes más realistas.
            </div>
          </Card>
        </div>

        {/* Paso 4: Semana */}
        <div style={{ marginTop: 16 }}>
          <Card title="Paso 4 — Semana (Lun a Dom)" right="Qué necesitas cada día">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: 8, color: "var(--muted)" }}>Día</th>
                    <th style={{ padding: 8, color: "var(--muted)" }}>Abierto</th>
                    <th style={{ padding: 8, color: "var(--muted)" }}>
                      <Tooltip label="Horas abierto" text="Cuántas horas está abierto el local ese día." />
                    </th>
                    <th style={{ padding: 8, color: "var(--muted)" }}>
                      <Tooltip label="Personas simultáneas" text="Cuántas personas necesitas AL MISMO TIEMPO." />
                    </th>
                    <th style={{ padding: 8, color: "var(--muted)" }}>
                      <Tooltip label="Cambios de turno/día" text="Cuántos equipos se alternan en el día. Ej: 2 = AM/PM." />
                    </th>
                    <th style={{ padding: 8, color: "var(--muted)" }}>
                      <Tooltip label="Traslape (min)" text="Minutos que se cruzan turnos (colación/cambio). Si no aplica, 0." />
                    </th>
                    <th style={{ padding: 8, color: "var(--muted)" }}>
                      <Tooltip
                        label="Colación no imputable (min)"
                        text="Minutos de colación que no cuentan como jornada (presencia adicional). Si no aplica, 0."
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DAY_ORDER.map((d) => (
                    <tr key={d} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: 8, fontWeight: 900, color: "var(--text)" }}>{DAY_LABEL[d]}</td>
                      <td style={{ padding: 8, textAlign: "center" }}>
                        <input type="checkbox" checked={days[d].open} onChange={(e) => updateDay(d, { open: e.target.checked })} />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input type="number" value={days[d].hoursOpen} onChange={(e) => updateDay(d, { hoursOpen: Number(e.target.value) })} style={{ width: 120 }} />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input type="number" value={days[d].requiredPeople} onChange={(e) => updateDay(d, { requiredPeople: Number(e.target.value) })} style={{ width: 150 }} />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input type="number" value={days[d].shiftsPerDay} onChange={(e) => updateDay(d, { shiftsPerDay: Number(e.target.value) })} style={{ width: 150 }} />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input type="number" value={days[d].overlapMinutes} onChange={(e) => updateDay(d, { overlapMinutes: Number(e.target.value) })} style={{ width: 150 }} />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input type="number" value={days[d].breakMinutes} onChange={(e) => updateDay(d, { breakMinutes: Number(e.target.value) })} style={{ width: 190 }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="primary" onClick={onCalculate} disabled={loading} style={{ marginTop: 12, width: "100%", height: 48, fontSize: 16 }}>
              {loading ? "CALCULANDO..." : "CALCULAR"}
            </Button>

            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
              Si aparece “brecha por colación”, normalmente se resuelve subiendo el traslape o ajustando cambios de turno.
            </div>
          </Card>
        </div>

        {/* Paso 5: Resultados */}
        <div style={{ marginTop: 16 }}>
          <Card title="Paso 5 — Resultados" right="Resumen + mixes sugeridos">
            {!resp && (
              <p style={{ margin: 0, color: "var(--muted)" }}>
                Presiona <b>CALCULAR</b> para ver resultados.
              </p>
            )}

            {resp && !resp.ok && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(239,68,68,0.5)",
                  background: "rgba(239,68,68,0.08)",
                  color: "var(--text)",
                }}
              >
                <b>Error:</b> {resp.error}
              </div>
            )}

            {result && (
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 14, border: "1px solid var(--border)", background: "var(--input-bg)" }}>
                  <div style={{ fontWeight: 950, color: "var(--text)" }}>
                    Estimación: {Number(result.fte).toFixed(2)} FTE (equivalentes full).
                  </div>
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                    <div>
                      <b>Horas requeridas (semana):</b> {result.requiredHours}
                    </div>
                    <div>
                      <b>Brecha colación vs traslape:</b> {result.gapHours}
                    </div>
                    <div>
                      <b>Domingo requerido (personas):</b> {result.sundayReq}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {result.mixes?.map((m: any, idx: number) => (
                    <div key={idx} style={{ padding: 12, borderRadius: 14, border: "1px solid var(--border)", background: "var(--panel)" }}>
                      <div style={{ fontWeight: 950, color: "var(--text)" }}>
                        {m.title} — {m.sundayOk ? "✅ domingo OK" : "❌ domingo NO"}
                      </div>
                      <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                        <div>
                          <b>Total personas:</b> {m.headcount}
                        </div>
                        <div>
                          <b>Horas totales:</b> {m.hoursTotal} (holgura {m.slackHours} / {Math.round(m.slackPct * 100)}%)
                        </div>
                        <div>
                          <b>Domingo:</b> capacidad {m.sundayCap} / requerido {m.sundayReq}
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontWeight: 900, color: "var(--text)" }}>Composición</div>
                      <ul style={{ marginTop: 6, marginBottom: 0, color: "var(--muted)", fontSize: 13 }}>
                        {m.items.map((it: any, j: number) => (
                          <li key={j}>
                            {it.count} × {it.contractName}{" "}
                            <span style={{ color: "var(--muted)" }}>
                              (h/sem {it.hoursPerWeek}, jornada {it.jornadaLabel ?? it.jornada ?? "-"}, domingo {it.sundayFactor})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted)" }}>Dotaciones.cl — MVP v0.1</div>
          </Card>
        </div>
      </div>
    </>
  );
}