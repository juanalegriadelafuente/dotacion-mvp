// src/app/calculadora/page.tsx
"use client";

import { track } from "@vercel/analytics";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL: Record<DayKey, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
};

type Preferences = {
  strategy: "balanced" | "min_people" | "stable";
  allow_6x1: boolean;
  allow_5x2: boolean;
  allow_4x3: boolean;
  allow_pt_weekend: boolean;
  pt_weekend_strict: boolean;
};

type ContractRow = { name: string; hoursPerWeek: string };

type LeadForm = {
  name: string;
  role: string;
  industry: string;
  company_size: string;
  email: string;
};

type CalcOk = {
  ok: true;
  result: {
    requiredHours: number;
    fte: number;
    demandByDay: { day: string; hours: number }[];
    warnings: string[];
    mixes: Array<{
      title: string;
      headcount: number;
      hoursTotal: number;
      slackHours: number;
      slackPct: number;
      sundayReq: number;
      sundayCap: number;
      sundayOk: boolean;
      ptShare: number;
      uncovered: number;
      items: Array<{
        count: number;
        jornada: string;
        jornadaLabel: string;
        contractName: string;
        hoursPerWeek: number;
        isFull: boolean;
        isPt: boolean;
      }>;
    }>;
  };
};
type CalcErr = { ok: false; error: string };
type CalcResponse = CalcOk | CalcErr;

/** Grid 30 min
 * Slot 0 = 07:00
 * Slot 47 = 06:30 (día siguiente)
 */
const GRID_START_MIN = 7 * 60;
const SLOT_MIN = 30;
const SLOT_COUNT = 48;

function slotLabel(i: number) {
  const mins = GRID_START_MIN + i * SLOT_MIN;
  const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function timeToSlot(hhmm: string) {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  const mins = h * 60 + m;
  const adj = mins < GRID_START_MIN ? mins + 24 * 60 : mins;
  const idx = Math.round((adj - GRID_START_MIN) / SLOT_MIN);
  return Math.max(0, Math.min(SLOT_COUNT - 1, idx));
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function freshSlots() {
  return Array.from({ length: SLOT_COUNT }, () => 0);
}

function rangeFill(arr: number[], startSlot: number, endSlot: number, value: number) {
  const out = arr.slice();
  if (endSlot === startSlot) return out;

  const fill = (a: number, b: number) => {
    const lo = Math.max(0, Math.min(SLOT_COUNT, a));
    const hi = Math.max(0, Math.min(SLOT_COUNT, b));
    for (let i = lo; i < hi; i++) out[i] = value;
  };

  if (endSlot > startSlot) {
    fill(startSlot, endSlot);
  } else {
    fill(startSlot, SLOT_COUNT);
    fill(0, endSlot);
  }
  return out;
}

function slotsBaseHours(slots: number[]) {
  let sum = 0;
  for (const v of slots) sum += Math.max(0, v) * 0.5;
  return Math.round(sum * 10) / 10;
}

function slotsPeak(slots: number[]) {
  let peak = 0;
  for (const v of slots) peak = Math.max(peak, Math.max(0, v));
  return peak;
}

function slotsToSegments(slots: number[]) {
  const segs: Array<{ start: number; end: number; value: number }> = [];
  let curV = Math.max(0, slots[0] ?? 0);
  let curS = 0;

  for (let i = 1; i <= SLOT_COUNT; i++) {
    const v = i === SLOT_COUNT ? NaN : Math.max(0, slots[i] ?? 0);
    if (i === SLOT_COUNT || v !== curV) {
      segs.push({ start: curS, end: i, value: curV });
      curS = i;
      curV = v as any;
    }
  }
  return segs.filter((s) => s.value !== 0 && s.start !== s.end);
}

function emailLooksOk(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function Button({
  children,
  className = "",
  variant = "secondary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const v =
    variant === "primary"
      ? "btn btnPrimary"
      : variant === "danger"
        ? "btn btnDanger"
        : variant === "ghost"
          ? "btn btnGhost"
          : "btn";
  return (
    <button {...props} className={`${v} ${className}`.trim()}>
      {children}
    </button>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modalOverlay" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="h3">{title}</div>
          <button className="btn btnGhost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="hr" />
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

export default function CalculadoraPage() {
  // Config
  const [fullHoursPerWeek, setFullHoursPerWeek] = useState("42");
  const [fullTimeThresholdHours, setFullTimeThresholdHours] = useState("30");

  // Preferencias
  const [prefs, setPrefs] = useState<Preferences>({
    strategy: "balanced",
    allow_6x1: true,
    allow_5x2: true,
    allow_4x3: true,
    allow_pt_weekend: true,
    pt_weekend_strict: true,
  });

  // Contratos
  const [contracts, setContracts] = useState<ContractRow[]>([
    { name: "44h", hoursPerWeek: "44" },
    { name: "42h", hoursPerWeek: "42" },
    { name: "40h", hoursPerWeek: "40" },
    { name: "30h", hoursPerWeek: "30" },
    { name: "20h", hoursPerWeek: "20" },
  ]);

  // Operación por día (gap colación/traslape)
  const [overlapByDay, setOverlapByDay] = useState<Record<DayKey, string>>({
    mon: "30",
    tue: "30",
    wed: "30",
    thu: "30",
    fri: "30",
    sat: "30",
    sun: "30",
  });
  const [breakByDay, setBreakByDay] = useState<Record<DayKey, string>>({
    mon: "30",
    tue: "30",
    wed: "30",
    thu: "30",
    fri: "30",
    sat: "30",
    sun: "30",
  });

  // Día seleccionado
  const [selectedDay, setSelectedDay] = useState<DayKey>("mon");

  // Demanda 30-min por día (slots)
  const [demand30, setDemand30] = useState<Record<DayKey, number[]>>({
    mon: freshSlots(),
    tue: freshSlots(),
    wed: freshSlots(),
    thu: freshSlots(),
    fri: freshSlots(),
    sat: freshSlots(),
    sun: freshSlots(),
  });

  // Abrir/cerrar días
  const [dayOpen, setDayOpen] = useState<Record<DayKey, boolean>>({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true,
  });

  // Rellenar rango
  const [rangeStart, setRangeStart] = useState("08:00");
  const [rangeEnd, setRangeEnd] = useState("18:00");
  const [rangeValue, setRangeValue] = useState("2");
  const [showGrid, setShowGrid] = useState(false);

  // Copiar día
  const [copyTarget, setCopyTarget] = useState<DayKey>("tue");

  // Resultado
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CalcOk["result"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  // Lead modal
  const [leadOpen, setLeadOpen] = useState(false);
  const [lead, setLead] = useState<LeadForm>({
    name: "",
    role: "",
    industry: "",
    company_size: "",
    email: "",
  });
  const [leadError, setLeadError] = useState<string | null>(null);

  const loadExample = useCallback(() => {
    const week: Record<DayKey, number[]> = {
      mon: freshSlots(),
      tue: freshSlots(),
      wed: freshSlots(),
      thu: freshSlots(),
      fri: freshSlots(),
      sat: freshSlots(),
      sun: freshSlots(),
    };

    const fill = (day: DayKey, start: string, end: string, v: number) => {
      const s = timeToSlot(start);
      const e = timeToSlot(end);
      week[day] = rangeFill(week[day], s, e, v);
    };

    for (const d of ["mon", "tue", "wed", "thu", "fri"] as DayKey[]) {
      fill(d, "08:00", "12:00", 2);
      fill(d, "12:00", "16:00", 3);
      fill(d, "16:00", "20:00", 2);
    }
    fill("sat", "10:00", "18:00", 2);
    fill("sun", "11:00", "17:00", 2);

    setDemand30(week);
    setDayOpen({
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: true,
      sun: true,
    });
    setSelectedDay("mon");
    setShowGrid(false);

    setOverlapByDay({
      mon: "30",
      tue: "30",
      wed: "30",
      thu: "30",
      fri: "30",
      sat: "30",
      sun: "30",
    });
    setBreakByDay({
      mon: "30",
      tue: "30",
      wed: "30",
      thu: "30",
      fri: "30",
      sat: "30",
      sun: "30",
    });

    setContracts([
      { name: "44h", hoursPerWeek: "44" },
      { name: "42h", hoursPerWeek: "42" },
      { name: "40h", hoursPerWeek: "40" },
      { name: "30h", hoursPerWeek: "30" },
      { name: "20h", hoursPerWeek: "20" },
    ]);

    setPrefs((p) => ({
      ...p,
      strategy: "balanced",
      allow_6x1: true,
      allow_5x2: true,
      allow_4x3: true,
      allow_pt_weekend: true,
      pt_weekend_strict: true,
    }));

    setResult(null);
    setError(null);
    setReportId(null);

    track("calc_load_example");
  }, []);

  const dayStats = useMemo(() => {
    const slots = demand30[selectedDay] ?? [];
    return {
      baseHours: slotsBaseHours(slots),
      peak: slotsPeak(slots),
      segments: slotsToSegments(slots),
    };
  }, [demand30, selectedDay]);

  const calcInput = useMemo(() => {
    const days: any = {};
    for (const d of DAY_ORDER) {
      days[d] = {
        open: !!dayOpen[d],
        hoursOpen: 0,
        requiredPeople: 0,
        overlapMinutes: Number(overlapByDay[d] || 0),
        breakMinutes: Number(breakByDay[d] || 0),
      };
    }

    const parsedContracts = contracts
      .map((c) => ({
        name: String(c.name || "").trim(),
        hoursPerWeek: Number(c.hoursPerWeek || 0),
      }))
      .filter((c) => c.name.length > 0 && Number.isFinite(c.hoursPerWeek) && c.hoursPerWeek > 0);

    return {
      fullHoursPerWeek: Number(fullHoursPerWeek || 42),
      fullTimeThresholdHours: Number(fullTimeThresholdHours || 30),
      days,
      demand30,
      contracts: parsedContracts,
      preferences: prefs,
      debugNonce: Date.now(),
    };
  }, [
    breakByDay,
    contracts,
    dayOpen,
    demand30,
    fullHoursPerWeek,
    fullTimeThresholdHours,
    overlapByDay,
    prefs,
  ]);

  async function runCalculateOnly() {
    setIsLoading(true);
    setError(null);
    setReportId(null);

    try {
      track("calc_submit", { mode: "retail" });
      const r = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calcInput),
      });
      const json = (await r.json()) as CalcResponse;

      if (!r.ok || !json.ok) {
        setResult(null);
        setError((json as any)?.error || "No se pudo calcular.");
        return;
      }

      setResult(json.result);
    } catch (e: any) {
      setResult(null);
      setError(e?.message || "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function runCalculateAndLeadSave() {
    setIsLoading(true);
    setError(null);
    setReportId(null);

    try {
      track("calc_submit", { mode: "lead" });

      const r = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calcInput),
      });
      const json = (await r.json()) as CalcResponse;

      if (!r.ok || !json.ok) {
        setResult(null);
        setError((json as any)?.error || "No se pudo calcular.");
        return;
      }

      setResult(json.result);

      const leadPayload = {
        name: lead.name.trim(),
        email: lead.email.trim(),
        company: "",
        phone: "",
        role: lead.role.trim(),
        company_size: lead.company_size.trim(),
        city: "",
        source: "dotaciones",
        calc_input: {
          ...calcInput,
          meta: { name: lead.name.trim(), industry: lead.industry.trim() },
        },
        calc_result: json.result,
      };

      const leadResp = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload),
      });

      const leadJson: any = await leadResp.json().catch(() => null);

      if (leadResp.ok) {
        const id = leadJson?.id || leadJson?.leadId || leadJson?.data?.id || null;
        if (id) setReportId(String(id));
      }
    } catch (e: any) {
      setError(e?.message || "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmitLead() {
    setLeadError(null);

    if (!lead.name.trim()) return setLeadError("Pon tu nombre (o alias).");
    if (!lead.role.trim()) return setLeadError("¿Tu cargo?");
    if (!lead.industry.trim())
      return setLeadError("¿Industria? (retail / hospital / alimentación / logística)");
    if (!lead.company_size.trim()) return setLeadError("¿Cantidad aprox. de empleados?");
    if (!emailLooksOk(lead.email))
      return setLeadError("Ese email se ve inválido (ej: nombre@dominio.com).");

    setLeadOpen(false);
    await runCalculateAndLeadSave();
  }

  return (
    <main className="container">
      {/* Top */}
      <div className="topbar">
        <div className="brand">
          <Link href="/" className="brandMark" aria-label="Ir al inicio">
            <Image
              src="/logo.svg"
              alt="Dotaciones.cl"
              width={34}
              height={34}
              className="logo"
              priority
            />
            <span className="brandName">Dotaciones.cl</span>
          </Link>
          <div className="brandSub">
            Paso 4: Necesidad operativa por tramos (30 min) + mix sugerido
          </div>
        </div>

        <div className="actions">
          <Link className="btn" href="/contacto">
            Sugerencias
          </Link>
          <Link className="btn" href="/">
            Inicio
          </Link>
          <Button variant="ghost" onClick={loadExample} disabled={isLoading}>
            Cargar ejemplo
          </Button>
        </div>
      </div>

      {/* CTA SAN (empuje de tráfico interno) */}
      <div className="card" style={{ marginTop: 12 }}>
        <div
          className="cardPad"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="h3" style={{ margin: 0 }}>
              🏥 Nuevo: Calculadora SAN Hospitalaria (PRO)
            </div>
            <div className="small" style={{ marginTop: 4 }}>
              Normativa + operación por día + mix FT primero + Excel PRO.
            </div>
          </div>

          <Link
            className="btn btnPrimary"
            href="/san"
            onClick={() => track("cta_san_from_calculadora")}
          >
            Ir a SAN →
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div style={{ marginTop: 16 }} className="gridMain">
        <div className="card">
          <div className="cardPad">
            <h1 className="h1">Calculadora de Dotación por Tramos (30 min)</h1>
            <p className="p">
              Cargas cuánta gente necesitas cada 30 minutos (día por día). Luego
              te devolvemos <b>horas-persona</b>, <b>FTE</b> y{" "}
              <b>alternativas de mix</b>.
            </p>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="primary"
                onClick={runCalculateOnly}
                disabled={isLoading}
              >
                {isLoading ? "Calculando…" : "Calcular"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => setLeadOpen(true)}
                disabled={isLoading}
              >
                Guardar reporte (gratis)
              </Button>

              {reportId ? (
                <Link className="btn" href={`/reporte/${reportId}`}>
                  Ver reporte →
                </Link>
              ) : null}
            </div>

            {error ? (
              <div className="alert alertError" style={{ marginTop: 12 }}>
                ❌ {error}
              </div>
            ) : null}

            {result?.warnings?.length ? (
              <div className="alert" style={{ marginTop: 12 }}>
                ⚠️ {result.warnings.join(" | ")}
              </div>
            ) : null}
          </div>
        </div>

        {/* Sidebar (día) */}
        <div className="card">
          <div className="cardPad">
            <div className="h3" style={{ marginTop: 0 }}>
              Día / Tramos (30 min)
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DAY_ORDER.map((d) => (
                <Button
                  key={d}
                  variant={d === selectedDay ? "primary" : "secondary"}
                  onClick={() => setSelectedDay(d)}
                >
                  {DAY_LABEL[d]}
                </Button>
              ))}
            </div>

            <div className="hr" style={{ marginTop: 12 }} />

            <div className="small">
              Base horas-persona (día): <b>{dayStats.baseHours}</b>
              <br />
              Peak personas: <b>{dayStats.peak}</b>
            </div>

            <div className="hr" style={{ marginTop: 12 }} />

            <label className="label">Abierto</label>
            <div className="small" style={{ display: "flex", gap: 10 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={dayOpen[selectedDay]}
                  onChange={(e) =>
                    setDayOpen((p) => ({ ...p, [selectedDay]: e.target.checked }))
                  }
                />
                {DAY_LABEL[selectedDay]}
              </label>
            </div>

            <div className="grid2" style={{ marginTop: 10 }}>
              <div className="field">
                <label className="label">Colación (min)</label>
                <input
                  className="input"
                  value={breakByDay[selectedDay]}
                  onChange={(e) =>
                    setBreakByDay((p) => ({ ...p, [selectedDay]: e.target.value }))
                  }
                  inputMode="numeric"
                />
              </div>
              <div className="field">
                <label className="label">Traslape (min)</label>
                <input
                  className="input"
                  value={overlapByDay[selectedDay]}
                  onChange={(e) =>
                    setOverlapByDay((p) => ({
                      ...p,
                      [selectedDay]: e.target.value,
                    }))
                  }
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="hr" style={{ marginTop: 12 }} />

            <Button
              variant="secondary"
              onClick={() => setShowGrid((v) => !v)}
            >
              {showGrid ? "Ocultar grilla" : "Editar grilla 30 min"}
            </Button>

            <div className="hr" style={{ marginTop: 12 }} />

            <div className="h3" style={{ marginTop: 0 }}>
              Copiar configuración
            </div>

            <div className="grid2">
              <div className="field">
                <label className="label">Copiar día actual a</label>
                <select
                  className="input"
                  value={copyTarget}
                  onChange={(e) => setCopyTarget(e.target.value as DayKey)}
                >
                  {DAY_ORDER.filter((d) => d !== selectedDay).map((d) => (
                    <option key={d} value={d}>
                      {DAY_LABEL[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDemand30((p) => ({ ...p, [copyTarget]: p[selectedDay].slice() }));
                    setDayOpen((p) => ({ ...p, [copyTarget]: p[selectedDay] }));
                    setBreakByDay((p) => ({ ...p, [copyTarget]: p[selectedDay] }));
                    setOverlapByDay((p) => ({ ...p, [copyTarget]: p[selectedDay] }));
                    track("calc_copy_day");
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid editor */}
      {showGrid ? (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="cardPad">
            <div className="h3" style={{ marginTop: 0 }}>
              Editar grilla 30 min — {DAY_LABEL[selectedDay]}
            </div>

            <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label className="label">Desde</label>
                <input
                  className="input"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  placeholder="08:00"
                />
              </div>
              <div className="field">
                <label className="label">Hasta</label>
                <input
                  className="input"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  placeholder="18:00"
                />
              </div>
            </div>

            <div className="grid2" style={{ marginTop: 10, gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label className="label">Personas</label>
                <input
                  className="input"
                  value={rangeValue}
                  onChange={(e) => setRangeValue(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    const s = timeToSlot(rangeStart);
                    const e = timeToSlot(rangeEnd);
                    const v = clamp(Number(rangeValue || 0), 0, 999);
                    setDemand30((p) => ({
                      ...p,
                      [selectedDay]: rangeFill(p[selectedDay], s, e, v),
                    }));
                    track("calc_fill_range");
                  }}
                >
                  Rellenar rango
                </Button>
              </div>
            </div>

            <div className="hr" style={{ marginTop: 14 }} />

            <div className="gridScroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tramo</th>
                    <th>Personas</th>
                  </tr>
                </thead>
                <tbody>
                  {demand30[selectedDay].map((v, i) => (
                    <tr key={i}>
                      <td>{slotLabel(i)}</td>
                      <td style={{ width: 160 }}>
                        <input
                          className="input"
                          value={String(v)}
                          onChange={(e) => {
                            const nv = clamp(Number(e.target.value || 0), 0, 999);
                            setDemand30((p) => {
                              const out = p[selectedDay].slice();
                              out[i] = nv;
                              return { ...p, [selectedDay]: out };
                            });
                          }}
                          inputMode="numeric"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setDemand30((p) => ({ ...p, [selectedDay]: freshSlots() }));
                  track("calc_clear_day");
                }}
              >
                Limpiar día
              </Button>
              <Button variant="ghost" onClick={() => setShowGrid(false)}>
                Listo
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Config */}
      <div className="grid2" style={{ marginTop: 14, gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <div className="cardPad">
            <div className="h3" style={{ marginTop: 0 }}>
              Configuración
            </div>

            <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label className="label">Horas Full (FTE)</label>
                <input
                  className="input"
                  value={fullHoursPerWeek}
                  onChange={(e) => setFullHoursPerWeek(e.target.value)}
                  inputMode="numeric"
                />
                <div className="small">Ej: 42</div>
              </div>
              <div className="field">
                <label className="label">Umbral Full/Part</label>
                <input
                  className="input"
                  value={fullTimeThresholdHours}
                  onChange={(e) => setFullTimeThresholdHours(e.target.value)}
                  inputMode="numeric"
                />
                <div className="small">Ej: 30</div>
              </div>
            </div>

            <div className="hr" style={{ marginTop: 12 }} />

            <div className="h3" style={{ marginTop: 0 }}>
              Preferencias
            </div>

            <div className="field">
              <label className="label">Estrategia</label>
              <select
                className="input"
                value={prefs.strategy}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, strategy: e.target.value as any }))
                }
              >
                <option value="balanced">Balanceado</option>
                <option value="min_people">Menos personas</option>
                <option value="stable">Más estable</option>
              </select>
            </div>

            <div className="grid2" style={{ marginTop: 10 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={prefs.allow_6x1}
                  onChange={(e) => setPrefs((p) => ({ ...p, allow_6x1: e.target.checked }))}
                />
                6x1
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={prefs.allow_5x2}
                  onChange={(e) => setPrefs((p) => ({ ...p, allow_5x2: e.target.checked }))}
                />
                5x2
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={prefs.allow_4x3}
                  onChange={(e) => setPrefs((p) => ({ ...p, allow_4x3: e.target.checked }))}
                />
                4x3 (solo 40h)
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={prefs.allow_pt_weekend}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, allow_pt_weekend: e.target.checked }))
                  }
                />
                PT fin de semana
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardPad">
            <div className="h3" style={{ marginTop: 0 }}>
              Contratos
            </div>

            <div className="small">
              Define los contratos disponibles. El motor arma combinaciones por jornada (6x1 / 5x2 /
              4x3 / PT fin de semana).
            </div>

            <div className="hr" style={{ marginTop: 12 }} />

            <div className="gridScroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Horas/sem</th>
                    <th style={{ width: 110 }} />
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          className="input"
                          value={c.name}
                          onChange={(e) =>
                            setContracts((p) => {
                              const out = p.slice();
                              out[i] = { ...out[i], name: e.target.value };
                              return out;
                            })
                          }
                        />
                      </td>
                      <td style={{ width: 140 }}>
                        <input
                          className="input"
                          value={c.hoursPerWeek}
                          inputMode="numeric"
                          onChange={(e) =>
                            setContracts((p) => {
                              const out = p.slice();
                              out[i] = { ...out[i], hoursPerWeek: e.target.value };
                              return out;
                            })
                          }
                        />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Button
                          variant="danger"
                          onClick={() => {
                            setContracts((p) => p.filter((_, j) => j !== i));
                            track("calc_remove_contract");
                          }}
                        >
                          Quitar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setContracts((p) => [...p, { name: "Nuevo", hoursPerWeek: "30" }]);
                  track("calc_add_contract");
                }}
              >
                Agregar contrato
              </Button>

              <Button variant="primary" onClick={runCalculateOnly} disabled={isLoading}>
                {isLoading ? "Calculando…" : "Recalcular"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardPad">
          <div className="h3" style={{ marginTop: 0 }}>
            Resultado
          </div>

          {!result ? (
            <div className="small" style={{ marginTop: 8 }}>
              Ejecuta <b>Calcular</b> para ver horas, FTE y mixes sugeridos.
            </div>
          ) : (
            <>
              <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 10 }}>
                <div className="card">
                  <div className="cardPad">
                    <div className="small">Horas requeridas (semana)</div>
                    <div className="h2" style={{ marginTop: 6 }}>
                      {result.requiredHours}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="cardPad">
                    <div className="small">FTE (sobre {fullHoursPerWeek}h)</div>
                    <div className="h2" style={{ marginTop: 6 }}>
                      {result.fte}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hr" style={{ marginTop: 14 }} />

              <div className="h3" style={{ marginTop: 0 }}>
                Demanda por día (horas-persona)
              </div>

              <div style={{ overflowX: "auto", marginTop: 8 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th style={{ textAlign: "right" }}>Horas-persona</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.demandByDay.map((d, i) => (
                      <tr key={i}>
                        <td>{d.day}</td>
                        <td style={{ textAlign: "right" }}>{d.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="hr" style={{ marginTop: 14 }} />

              <div className="h3" style={{ marginTop: 0 }}>
                Mixes sugeridos
              </div>

              <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
                {result.mixes.map((m, i) => (
                  <div key={i} className="card">
                    <div className="cardPad">
                      <div className="h3" style={{ marginTop: 0 }}>
                        {m.title}
                      </div>
                      <div className="small" style={{ marginTop: 6 }}>
                        Personas: <b>{m.headcount}</b> — Horas totales: <b>{m.hoursTotal}</b> — Holgura:{" "}
                        <b>{m.slackHours}</b> — PT share: <b>{Math.round(m.ptShare * 100)}%</b>
                      </div>

                      <div style={{ overflowX: "auto", marginTop: 10 }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Jornada</th>
                              <th>Contrato</th>
                              <th style={{ textAlign: "right" }}>Horas/sem</th>
                              <th style={{ textAlign: "right" }}>Cantidad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.items.map((it, j) => (
                              <tr key={j}>
                                <td>{it.jornadaLabel}</td>
                                <td>{it.contractName}</td>
                                <td style={{ textAlign: "right" }}>{it.hoursPerWeek}</td>
                                <td style={{ textAlign: "right" }}>{it.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="small" style={{ marginTop: 10 }}>
                        Domingo: req {m.sundayReq} / cubre {m.sundayCap} →{" "}
                        <b>{m.sundayOk ? "OK" : "Revisar"}</b>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hr" style={{ marginTop: 14 }} />

              <div className="small">
                Tip: Si la holgura es alta, agrega un contrato intermedio (ej 36h/30h) o ajusta demanda.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lead Modal */}
      <Modal open={leadOpen} title="Guardar reporte (gratis)" onClose={() => setLeadOpen(false)}>
        <div className="small">
          Esto genera un reporte compartible (link) y nos ayuda a mejorar la herramienta.
        </div>

        {leadError ? (
          <div className="alert alertError" style={{ marginTop: 12 }}>
            ❌ {leadError}
          </div>
        ) : null}

        <div className="grid2" style={{ marginTop: 12 }}>
          <div className="field">
            <label className="label">Nombre</label>
            <input
              className="input"
              value={lead.name}
              onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Cargo</label>
            <input
              className="input"
              value={lead.role}
              onChange={(e) => setLead((p) => ({ ...p, role: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 12 }}>
          <div className="field">
            <label className="label">Industria</label>
            <input
              className="input"
              value={lead.industry}
              onChange={(e) => setLead((p) => ({ ...p, industry: e.target.value }))}
              placeholder="retail / hospital / alimentación / logística"
            />
          </div>
          <div className="field">
            <label className="label">Tamaño empresa</label>
            <input
              className="input"
              value={lead.company_size}
              onChange={(e) => setLead((p) => ({ ...p, company_size: e.target.value }))}
              placeholder="Ej: 300"
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="label">Email</label>
          <input
            className="input"
            value={lead.email}
            onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))}
            placeholder="nombre@dominio.com"
          />
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="secondary" onClick={() => setLeadOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSubmitLead} disabled={isLoading}>
            {isLoading ? "Guardando…" : "Guardar y calcular"}
          </Button>
        </div>
      </Modal>
    </main>
  );
}