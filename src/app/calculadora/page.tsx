// src/app/calculadora/page.tsx
"use client";

import { track } from "@vercel/analytics";
import {
  useState,
  type CSSProperties,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DayInputDraft = {
  open: boolean;
  hoursOpen: string; // string para permitir vacío
  requiredPeople: string; // string para permitir vacío
  shiftsPerDay: string; // string para permitir vacío
  overlapMinutes: string; // string para permitir vacío
  breakMinutes: string; // string para permitir vacío
};

type DayInput = {
  open: boolean;
  hoursOpen: number;
  requiredPeople: number;
  shiftsPerDay: number;
  overlapMinutes: number;
  breakMinutes: number;
};

type ContractDraft = { name: string; hoursPerWeek: string };
type ContractType = { name: string; hoursPerWeek: number };

type Preferences = {
  strategy: "balanced" | "min_people";
  allow_6x1: boolean;
  allow_5x2: boolean;
  allow_4x3: boolean;
  allow_pt_weekend: boolean;
  pt_weekend_strict: boolean;
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

type LeadResponse =
  | {
      ok: true;
      id: string;
      reportUrl?: string;
      emailSent?: boolean;
      warning?: string;
      resendError?: any;
    }
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

function defaultDays(): Record<DayKey, DayInputDraft> {
  const base: DayInputDraft = {
    open: true,
    hoursOpen: "12",
    requiredPeople: "2",
    shiftsPerDay: "2",
    overlapMinutes: "30",
    breakMinutes: "60",
  };
  const days = Object.fromEntries(DAY_ORDER.map((d) => [d, { ...base }])) as Record<
    DayKey,
    DayInputDraft
  >;
  days.sun = { ...base, hoursOpen: "8", requiredPeople: "1" };
  return days;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function parseNumberLoose(raw: string): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  // soporta coma decimal
  const norm = s.replace(",", ".");
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

function parseIntLoose(raw: string): number | null {
  const n = parseNumberLoose(raw);
  if (n === null) return null;
  return Math.trunc(n);
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

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
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
        lineHeight: "20px",
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
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: CSSProperties;
  type?: "button" | "submit";
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
    primary: { background: "var(--primary)", border: "1px solid rgba(0,0,0,0.08)", color: "white" },
    danger: { background: "transparent", border: "1px solid rgba(239,68,68,0.55)", color: "var(--text)" },
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--modal-overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        zIndex: 999,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(640px, 100%)",
          borderRadius: 18,
          border: "1px solid var(--modal-border)",
          background: "var(--modal-panel)",
          boxShadow: "var(--modal-shadow)",
          padding: 18,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 1000, fontSize: 16, color: "var(--text)" }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
              fontWeight: 900,
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

export default function CalculadoraPage() {
  // ✅ ahora son strings (para permitir vacío sin forzar 0)
  const [fullHoursPerWeek, setFullHoursPerWeek] = useState("42");
  const [fullTimeThresholdHours, setFullTimeThresholdHours] = useState("30");
  const [fullTimeSundayAvailability, setFullTimeSundayAvailability] = useState("0.5");
  const [partTimeSundayAvailability, setPartTimeSundayAvailability] = useState("1.0");

  const [days, setDays] = useState<Record<DayKey, DayInputDraft>>(defaultDays());

  const [contracts, setContracts] = useState<ContractDraft[]>([
    { name: "42h", hoursPerWeek: "42" },
    { name: "36h", hoursPerWeek: "36" },
    { name: "30h", hoursPerWeek: "30" },
    { name: "20h", hoursPerWeek: "20" },
    { name: "16h", hoursPerWeek: "16" },
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

  // Lead fields
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadRole, setLeadRole] = useState("");
  const [leadIndustry, setLeadIndustry] = useState("");
  const [leadEmployees, setLeadEmployees] = useState<string>("");

  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<string | null>(null);

  // ✅ error de formulario (antes de capturar lead)
  const [formError, setFormError] = useState<string | null>(null);

  function updateDay(d: DayKey, patch: Partial<DayInputDraft>) {
    setDays((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  }

  function updateContract(i: number, patch: Partial<ContractDraft>) {
    setContracts((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function addContract() {
    setContracts((prev) => [...prev, { name: "Nuevo", hoursPerWeek: "" }]);
  }

  function removeContract(i: number) {
    setContracts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function loadRetailExample() {
    setFullHoursPerWeek("42");
    setFullTimeThresholdHours("30");
    setFullTimeSundayAvailability("0.5");
    setPartTimeSundayAvailability("1.0");

    setPreferences({
      strategy: "balanced",
      allow_6x1: true,
      allow_5x2: true,
      allow_4x3: true,
      allow_pt_weekend: true,
      pt_weekend_strict: true,
    });

    setDays(() => {
      const base: DayInputDraft = {
        open: true,
        hoursOpen: "12",
        requiredPeople: "2",
        shiftsPerDay: "2",
        overlapMinutes: "30",
        breakMinutes: "60",
      };
      const out = Object.fromEntries(DAY_ORDER.map((d) => [d, { ...base }])) as Record<
        DayKey,
        DayInputDraft
      >;
      out.fri = { ...base, hoursOpen: "13", requiredPeople: "3" };
      out.sun = { ...base, hoursOpen: "8", requiredPeople: "1" };
      return out;
    });

    setContracts([
      { name: "42h", hoursPerWeek: "42" },
      { name: "36h", hoursPerWeek: "36" },
      { name: "30h", hoursPerWeek: "30" },
      { name: "20h", hoursPerWeek: "20" },
      { name: "16h", hoursPerWeek: "16" },
    ]);

    setResp(null);
    setFormError(null);
  }

  function profileComplete() {
    const e = leadEmail.trim();
    const n = leadName.trim();
    const r = leadRole.trim();
    const i = leadIndustry.trim();
    const emp = parseIntLoose(leadEmployees);
    if (!isValidEmail(e)) return false;
    if (!n) return false;
    if (!r) return false;
    if (!i) return false;
    if (!Number.isFinite(emp ?? NaN) || (emp ?? 0) <= 0) return false;
    return true;
  }

  // ✅ construye CalcInput REAL (numbers) y valida
  function buildCalcInput(): CalcInput | null {
    setFormError(null);

    const fullH = parseIntLoose(fullHoursPerWeek);
    const thr = parseIntLoose(fullTimeThresholdHours);
    const domFull = parseNumberLoose(fullTimeSundayAvailability);
    const domPt = parseNumberLoose(partTimeSundayAvailability);

    if (fullH === null || fullH <= 0) return setFormError("Full (h/sem) debe ser un número mayor a 0."), null;
    if (thr === null || thr < 0) return setFormError("Umbral full-time (h) inválido."), null;
    if (domFull === null || domFull < 0 || domFull > 1) return setFormError("Domingo full debe estar entre 0 y 1."), null;
    if (domPt === null || domPt < 0 || domPt > 1) return setFormError("Domingo PT debe estar entre 0 y 1."), null;

    // Contratos
    const parsedContracts: ContractType[] = [];
    for (const c of contracts) {
      const h = parseIntLoose(c.hoursPerWeek);
      if (!c.name?.trim()) return setFormError("Todos los contratos deben tener nombre."), null;
      if (h === null || h <= 0) return setFormError(`Horas/sem inválidas en contrato "${c.name}".`), null;
      parsedContracts.push({ name: c.name.trim(), hoursPerWeek: h });
    }

    // Días
    const parsedDays = {} as Record<DayKey, DayInput>;
    for (const d of DAY_ORDER) {
      const dd = days[d];

      // si está cerrado, lo dejamos como 0 sin exigir campos
      if (!dd.open) {
        parsedDays[d] = {
          open: false,
          hoursOpen: 0,
          requiredPeople: 0,
          shiftsPerDay: 0,
          overlapMinutes: 0,
          breakMinutes: 0,
        };
        continue;
      }

      const hoursOpen = parseIntLoose(dd.hoursOpen);
      const requiredPeople = parseIntLoose(dd.requiredPeople);
      const shiftsPerDay = parseIntLoose(dd.shiftsPerDay);
      const overlapMinutes = parseIntLoose(dd.overlapMinutes);
      const breakMinutes = parseIntLoose(dd.breakMinutes);

      if (hoursOpen === null || hoursOpen <= 0) return setFormError(`Horas abierto inválidas en ${DAY_LABEL[d]}.`), null;
      if (requiredPeople === null || requiredPeople < 0) return setFormError(`Personas simultáneas inválidas en ${DAY_LABEL[d]}.`), null;
      if (shiftsPerDay === null || shiftsPerDay <= 0) return setFormError(`Cambios de turno/día inválidos en ${DAY_LABEL[d]}.`), null;
      if (overlapMinutes === null || overlapMinutes < 0) return setFormError(`Traslape inválido en ${DAY_LABEL[d]}.`), null;
      if (breakMinutes === null || breakMinutes < 0) return setFormError(`Colación no imputable inválida en ${DAY_LABEL[d]}.`), null;

      parsedDays[d] = {
        open: true,
        hoursOpen,
        requiredPeople,
        shiftsPerDay,
        overlapMinutes,
        breakMinutes,
      };
    }

    return {
      fullHoursPerWeek: fullH,
      fullTimeThresholdHours: thr,
      fullTimeSundayAvailability: domFull,
      partTimeSundayAvailability: domPt,
      days: parsedDays,
      contracts: parsedContracts,
      preferences,
      debugNonce: Date.now(),
    };
  }

  async function runCalculateAndLead(calcInput: CalcInput) {
    setLoading(true);
    setResp(null);
    setLeadStatus(null);

    track("calculate_clicked", {
      fullHoursPerWeek: calcInput.fullHoursPerWeek,
      threshold: calcInput.fullTimeThresholdHours,
      strategy: preferences.strategy,
    });

    try {
      // 1) Calculate
      const r = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        cache: "no-store",
        body: JSON.stringify(calcInput),
      });

      const data = (await r.json()) as CalcResponse;

      if (!data || data.ok !== true) {
        setResp(data);
        setLeadStatus("No se pudo calcular. Revisa parámetros.");
        return;
      }

      // 2) Lead + email
      const leadPayload = {
        email: leadEmail.trim(),
        full_name: leadName.trim(),
        role: leadRole.trim(),
        industry: leadIndustry.trim(),
        employees: parseIntLoose(leadEmployees),
        source: "dotaciones.cl/calculadora",
        calc_input: calcInput,
        calc_result: (data as any).result,
      };

      const lr = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        cache: "no-store",
        body: JSON.stringify(leadPayload),
      });

      const leadData = (await lr.json()) as LeadResponse;

      setResp(data);

      if (leadData && (leadData as any).ok === true) {
        const sent = (leadData as any).emailSent;
        const reportUrl = (leadData as any).reportUrl;
        if (sent) {
          setLeadStatus(`✅ Reporte enviado a ${leadEmail.trim()}${reportUrl ? ` · Link: ${reportUrl}` : ""}`);
        } else {
          setLeadStatus(`⚠️ Lead guardado, pero no se pudo enviar correo. ${reportUrl ? `Link: ${reportUrl}` : ""}`);
        }
      } else {
        setLeadStatus("⚠️ No se pudo guardar el lead / enviar correo.");
      }
    } catch (e: any) {
      setResp({ ok: false, error: e?.message ?? "Error" });
      setLeadStatus("Error ejecutando el cálculo.");
    } finally {
      setLoading(false);
    }
  }

  async function onCalculateClick() {
    const calcInput = buildCalcInput();
    if (!calcInput) return;

    // recién aquí pedimos lead
    if (!profileComplete()) {
      setLeadError(null);
      setLeadStatus(null);
      setLeadModalOpen(true);
      return;
    }

    await runCalculateAndLead(calcInput);
  }

  async function onSubmitLead() {
    setLeadError(null);

    const e = leadEmail.trim();
    const n = leadName.trim();
    const r = leadRole.trim();
    const i = leadIndustry.trim();
    const emp = parseIntLoose(leadEmployees);

    if (!isValidEmail(e)) return setLeadError("Email inválido.");
    if (!n) return setLeadError("Nombre es obligatorio.");
    if (!r) return setLeadError("Cargo es obligatorio.");
    if (!i) return setLeadError("Industria es obligatoria.");
    if (!Number.isFinite(emp ?? NaN) || (emp ?? 0) <= 0) return setLeadError("Cantidad de empleados inválida.");

    const calcInput = buildCalcInput();
    if (!calcInput) {
      setLeadModalOpen(false);
      return;
    }

    setLeadModalOpen(false);
    await runCalculateAndLead(calcInput);
  }

  const result = resp && resp.ok ? resp.result : null;

  return (
    <>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 950, color: "var(--text)" }}>
          Calculadora de Dotación Retail
        </h1>
        <p style={{ marginTop: 10, color: "var(--muted)" }}>
          Rellena tu semana y presiona <b>CALCULAR</b>. Te enviamos un reporte por correo.
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

        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card title="Paso 1 — Parámetros" right="Reglas base">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>Full (h/sem)</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Horas semanales de un contrato full típico (ej: 42).
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={fullHoursPerWeek}
                  onChange={(e) => setFullHoursPerWeek(e.target.value)}
                  placeholder="42"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>Umbral full-time (h)</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Desde cuántas horas se considera “full” (ej: 30).
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={fullTimeThresholdHours}
                  onChange={(e) => setFullTimeThresholdHours(e.target.value)}
                  placeholder="30"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>Domingo full (&gt; umbral)</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Ej: 0.5 = “rinden la mitad” los domingos.
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={fullTimeSundayAvailability}
                  onChange={(e) => setFullTimeSundayAvailability(e.target.value)}
                  placeholder="0.5"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>Domingo PT (≤ umbral)</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Ej: 1.0 = sin castigo (trabajan todos).
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={partTimeSundayAvailability}
                  onChange={(e) => setPartTimeSundayAvailability(e.target.value)}
                  placeholder="1.0"
                />
              </label>
            </div>
          </Card>

          <Card title="Paso 3 — Contratos" right="Tu set real">
            <div style={{ display: "grid", gap: 10 }}>
              {contracts.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px", gap: 10 }}>
                  <Input value={c.name} onChange={(e) => updateContract(i, { name: e.target.value })} />
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={c.hoursPerWeek}
                    onChange={(e) => updateContract(i, { hoursPerWeek: e.target.value })}
                    placeholder="42"
                  />
                  <Button variant="danger" onClick={() => removeContract(i)}>
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <Button onClick={addContract}>+ Agregar contrato</Button>
            </div>
          </Card>
        </div>

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
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, strategy: e.target.value as Preferences["strategy"] }))
                  }
                >
                  <option value="balanced">Balanceado (recomendado)</option>
                  <option value="min_people">Menos personas</option>
                </Select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <Tooltip label="PT fin de semana" text="Si está desactivado: no propondrá PT 20h/16h." />
                <Select
                  value={preferences.allow_pt_weekend ? "yes" : "no"}
                  onChange={(e) => setPreferences((p) => ({ ...p, allow_pt_weekend: e.target.value === "yes" }))}
                >
                  <option value="yes">Permitido</option>
                  <option value="no">No permitido</option>
                </Select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <Tooltip label="PT estricto Sáb+Dom" text="PT 20h/16h fijo Sáb+Dom (lógica silenciosa)." />
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
                <Tooltip label="Jornadas full permitidas" text="Activa/desactiva las jornadas que tu empresa permite usar." />
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
                        onChange={(e) => setPreferences((p) => ({ ...p, [x.key]: e.target.checked } as Preferences))}
                      />
                      {x.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

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
                        <input
                          type="checkbox"
                          checked={days[d].open}
                          onChange={(e) => updateDay(d, { open: e.target.checked })}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={days[d].hoursOpen}
                          onChange={(e) => updateDay(d, { hoursOpen: e.target.value })}
                          placeholder="12"
                          style={{ width: 120 }}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={days[d].requiredPeople}
                          onChange={(e) => updateDay(d, { requiredPeople: e.target.value })}
                          placeholder="2"
                          style={{ width: 150 }}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={days[d].shiftsPerDay}
                          onChange={(e) => updateDay(d, { shiftsPerDay: e.target.value })}
                          placeholder="2"
                          style={{ width: 150 }}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={days[d].overlapMinutes}
                          onChange={(e) => updateDay(d, { overlapMinutes: e.target.value })}
                          placeholder="30"
                          style={{ width: 150 }}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={days[d].breakMinutes}
                          onChange={(e) => updateDay(d, { breakMinutes: e.target.value })}
                          placeholder="60"
                          style={{ width: 190 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              variant="primary"
              onClick={onCalculateClick}
              disabled={loading}
              style={{ marginTop: 12, width: "100%", height: 48, fontSize: 16 }}
            >
              {loading ? "CALCULANDO..." : "CALCULAR"}
            </Button>

            {formError ? (
              <div style={{ marginTop: 10, fontSize: 13, fontWeight: 900, color: "#ef4444" }}>{formError}</div>
            ) : null}

            {leadStatus ? <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>{leadStatus}</div> : null}
          </Card>
        </div>

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
                    <div><b>Horas requeridas (semana):</b> {result.requiredHours}</div>
                    <div><b>Brecha colación vs traslape:</b> {result.gapHours}</div>
                    <div><b>Domingo requerido (personas):</b> {result.sundayReq}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {result.mixes?.map((m: any, idx: number) => (
                    <div key={idx} style={{ padding: 12, borderRadius: 14, border: "1px solid var(--border)", background: "var(--panel)" }}>
                      <div style={{ fontWeight: 950, color: "var(--text)" }}>
                        {m.title} — {m.sundayOk ? "✅ domingo OK" : "❌ domingo NO"}
                      </div>
                      <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                        <div><b>Total personas:</b> {m.headcount}</div>
                        <div><b>Horas totales:</b> {m.hoursTotal} (holgura {m.slackHours} / {Math.round(m.slackPct * 100)}%)</div>
                        <div><b>Domingo:</b> capacidad {m.sundayCap} / requerido {m.sundayReq}</div>
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

            <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span>Dotaciones.cl — MVP v0.1</span>
              <a href="/contacto" style={{ color: "var(--primary2)" }}>Contacto / sugerencias</a>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Lead */}
      <Modal open={leadModalOpen} title="Recibir reporte por correo" onClose={() => setLeadModalOpen(false)}>
        <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
          Completa estos datos para enviarte el reporte y mejorar la herramienta.
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 900, color: "var(--text)" }}>Nombre</span>
              <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Juan Pérez" />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 900, color: "var(--text)" }}>Cargo</span>
              <Input value={leadRole} onChange={(e) => setLeadRole(e.target.value)} placeholder="Jefe de tienda / RRHH / Operaciones" />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 900, color: "var(--text)" }}>Industria</span>
              <Select value={leadIndustry} onChange={(e) => setLeadIndustry(e.target.value)}>
                <option value="">Selecciona…</option>
                <option value="Retail">Retail</option>
                <option value="Comida rápida">Comida rápida</option>
                <option value="Restaurantes">Restaurantes</option>
                <option value="Supermercados">Supermercados</option>
                <option value="Farmacias">Farmacias</option>
                <option value="Otro">Otro</option>
              </Select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 900, color: "var(--text)" }}>Cantidad de empleados</span>
              <Input
                type="text"
                inputMode="numeric"
                value={leadEmployees}
                onChange={(e) => setLeadEmployees(e.target.value)}
                placeholder="Ej: 120"
              />
            </label>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 900, color: "var(--text)" }}>Email</span>
            <Input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="nombre@dominio.com" />
          </label>

          {leadError ? <div style={{ color: "#ef4444", fontWeight: 900, fontSize: 13 }}>{leadError}</div> : null}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <Button onClick={() => setLeadModalOpen(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={onSubmitLead} variant="primary">
              Enviar y calcular
            </Button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            No cobramos. Estos datos ayudan a mejorar el modelo y reportes comparables por industria.
          </div>
        </div>
      </Modal>
    </>
  );
}