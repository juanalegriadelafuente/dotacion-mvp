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

function rangeFill(
  arr: number[],
  startSlot: number,
  endSlot: number,
  value: number,
) {
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
    <div
      className="modalOverlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="modal">
        <div className="modalPad">
          <div className="modalHead">
            <div>
              <div className="h2">{title}</div>
              <div className="small" style={{ marginTop: 4 }}>
                Te enviamos un link al reporte (y te avisamos cuando haya
                mejoras).
              </div>
            </div>
            <button className="iconBtn" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>
          <div style={{ marginTop: 12 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function CalculadoraPage() {
  

  // Base
  const [fullHoursPerWeek, setFullHoursPerWeek] = useState("42");
  const [fullTimeThresholdHours, setFullTimeThresholdHours] = useState("30");

  // Contratos
  const [contracts, setContracts] = useState<ContractRow[]>([
    { name: "42h", hoursPerWeek: "42" },
    { name: "36h", hoursPerWeek: "36" },
    { name: "30h", hoursPerWeek: "30" },
    { name: "20h", hoursPerWeek: "20" },
  ]);

  // Preferencias
  const [prefs, setPrefs] = useState<Preferences>({
    strategy: "balanced",
    allow_6x1: true,
    allow_5x2: true,
    allow_4x3: true,
    allow_pt_weekend: true,
    pt_weekend_strict: true,
  });

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

    track("dot_calculadora_load_example", { version: "step4" });
  }, []);

  useEffect(() => {
  const ex = new URLSearchParams(window.location.search).get("example");
  if (ex === "1") loadExample();
}, [loadExample]);

  const selectedSlots = demand30[selectedDay];
  const dayBaseHours = useMemo(
    () => slotsBaseHours(selectedSlots),
    [selectedSlots],
  );
  const dayPeak = useMemo(() => slotsPeak(selectedSlots), [selectedSlots]);
  const daySegments = useMemo(
    () => slotsToSegments(selectedSlots),
    [selectedSlots],
  );

  const weekBaseHours = useMemo(() => {
    let sum = 0;
    for (const d of DAY_ORDER) {
      if (!dayOpen[d]) continue;
      sum += slotsBaseHours(demand30[d]);
    }
    return Math.round(sum * 10) / 10;
  }, [dayOpen, demand30]);

  function toggleOpenDay(day: DayKey, open: boolean) {
    setDayOpen((p) => ({ ...p, [day]: open }));
    if (!open) {
      setDemand30((p) => ({ ...p, [day]: freshSlots() }));
    }
  }

  function applyRangeFill() {
    const s = timeToSlot(rangeStart);
    const e = timeToSlot(rangeEnd);
    const v = clamp(Number(rangeValue || 0), 0, 99);

    setDemand30((prev) => ({
      ...prev,
      [selectedDay]: rangeFill(prev[selectedDay], s, e, v),
    }));

    if (!dayOpen[selectedDay] && v > 0) toggleOpenDay(selectedDay, true);
  }

  function clearDay() {
    setDemand30((prev) => ({ ...prev, [selectedDay]: freshSlots() }));
  }

  function updateCell(i: number, value: string) {
    const v = clamp(Number(value || 0), 0, 99);
    setDemand30((prev) => {
      const arr = prev[selectedDay].slice();
      arr[i] = v;
      return { ...prev, [selectedDay]: arr };
    });
    if (!dayOpen[selectedDay] && v > 0) toggleOpenDay(selectedDay, true);
  }

  function copyDay(from: DayKey, to: DayKey) {
    setDemand30((prev) => ({ ...prev, [to]: prev[from].slice() }));
    if (!dayOpen[from]) toggleOpenDay(to, false);
    else toggleOpenDay(to, true);
  }

  function copyDayToAll(from: DayKey) {
    setDemand30((prev) => {
      const src = prev[from].slice();
      const out = { ...prev } as Record<DayKey, number[]>;
      for (const d of DAY_ORDER) out[d] = src.slice();
      return out;
    });
    setDayOpen({
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: true,
      sun: true,
    });
  }

  function buildPayload() {
    const fteDen = clamp(Number(fullHoursPerWeek || 42), 1, 80);
    const threshold = clamp(Number(fullTimeThresholdHours || 30), 1, 60);

    const cleanContracts = contracts
      .map((c) => ({
        name: (c.name || "").trim(),
        hoursPerWeek: clamp(Number(c.hoursPerWeek || 0), 1, 80),
      }))
      .filter((c) => c.name.length > 0 && c.hoursPerWeek > 0);

    const demand30Payload: Partial<Record<DayKey, number[]>> = {};
    const days: any = {};

    for (const d of DAY_ORDER) {
      const slots = demand30[d];
      const base = slotsBaseHours(slots);
      const peak = slotsPeak(slots);
      const open = Boolean(dayOpen[d]) && base > 0.0001;

      if (open) demand30Payload[d] = slots;

      days[d] = {
        open,
        hoursOpen: base,
        requiredPeople: peak,
        overlapMinutes: clamp(Number(overlapByDay[d] || 0), 0, 300),
        breakMinutes: clamp(Number(breakByDay[d] || 0), 0, 300),
      };
    }

    return {
      fullHoursPerWeek: fteDen,
      fullTimeThresholdHours: threshold,
      days,
      contracts: cleanContracts,
      preferences: prefs,
      demand30: demand30Payload,
      debugNonce: Date.now(),
    };
  }

  function onClickCalculate() {
    setLeadError(null);
    setLeadOpen(true);
  }

  async function runCalculateAndLeadSave() {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setReportId(null);

    try {
      const calcInput = buildPayload();

      // 1) Calcular
      const resp = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calcInput),
      });

      const json = (await resp.json()) as CalcResponse;
      if (!resp.ok || !json.ok)
        throw new Error((json as any)?.error || "Error calculando.");

      setResult(json.result);
      track("dot_calculadora_calculate", { version: "step4" });

      // 2) Guardar lead + enviar correo
      const leadPayload: any = {
        email: lead.email.trim(),
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
        const id =
          leadJson?.id || leadJson?.leadId || leadJson?.data?.id || null;
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
      return setLeadError(
        "¿Industria? (retail / hospital / alimentación / logística)",
      );
    if (!lead.company_size.trim())
      return setLeadError("¿Cantidad aprox. de empleados?");
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
                onClick={onClickCalculate}
                disabled={isLoading}
              >
                {isLoading ? "Calculando…" : "Calcular"}
              </Button>
              <span className="small">
                Tip: usa <span className="kbd">Rellenar rango</span> y deja la
                grilla para ajustes finos.
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardPad">
            <div className="cardHead">
              <h2 className="h2">Resumen base</h2>
              <span className="small">semana</span>
            </div>
            <div className="hr" />
            <div className="alert statCard">
              <div className="statLabel">Horas-persona base (sin gap)</div>
              <div className="statValue">{weekBaseHours}</div>
            </div>
            <div style={{ marginTop: 10 }} className="small">
              Gap colación/traslape se agrega en el cálculo.
            </div>
          </div>
        </div>
      </div>

      {/* Config */}
      <div style={{ marginTop: 14 }} className="grid2">
        <div className="card">
          <div className="cardPad">
            <div className="cardHead">
              <h2 className="h2">Base (FTE y umbral)</h2>
              <span className="small">Paso 1</span>
            </div>
            <div className="hr" />

            <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <div className="label">Horas full para 1 FTE (ej: 42)</div>
                <input
                  className="input"
                  value={fullHoursPerWeek}
                  onChange={(e) => setFullHoursPerWeek(e.target.value)}
                />
              </div>

              <div className="field">
                <div className="label">Umbral FT/PT (ej: 30)</div>
                <input
                  className="input"
                  value={fullTimeThresholdHours}
                  onChange={(e) => setFullTimeThresholdHours(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }} className="small">
              FTE = horas requeridas / horas full.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardPad">
            <div className="cardHead">
              <h2 className="h2">Contratos disponibles</h2>
              <span className="small">Paso 2</span>
            </div>
            <div className="hr" />

            <div style={{ display: "grid", gap: 10 }}>
              {contracts.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 0.8fr auto",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <input
                    className="input"
                    placeholder="Nombre (ej: 42h)"
                    value={c.name}
                    onChange={(e) =>
                      setContracts((p) => {
                        const out = p.slice();
                        out[idx] = { ...out[idx], name: e.target.value };
                        return out;
                      })
                    }
                  />
                  <input
                    className="input"
                    placeholder="Horas/sem"
                    value={c.hoursPerWeek}
                    onChange={(e) =>
                      setContracts((p) => {
                        const out = p.slice();
                        out[idx] = {
                          ...out[idx],
                          hoursPerWeek: e.target.value,
                        };
                        return out;
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setContracts((p) => p.filter((_, i) => i !== idx))
                    }
                    disabled={contracts.length <= 1}
                  >
                    Quitar
                  </Button>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Button
                onClick={() =>
                  setContracts((p) => [
                    ...p,
                    { name: `Nuevo`, hoursPerWeek: "30" },
                  ])
                }
              >
                + Agregar contrato
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferencias + Día editor */}
      <div style={{ marginTop: 14 }} className="gridMain">
        <div className="card">
          <div className="cardPad">
            <div className="cardHead">
              <h2 className="h2">Preferencias de mix</h2>
              <span className="small">Paso 3</span>
            </div>
            <div className="hr" />

            <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <div className="label">Estrategia</div>
                <select
                  className="select"
                  value={prefs.strategy}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, strategy: e.target.value as any }))
                  }
                >
                  <option value="balanced">Balanceado</option>
                  <option value="min_people">Menos personas</option>
                  <option value="stable">Más estable (menos PT)</option>
                </select>
              </div>

              <div className="field">
                <div className="label">Nota</div>
                <div className="small">
                  4x3 solo funciona si incluyes contrato <b>40h</b>.
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                className={`toggle ${prefs.allow_6x1 ? "toggleOn" : ""}`}
                onClick={() =>
                  setPrefs((p) => ({ ...p, allow_6x1: !p.allow_6x1 }))
                }
              >
                <span className="dot" /> Permitir 6x1
              </button>

              <button
                className={`toggle ${prefs.allow_5x2 ? "toggleOn" : ""}`}
                onClick={() =>
                  setPrefs((p) => ({ ...p, allow_5x2: !p.allow_5x2 }))
                }
              >
                <span className="dot" /> Permitir 5x2
              </button>

              <button
                className={`toggle ${prefs.allow_4x3 ? "toggleOn" : ""}`}
                onClick={() =>
                  setPrefs((p) => ({ ...p, allow_4x3: !p.allow_4x3 }))
                }
              >
                <span className="dot" /> Permitir 4x3 (40h)
              </button>

              <button
                className={`toggle ${prefs.allow_pt_weekend ? "toggleOn" : ""}`}
                onClick={() =>
                  setPrefs((p) => ({
                    ...p,
                    allow_pt_weekend: !p.allow_pt_weekend,
                  }))
                }
              >
                <span className="dot" /> Permitir PT fin de semana
              </button>

              <button
                className={`toggle ${prefs.pt_weekend_strict ? "toggleOn" : ""}`}
                onClick={() =>
                  setPrefs((p) => ({
                    ...p,
                    pt_weekend_strict: !p.pt_weekend_strict,
                  }))
                }
              >
                <span className="dot" /> PT estricto
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardPad">
            <div className="cardHead">
              <h2 className="h2">Operación (gap)</h2>
              <span className="small">aplica por día</span>
            </div>
            <div className="hr" />
            <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <div className="label">
                  Traslape (min) — {DAY_LABEL[selectedDay]}
                </div>
                <input
                  className="input"
                  value={overlapByDay[selectedDay]}
                  onChange={(e) =>
                    setOverlapByDay((p) => ({
                      ...p,
                      [selectedDay]: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field">
                <div className="label">
                  Colación no imputable (min) — {DAY_LABEL[selectedDay]}
                </div>
                <input
                  className="input"
                  value={breakByDay[selectedDay]}
                  onChange={(e) =>
                    setBreakByDay((p) => ({
                      ...p,
                      [selectedDay]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div style={{ marginTop: 8 }} className="small">
              Si colación &gt; traslape, se suman horas-persona extra usando el
              peak del día.
            </div>
          </div>
        </div>
      </div>

      {/* Paso 4 */}
      <div style={{ marginTop: 14 }} className="card">
        <div className="cardPad">
          <div className="cardHead">
            <h2 className="h2">
              Paso 4 — Necesidad operativa por tramos (30 min)
            </h2>
            <span className="small">día por día</span>
          </div>
          <div className="hr" />

          <div className="pills">
            {DAY_ORDER.map((d) => (
              <button
                key={d}
                className={`pill ${selectedDay === d ? "pillOn" : ""}`}
                onClick={() => setSelectedDay(d)}
                title={DAY_LABEL[d]}
              >
                {DAY_LABEL[d]}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              className={`toggle ${dayOpen[selectedDay] ? "toggleOn" : ""}`}
              onClick={() => toggleOpenDay(selectedDay, !dayOpen[selectedDay])}
            >
              <span className="dot" /> Día abierto
            </button>

            <span className="small">
              Base: <b>{dayBaseHours}</b> hrs-persona · Peak: <b>{dayPeak}</b>{" "}
              pers.
            </span>
          </div>

          <div style={{ marginTop: 12 }} className="grid2">
            <div
              className="card"
              style={{ background: "var(--panel2)" as any }}
            >
              <div className="cardPad">
                <div className="h2">Rellenar rango (rápido)</div>
                <div className="small" style={{ marginTop: 4 }}>
                  Ej: 12:00 a 16:00 = 3 personas
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: 10,
                    alignItems: "end",
                  }}
                >
                  <div className="field">
                    <div className="label">Inicio</div>
                    <input
                      className="input"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      placeholder="08:00"
                    />
                  </div>
                  <div className="field">
                    <div className="label">Fin</div>
                    <input
                      className="input"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      placeholder="18:00"
                    />
                  </div>
                  <div className="field">
                    <div className="label">Personas</div>
                    <input
                      className="input"
                      value={rangeValue}
                      onChange={(e) => setRangeValue(e.target.value)}
                      placeholder="2"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={applyRangeFill}
                    disabled={!dayOpen[selectedDay]}
                  >
                    Aplicar
                  </Button>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <Button onClick={clearDay} disabled={!dayOpen[selectedDay]}>
                    Limpiar día
                  </Button>

                  <div className="field" style={{ minWidth: 160 }}>
                    <div className="label">Copiar a…</div>
                    <select
                      className="select"
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

                  <Button
                    onClick={() => copyDay(selectedDay, copyTarget)}
                    disabled={!dayOpen[selectedDay]}
                  >
                    Copiar día
                  </Button>

                  <Button
                    onClick={() => copyDayToAll(selectedDay)}
                    disabled={!dayOpen[selectedDay]}
                  >
                    Copiar a toda la semana
                  </Button>
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{ background: "var(--panel2)" as any }}
            >
              <div className="cardPad">
                <div className="cardHead">
                  <div>
                    <div className="h2">Resumen del día</div>
                    <div className="small">
                      segmentos detectados (solo valores ≠ 0)
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowGrid((v) => !v)}
                    disabled={!dayOpen[selectedDay]}
                  >
                    {showGrid ? "Ocultar grilla" : "Ver grilla"}
                  </Button>
                </div>

                <div className="hr" />

                {daySegments.length === 0 ? (
                  <div className="small">
                    Aún no hay tramos (o el día está en 0). Usa “Rellenar
                    rango”.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {daySegments.slice(0, 10).map((s, idx) => (
                      <div key={idx} className="alert">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <span>
                            {slotLabel(s.start)}–{slotLabel(s.end)}
                          </span>
                          <b>{s.value} pers.</b>
                        </div>
                      </div>
                    ))}
                    {daySegments.length > 10 ? (
                      <div className="small">
                        …y {daySegments.length - 10} tramos más
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {showGrid ? (
            <div style={{ marginTop: 14 }} className="tableWrap">
              <table className="gridTable">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th className="num">Personas</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSlots.map((v, i) => (
                    <tr key={i}>
                      <td>{slotLabel(i)}</td>
                      <td className="num">
                        <input
                          className="cellInput"
                          type="number"
                          min={0}
                          max={99}
                          value={v}
                          disabled={!dayOpen[selectedDay]}
                          onChange={(e) => updateCell(i, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div style={{ marginTop: 12 }} className="small">
            Consejo: si tu operación es estable, usa pocos tramos grandes. Si
            tiene “puntas”, marca solo esos cambios.
          </div>

          {/* ✅ Botón grande debajo del Paso 4 */}
          <div style={{ marginTop: 14 }}>
            <Button
              variant="primary"
              className="btnBig"
              onClick={onClickCalculate}
              disabled={isLoading}
            >
              {isLoading ? "Calculando…" : "Calcular (generar reporte)"}
            </Button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div style={{ marginTop: 14 }}>
        {error ? <div className="alert alertError">❌ {error}</div> : null}

        {result ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div className="card">
              <div className="cardPad">
                <div className="cardHead">
                  <h2 className="h2">Resultado</h2>
                  <span className="small">requerimiento y mixes</span>
                </div>
                <div className="hr" />

                <div
                  className="grid2"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <div className="alert statCard">
                    <div className="statLabel">Horas requeridas</div>
                    <div className="statValue">{result.requiredHours}</div>
                  </div>
                  <div className="alert statCard">
                    <div className="statLabel">FTE estimado</div>
                    <div className="statValue">{result.fte}</div>
                  </div>
                </div>

                {reportId ? (
                  <div style={{ marginTop: 10 }} className="alert alertOk">
                    ✅ Reporte generado:{" "}
                    <Link
                      href={`/reporte/${reportId}`}
                      style={{ fontWeight: 950, textDecoration: "underline" }}
                    >
                      /reporte/{reportId}
                    </Link>
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }} className="small">
                    Si tu /api/leads devuelve un id, acá mostramos el link al
                    reporte automáticamente.
                  </div>
                )}

                {result.warnings?.length ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="h2">Warnings</div>
                    <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                      {result.warnings.map((w, idx) => (
                        <div key={idx} className="alert alertWarn">
                          ⚠️ {w}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div style={{ marginTop: 12 }}>
                  <div className="h2">Demanda por día (hrs-persona)</div>
                  <div style={{ marginTop: 10 }} className="tableWrap">
                    <table className="gridTable" style={{ minWidth: 420 }}>
                      <thead>
                        <tr>
                          <th>Día</th>
                          <th className="num">Horas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.demandByDay.map((d, idx) => (
                          <tr key={idx}>
                            <td>{d.day}</td>
                            <td className="num">
                              <b>{d.hours}</b>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className="h2">Mix sugeridos</div>
                  <div className="small">
                    Te mostramos alternativas: balanceado, menos personas, menos
                    PT, etc.
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
                    {result.mixes.map((m, idx) => (
                      <div
                        key={idx}
                        className="card"
                        style={{ background: "var(--panel2)" as any }}
                      >
                        <div className="cardPad">
                          <div className="cardHead">
                            <div>
                              <div style={{ fontWeight: 950, fontSize: 16 }}>
                                {m.title}
                              </div>
                              <div className="small">
                                Headcount: <b>{m.headcount}</b> · Horas:{" "}
                                <b>{m.hoursTotal}</b> · Holgura:{" "}
                                <b>{m.slackHours}</b> (
                                {Math.round(m.slackPct * 100)}%) · PT:{" "}
                                <b>{Math.round(m.ptShare * 100)}%</b>
                              </div>
                            </div>
                            <div
                              className={`alert ${m.sundayOk ? "alertOk" : "alertError"}`}
                              style={{ padding: "8px 10px" }}
                            >
                              <div className="small">Domingo</div>
                              <div style={{ fontWeight: 950 }}>
                                {m.sundayOk ? "OK" : "Revisar"}
                              </div>
                            </div>
                          </div>

                          <div className="hr" />

                          <div className="tableWrap">
                            <table
                              className="gridTable"
                              style={{ minWidth: 760 }}
                            >
                              <thead>
                                <tr>
                                  <th>Jornada</th>
                                  <th>Contrato</th>
                                  <th className="num">Horas/Sem</th>
                                  <th className="num">Cantidad</th>
                                  <th className="num">Tipo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {m.items.map((it, j) => (
                                  <tr key={j}>
                                    <td>{it.jornadaLabel}</td>
                                    <td>{it.contractName}</td>
                                    <td className="num">{it.hoursPerWeek}</td>
                                    <td className="num">
                                      <b>{it.count}</b>
                                    </td>
                                    <td className="num">
                                      {it.isPt ? "PT" : "Full"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div style={{ marginTop: 10 }} className="small">
                            Consejo: si ves mucha holgura, prueba agregando un
                            contrato intermedio (ej 36h/30h/16h) o ajusta
                            demanda.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <details style={{ marginTop: 12 }}>
                    <summary
                      className="small"
                      style={{ cursor: "pointer", fontWeight: 950 }}
                    >
                      Ver JSON completo (debug)
                    </summary>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        marginTop: 10,
                        fontSize: 12,
                      }}
                      className="alert"
                    >
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal lead */}
      <Modal
        open={leadOpen}
        title="Antes de calcular (para enviarte el reporte)"
        onClose={() => setLeadOpen(false)}
      >
        <div className="modalGrid">
          <div className="field">
            <div className="label">Nombre</div>
            <input
              className="input"
              value={lead.name}
              onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
              placeholder="Juan"
            />
          </div>

          <div className="field">
            <div className="label">Cargo</div>
            <input
              className="input"
              value={lead.role}
              onChange={(e) => setLead((p) => ({ ...p, role: e.target.value }))}
              placeholder="Jefe de Operaciones"
            />
          </div>

          <div className="field">
            <div className="label">Industria</div>
            <input
              className="input"
              value={lead.industry}
              onChange={(e) =>
                setLead((p) => ({ ...p, industry: e.target.value }))
              }
              placeholder="Retail / Hospital / Alimentación"
            />
          </div>

          <div className="field">
            <div className="label">Cantidad de empleados</div>
            <input
              className="input"
              value={lead.company_size}
              onChange={(e) =>
                setLead((p) => ({ ...p, company_size: e.target.value }))
              }
              placeholder="120"
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div className="label">Email</div>
            <input
              className="input"
              value={lead.email}
              onChange={(e) =>
                setLead((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="nombre@dominio.com"
            />
            <div className="small" style={{ marginTop: 4 }}>
              Evita emails “de ejemplo”. Usa un correo real para recibir el
              reporte.
            </div>
          </div>
        </div>

        {leadError ? (
          <div style={{ marginTop: 10 }} className="alert alertError">
            ❌ {leadError}
          </div>
        ) : null}

        <div className="modalActions">
          <Button onClick={() => setLeadOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={onSubmitLead}>
            Continuar y calcular
          </Button>
        </div>
      </Modal>
    </main>
  );
}
