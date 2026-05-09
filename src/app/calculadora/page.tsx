"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { calculate, type CalcInput, type CalcResult, type Mix, type DayKey } from "@/lib/engine";
import { SlotDemandGrid, computeStats } from "@/components/SlotDemandGrid";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type DayConfig = {
  open: boolean;
  slots: number[];
  breakMinutes: number;
  overlapMinutes: number;
};

type Contract = {
  id: string;
  name: string;
  hoursPerWeek: number;
  costPerHour?: number;
};

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<DayKey, string> = {
  mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom",
};

function makeDefaultDay(open: boolean): DayConfig {
  return { open, slots: Array(48).fill(0), breakMinutes: 30, overlapMinutes: 30 };
}

// ─── Selección de 3 recomendaciones ──────────────────────────────────────────

function selectThreeOptions(mixes: Mix[], hasCosts: boolean, flexTolerance: number) {
  const valid = mixes.filter(m => m.sundayOk && m.coverageOk);
  const pool  = valid.length > 0 ? valid : mixes.filter(m => m.coverageOk).length > 0
    ? mixes.filter(m => m.coverageOk)
    : mixes;
  if (!pool.length) return { cheapest: null, optimal: null, flexible: null };

  // 1. Más económica: menor costo total (o menos horas si no hay costos)
  const byBudget = hasCosts
    ? [...pool].filter(m => m.weeklyCost != null).sort((a, b) => (a.weeklyCost ?? 0) - (b.weeklyCost ?? 0))
    : [...pool].sort((a, b) => a.hoursTotal - b.hoursTotal);
  const cheapest = byBudget[0] ?? pool[0];

  // 2. Óptima: la marcada por el engine, o la que mejor equilibra holgura vs cobertura
  const optimal = pool.find(m => m.isOptimal)
    ?? [...pool].sort((a, b) => a.slackPct - b.slackPct)[0]
    ?? cheapest;

  // 3. Más flexible: mayor ptShare dentro de la tolerancia presupuestaria
  const baseBudget = hasCosts ? (cheapest?.weeklyCost ?? 0) : (cheapest?.hoursTotal ?? 0);
  const maxBudget  = baseBudget * (1 + flexTolerance / 100);
  const flexPool   = hasCosts
    ? pool.filter(m => (m.weeklyCost ?? Infinity) <= maxBudget)
    : pool.filter(m => m.hoursTotal <= maxBudget);
  const flexible = [...(flexPool.length ? flexPool : pool)].sort((a, b) => b.ptShare - a.ptShare)[0];

  return { cheapest, optimal, flexible };
}

function flexibilityScore(mix: Mix): number {
  // 0–100: más alto = más flexible operacionalmente
  return Math.round(mix.ptShare * 70 + (mix.headcount > 1 ? Math.min(mix.headcount / 10, 1) * 30 : 0));
}

// ─── Tarjeta de recomendación ─────────────────────────────────────────────────

function RecommendationCard({
  mix, label, icon, accent, hasCosts, baseWeeklyCost,
}: {
  mix: Mix;
  label: string;
  icon: string;
  accent: boolean;
  hasCosts: boolean;
  baseWeeklyCost: number | null;
}) {
  const flex   = flexibilityScore(mix);
  const budget = hasCosts && mix.weeklyCost != null ? mix.weeklyCost : null;
  const deltaVsBase = (budget != null && baseWeeklyCost != null && baseWeeklyCost > 0)
    ? ((budget - baseWeeklyCost) / baseWeeklyCost * 100)
    : null;

  return (
    <div className={`rounded-xl border flex flex-col gap-0 overflow-hidden ${
      accent ? "border-blue-300 shadow-sm shadow-blue-100" : "border-slate-200"
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${accent ? "bg-blue-600" : "bg-slate-800"}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        {mix.sundayOk
          ? <span className="text-[10px] text-white/70">✓ domingo OK</span>
          : <span className="text-[10px] text-amber-300">⚠ domingo ajustado</span>}
      </div>

      <div className="p-4 flex flex-col gap-4 bg-white flex-1">
        {/* Headcount destacado */}
        <div className="flex items-end justify-between">
          <div>
            <p className={`text-4xl font-bold mono ${accent ? "text-blue-700" : "text-slate-900"}`}>
              {mix.headcount}
            </p>
            <p className="text-xs text-slate-400">personas</p>
          </div>
          {/* Presupuesto */}
          <div className="text-right">
            {budget != null ? (
              <>
                <p className="text-base font-semibold mono text-slate-800">
                  ${budget.toLocaleString("es-CL")}
                </p>
                <p className="text-[10px] text-slate-400">costo empresa / sem</p>
                {deltaVsBase != null && deltaVsBase !== 0 && (
                  <p className={`text-[10px] font-medium ${deltaVsBase > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {deltaVsBase > 0 ? "+" : ""}{deltaVsBase.toFixed(1)}% vs. mínimo
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-base font-semibold mono text-slate-800">{mix.hoursTotal}h</p>
                <p className="text-[10px] text-slate-400">horas / sem</p>
              </>
            )}
          </div>
        </div>

        {/* Composición */}
        <div className="space-y-1.5">
          {mix.items.map((item, j) => (
            <div key={j} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${accent ? "bg-blue-500" : "bg-slate-400"}`} />
                <span className="text-xs text-slate-700 font-medium">{item.contractName}</span>
                <span className="text-xs text-slate-400 mono">{item.jornadaName}</span>
              </div>
              <span className={`text-xs font-bold mono ${accent ? "text-blue-700" : "text-slate-700"}`}>×{item.count}</span>
            </div>
          ))}
        </div>

        {/* Métricas */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400 mb-0.5">Holgura</p>
            <p className={`mono font-semibold ${mix.slackPct > 0.25 ? "text-amber-600" : "text-slate-700"}`}>
              {mix.slackHours}h ({Math.round(mix.slackPct * 100)}%)
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Flexibilidad</p>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${flex >= 60 ? "bg-emerald-500" : flex >= 35 ? "bg-blue-500" : "bg-slate-400"}`}
                  style={{ width: `${flex}%` }}
                />
              </div>
              <span className={`font-semibold mono ${flex >= 60 ? "text-emerald-600" : flex >= 35 ? "text-blue-600" : "text-slate-500"}`}>
                {flex}
              </span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">% Part-time</p>
            <p className="mono font-semibold text-slate-700">{Math.round(mix.ptShare * 100)}%</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Total horas</p>
            <p className="mono font-semibold text-slate-700">{mix.hoursTotal}h</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gate de email ─────────────────────────────────────────────────────────────

function EmailGate({ onSubmit }: { onSubmit: (email: string, nombre: string, empresa: string) => void }) {
  const [email,   setEmail]   = useState("");
  const [nombre,  setNombre]  = useState("");
  const [empresa, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    // Guardamos el lead antes de mostrar resultados
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, empresa, source: "calculadora_gate" }),
      });
    } catch (_) { /* no bloquear si falla */ }
    onSubmit(email, nombre, empresa);
    setLoading(false);
  };

  return (
    <div className="mt-6 border border-blue-200 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-white">
      <div className="px-6 py-5 border-b border-blue-100">
        <p className="text-sm font-semibold text-slate-800">Tu dotación está lista</p>
        <p className="text-xs text-slate-500 mt-1">
          Ingresa tu email para ver las 3 recomendaciones de mix, presupuesto y flexibilidad.
          También te las enviamos para que las tengas guardadas.
        </p>
      </div>
      <div className="px-6 py-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Empresa</label>
            <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
              placeholder="Tu empresa"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Email <span className="text-blue-500">*</span>
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@empresa.cl"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={handleSubmit} disabled={!email || loading}
          className="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Cargando…
            </>
          ) : "Ver mis recomendaciones →"}
        </button>
        <p className="text-[11px] text-slate-400 text-center">Sin spam. Solo tus resultados.</p>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CalculadoraPage() {
  const [days, setDays] = useState<Record<DayKey, DayConfig>>(() => ({
    mon: makeDefaultDay(true),  tue: makeDefaultDay(true),
    wed: makeDefaultDay(true),  thu: makeDefaultDay(true),
    fri: makeDefaultDay(true),  sat: makeDefaultDay(false),
    sun: makeDefaultDay(false),
  }));
  const [activeDay, setActiveDay] = useState<DayKey>("mon");

  const [fullHours,         setFullHours]         = useState(40);
  const [replacementFactor, setReplacementFactor] = useState(1.15);
  const [ptWeekdays,        setPtWeekdays]        = useState(false);
  const [flexTolerance,     setFlexTolerance]     = useState(3); // % más caro que se acepta por flexibilidad

  const [contracts, setContracts] = useState<Contract[]>([
    { id: "2", name: "40h", hoursPerWeek: 40 },
    { id: "3", name: "30h", hoursPerWeek: 30 },
    { id: "4", name: "20h", hoursPerWeek: 20 },
  ]);
  const [showCosts, setShowCosts] = useState(false);

  const [result,       setResult]       = useState<CalcResult | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [emailPassed,  setEmailPassed]  = useState(false);
  const [userEmail,    setUserEmail]    = useState("");

  // ── Helpers ──

  const updateDay = useCallback((key: DayKey, patch: Partial<DayConfig>) => {
    setDays(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const copyDayTo = (from: DayKey, to: DayKey) => {
    setDays(prev => ({ ...prev, [to]: { ...prev[from] } }));
  };

  const addContract    = () => setContracts(prev => [...prev, { id: Date.now().toString(), name: "", hoursPerWeek: 30 }]);
  const removeContract = (id: string) => setContracts(prev => prev.filter(c => c.id !== id));
  const updateContract = (id: string, patch: Partial<Contract>) =>
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  // ── Calcular ──

  const handleCalculate = () => {
    setLoading(true);
    setEmailPassed(false);
    setResult(null);

    setTimeout(() => {
      const input: CalcInput = {
        fullHoursPerWeek: fullHours,
        replacementFactor,
        ptWeekdaysAllowed: ptWeekdays,
        contracts: contracts
          .filter(c => c.hoursPerWeek > 0 && c.name)
          .map(c => ({
            name: c.name,
            hoursPerWeek: c.hoursPerWeek,
            costPerHour: showCosts && c.costPerHour ? c.costPerHour : undefined,
          })),
        days: Object.fromEntries(
          DAY_KEYS.map(k => {
            const d = days[k];
            const { peak, hoursOpen } = computeStats(d.slots);
            return [k, {
              open: d.open,
              hoursOpen: hoursOpen > 0 ? hoursOpen : 0,
              requiredPeople: peak,
              shiftsPerDay: 1,
              overlapMinutes: d.overlapMinutes,
              breakMinutes: d.breakMinutes,
            }];
          })
        ) as CalcInput["days"],
      };
      try {
        setResult(calculate(input));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }, 50);
  };

  // ── Gate de email ──

  const handleEmailSubmit = async (email: string, nombre: string, empresa: string) => {
    setUserEmail(email);
    setEmailPassed(true);
    // Enviar resultados por email
    if (!result) return;
    const { cheapest, optimal, flexible } = selectThreeOptions(result.mixes, result.hasCosts, flexTolerance);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, email, empresa,
          source: "calculadora_resultados",
          sector: "Retail",
          resultados: {
            requiredHours:         result.requiredHours,
            requiredHoursAdjusted: result.requiredHoursAdjusted,
            fte:                   result.fte,
            fteAdjusted:           result.fteAdjusted,
            replacementFactor:     result.replacementFactor,
            gapHours:              result.gapHours,
            totalMixes:            result.totalMixes,
            recomendaciones: { cheapest, optimal, flexible },
          },
        }),
      });
    } catch (_) { /* silencioso */ }
  };

  const d = days[activeDay];

  const threeOptions = (result && emailPassed)
    ? selectThreeOptions(result.mixes, result.hasCosts, flexTolerance)
    : null;

  const baseWeeklyCost = threeOptions?.cheapest?.weeklyCost ?? null;

  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'DM Mono', monospace; }
      `}</style>

      <SiteNav />

      {/* Banner SAN */}
      <div className="border-b border-[#52B788]/20 bg-[#D8F3DC]">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <p className="text-xs text-[#1B4332]">
            <span className="font-semibold">Nuevo:</span> Calculadora SAN Hospitalaria — normativa MINSAL + mix por día + Excel PRO
          </p>
          <Link href="/san" className="text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors flex items-center gap-1">
            Ir a SAN
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Calculadora de dotación por tramos
          </h1>
          <p className="text-sm text-slate-500">
            Dibuja cuántas personas necesitas en cada tramo de 30 min, día por día.
            Obtienes las 3 mejores combinaciones de contratos con presupuesto y flexibilidad.
          </p>
        </div>

        {/* Layout 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* ── PANEL IZQUIERDO: Demanda por día ── */}
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Demanda por día</h2>
              <span className="text-xs text-slate-400">Arrastra para definir personas por tramo</span>
            </div>

            <div className="px-5 pt-4">
              <div className="flex gap-1 flex-wrap">
                {DAY_KEYS.map(k => {
                  const s = computeStats(days[k].slots);
                  return (
                    <button key={k} onClick={() => setActiveDay(k)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeDay === k ? "bg-slate-900 text-white"
                        : days[k].open && s.personHours > 0 ? "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                        : days[k].open ? "bg-white border border-dashed border-slate-200 text-slate-500"
                        : "bg-white border border-dashed border-slate-200 text-slate-300"
                      }`}>
                      {DAY_LABELS[k]}
                      {days[k].open && s.personHours > 0 && (
                        <span className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${activeDay === k ? "bg-blue-400" : "bg-emerald-400"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div onClick={() => updateDay(activeDay, { open: !d.open })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${d.open ? "bg-blue-600" : "bg-slate-200"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${d.open ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-slate-700 font-medium">
                  {DAY_LABELS[activeDay]} — {d.open ? "abierto" : "cerrado"}
                </span>
              </label>

              {d.open && (
                <>
                  <SlotDemandGrid
                    values={d.slots}
                    onChange={slots => updateDay(activeDay, { slots })}
                    maxPeople={10}
                    startHour={0}
                  />
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Colación (min)</label>
                      <input type="number" min={0} max={120} step={5} value={d.breakMinutes}
                        onChange={e => updateDay(activeDay, { breakMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Traslape (min)</label>
                      <input type="number" min={0} max={120} step={5} value={d.overlapMinutes}
                        onChange={e => updateDay(activeDay, { overlapMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  {d.breakMinutes > d.overlapMinutes && (
                    <p className="text-xs text-amber-600">
                      ⚠ Brecha colación: {((d.breakMinutes - d.overlapMinutes) / 60).toFixed(1)}h extra a cubrir
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 shrink-0">Copiar a:</span>
                    <div className="flex gap-1 flex-wrap">
                      {DAY_KEYS.filter(k => k !== activeDay).map(k => (
                        <button key={k} onClick={() => copyDayTo(activeDay, k)}
                          className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
                          {DAY_LABELS[k]}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs text-slate-500 shrink-0">Semana:</span>
                {DAY_KEYS.map(k => {
                  const s = computeStats(days[k].slots);
                  return days[k].open && s.personHours > 0 ? (
                    <span key={k} className="text-xs mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {DAY_LABELS[k]} <span className="font-semibold">{s.personHours}h‑p</span>
                    </span>
                  ) : (
                    <span key={k} className="text-xs text-slate-300">{DAY_LABELS[k]}</span>
                  );
                })}
                {(() => {
                  const total = DAY_KEYS.reduce((sum, k) => sum + computeStats(days[k].slots).personHours, 0);
                  return total > 0 ? <span className="ml-auto text-xs font-semibold mono text-slate-700">{total}h‑p/sem</span> : null;
                })()}
              </div>
            </div>
          </section>

          {/* ── PANEL DERECHO ── */}
          <div className="space-y-6">

            {/* Configuración */}
            <section className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-700">Configuración</h2>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Horas Full (FTE base)</label>
                    <input type="number" min={20} max={60} step={1} value={fullHours}
                      onChange={e => setFullHours(parseInt(e.target.value) || 40)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-slate-400 mt-1">Ley 40h vigente</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Factor reemplazo <span className="text-slate-400">(vacac. + lic.)</span></label>
                    <input type="number" min={1} max={1.5} step={0.01} value={replacementFactor}
                      onChange={e => setReplacementFactor(parseFloat(e.target.value) || 1.15)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-slate-400 mt-1">{((replacementFactor - 1) * 100).toFixed(0)}% — retail ~12%</p>
                  </div>
                </div>

                {/* Tolerancia de flexibilidad */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-500">Tolerancia presupuestaria para flexibilidad</label>
                    <span className="text-xs font-semibold mono text-blue-600">+{flexTolerance}%</span>
                  </div>
                  <input type="range" min={0} max={15} step={1} value={flexTolerance}
                    onChange={e => setFlexTolerance(parseInt(e.target.value))}
                    className="w-full accent-blue-600" />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cuánto más caro puede ser el mix más flexible respecto al más económico
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={ptWeekdays} onChange={e => setPtWeekdays(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <div>
                    <span className="text-sm text-slate-700">Permitir PT en días de semana (L–V)</span>
                    <p className="text-xs text-slate-400">Para servicios sin demanda de fin de semana</p>
                  </div>
                </label>
              </div>
            </section>

            {/* Contratos */}
            <section className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">Contratos disponibles</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Tipos de contrato que permite tu empresa</p>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showCosts} onChange={e => setShowCosts(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600" />
                  <span className="text-xs text-slate-500">Agregar costos</span>
                </label>
              </div>
              <div className="px-5 py-4">
                <div className="space-y-2">
                  <div className={`grid gap-2 pb-1 border-b border-slate-100 ${showCosts ? "grid-cols-[1fr_80px_100px_32px]" : "grid-cols-[1fr_100px_32px]"}`}>
                    <span className="text-xs text-slate-400">Nombre</span>
                    <span className="text-xs text-slate-400">Horas/sem</span>
                    {showCosts && <span className="text-xs text-slate-400">$/hora</span>}
                    <span />
                  </div>
                  {contracts.map(c => (
                    <div key={c.id} className={`grid gap-2 items-center ${showCosts ? "grid-cols-[1fr_80px_100px_32px]" : "grid-cols-[1fr_100px_32px]"}`}>
                      <input type="text" value={c.name} onChange={e => updateContract(c.id, { name: e.target.value })}
                        placeholder="Ej: Full time"
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="number" min={1} max={60} value={c.hoursPerWeek}
                        onChange={e => updateContract(c.id, { hoursPerWeek: parseInt(e.target.value) || 0 })}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      {showCosts && (
                        <input type="number" min={0} step={100} value={c.costPerHour ?? ""}
                          onChange={e => updateContract(c.id, { costPerHour: parseFloat(e.target.value) || undefined })}
                          placeholder="0"
                          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      )}
                      <button onClick={() => removeContract(c.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addContract}
                  className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar contrato
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Botón calcular */}
        <div className="flex items-center gap-4 py-2">
          <button onClick={handleCalculate} disabled={loading}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Calculando…
              </>
            ) : "Calcular dotación"}
          </button>
          <Link href="/calculadora/guia" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
            Ver guía de uso →
          </Link>
        </div>

        {/* ── Gate de email (antes de ver resultados) ── */}
        {result && !emailPassed && (
          <EmailGate onSubmit={handleEmailSubmit} />
        )}

        {/* ── Resultados ── */}
        {result && emailPassed && threeOptions && (
          <section className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Tus 3 recomendaciones</h2>
              <span className="text-xs text-slate-400">
                Enviadas a {userEmail}
              </span>
            </div>

            {result.warnings.length > 0 && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 space-y-1">
                {result.warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">{w}</p>)}
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100">
              {[
                { label: "Horas‑persona / sem", value: result.requiredHours.toFixed(1),         sub: "demanda bruta" },
                { label: "Horas a contratar",   value: result.requiredHoursAdjusted.toFixed(1), sub: `×${result.replacementFactor} reemplazo`, highlight: true },
                { label: "FTE bruto",           value: result.fte.toFixed(2),                   sub: "sin reemplazo" },
                { label: "FTE a contratar",     value: result.fteAdjusted.toFixed(2),           sub: "dotación real", highlight: true },
              ].map(k => (
                <div key={k.label} className={`px-5 py-4 ${k.highlight ? "bg-blue-50" : "bg-white"}`}>
                  <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold mono ${k.highlight ? "text-blue-700" : "text-slate-900"}`}>{k.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-px bg-slate-100">
              {[
                { label: "Horas colación", value: result.breakHours.toFixed(1) + "h" },
                { label: "Horas traslape", value: result.overlapHours.toFixed(1) + "h" },
                { label: "Brecha neta",    value: result.gapHours.toFixed(1) + "h", warn: result.gapHours > 0 },
              ].map(k => (
                <div key={k.label} className="bg-white px-5 py-3">
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className={`text-base font-semibold mono mt-0.5 ${k.warn ? "text-amber-600" : "text-slate-700"}`}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* 3 tarjetas */}
            <div className="px-5 py-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Mix de contratos</h3>
                {flexTolerance > 0 && (
                  <span className="text-xs text-slate-400 mono">
                    flexibilidad: tolerancia +{flexTolerance}% presupuesto
                  </span>
                )}
              </div>

              {threeOptions.cheapest || threeOptions.optimal || threeOptions.flexible ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {threeOptions.cheapest && (
                    <RecommendationCard
                      mix={threeOptions.cheapest}
                      label="Más económica"
                      icon="💰"
                      accent={false}
                      hasCosts={result.hasCosts}
                      baseWeeklyCost={baseWeeklyCost}
                    />
                  )}
                  {threeOptions.optimal && (
                    <RecommendationCard
                      mix={threeOptions.optimal}
                      label="Equilibrada"
                      icon="⚖️"
                      accent={true}
                      hasCosts={result.hasCosts}
                      baseWeeklyCost={baseWeeklyCost}
                    />
                  )}
                  {threeOptions.flexible && (
                    <RecommendationCard
                      mix={threeOptions.flexible}
                      label="Más flexible"
                      icon="🔄"
                      accent={false}
                      hasCosts={result.hasCosts}
                      baseWeeklyCost={baseWeeklyCost}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No se encontraron mixes válidos. Revisa que los contratos puedan cubrir todos los días abiertos.
                </p>
              )}

              {/* CTA turno de pago (fase 2) */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">¿Quieres el calendario de turnos del mes?</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generamos 4 semanas de turnos para cada una de tus 3 opciones. Descarga en Excel, listo para operar.
                  </p>
                </div>
                <button
                  disabled
                  className="shrink-0 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-50 cursor-not-allowed">
                  Próximamente
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
