"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { calculate, type CalcInput, type CalcResult, type DayKey } from "@/lib/engine";
import { SlotDemandGrid, computeStats } from "@/components/SlotDemandGrid";

// ─── Tipos ──────────────────────────────────────────────────────────────────

type DayConfig = {
  open: boolean;
  slots: number[]; // 48 tramos × personas requeridas
  breakMinutes: number;
  overlapMinutes: number;
};

type Contract = { id: string; name: string; hoursPerWeek: number };

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<DayKey, string> = {
  mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom",
};

function makeDefaultDay(open: boolean): DayConfig {
  return {
    open,
    slots: Array(48).fill(0),
    breakMinutes: 30,
    overlapMinutes: 30,
  };
}

// ─── Página ─────────────────────────────────────────────────────────────────

export default function CalculadoraPage() {
  const [days, setDays] = useState<Record<DayKey, DayConfig>>(() => ({
    mon: makeDefaultDay(true),
    tue: makeDefaultDay(true),
    wed: makeDefaultDay(true),
    thu: makeDefaultDay(true),
    fri: makeDefaultDay(true),
    sat: makeDefaultDay(false),
    sun: makeDefaultDay(false),
  }));
  const [activeDay, setActiveDay] = useState<DayKey>("mon");

  const [fullHours, setFullHours] = useState(42);
  const [replacementFactor, setReplacementFactor] = useState(1.15);
  const [ptWeekdays, setPtWeekdays] = useState(false);
  const [strategy, setStrategy] = useState("balanced");

  const [contracts, setContracts] = useState<Contract[]>([
    { id: "1", name: "44h", hoursPerWeek: 44 },
    { id: "2", name: "42h", hoursPerWeek: 42 },
    { id: "3", name: "40h", hoursPerWeek: 40 },
    { id: "4", name: "30h", hoursPerWeek: 30 },
    { id: "5", name: "20h", hoursPerWeek: 20 },
  ]);

  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Helpers ──

  const updateDay = useCallback((key: DayKey, patch: Partial<DayConfig>) => {
    setDays((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const copyDayTo = (from: DayKey, to: DayKey) => {
    setDays((prev) => ({ ...prev, [to]: { ...prev[from] } }));
  };

  const addContract = () => {
    setContracts((prev) => [...prev, { id: Date.now().toString(), name: "", hoursPerWeek: 40 }]);
  };
  const removeContract = (id: string) => setContracts((prev) => prev.filter((c) => c.id !== id));
  const updateContract = (id: string, patch: Partial<Contract>) =>
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  // ── Calcular ──

  const handleCalculate = () => {
    setLoading(true);
    setTimeout(() => {
      const input: CalcInput = {
        fullHoursPerWeek: fullHours,
        replacementFactor,
        ptWeekdaysAllowed: ptWeekdays,
        contracts: contracts
          .filter((c) => c.hoursPerWeek > 0 && c.name)
          .map((c) => ({ name: c.name, hoursPerWeek: c.hoursPerWeek })),
        days: Object.fromEntries(
          DAY_KEYS.map((k) => {
            const d = days[k];
            const { peak, hoursOpen, personHours } = computeStats(d.slots);
            return [k, {
              open: d.open,
              // hoursOpen ahora viene de la curva real, no de un input manual
              hoursOpen: hoursOpen > 0 ? hoursOpen : 0,
              // requiredPeople = peak de la curva (para el proxy dominical)
              requiredPeople: peak,
              shiftsPerDay: 1,
              overlapMinutes: d.overlapMinutes,
              breakMinutes: d.breakMinutes,
            }];
          })
        ) as CalcInput["days"],
      };
      try {
        const r = calculate(input);
        setResult(r);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }, 50);
  };

  const d = days[activeDay];
  const activeStats = computeStats(d.slots);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'DM Mono', monospace; }
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-slate-900 text-lg tracking-tight">
            dotaciones<span className="text-blue-600">.cl</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/san" className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">SAN Hospitalaria</Link>
            <Link href="/blog" className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">Blog</Link>
            <Link href="/contacto" className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">Contacto</Link>
          </nav>
        </div>
      </header>

      {/* Banner SAN */}
      <div className="border-b border-blue-100 bg-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Nuevo:</span> Calculadora SAN Hospitalaria — normativa MINSAL + mix por día + Excel PRO
          </p>
          <Link href="/san" className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors flex items-center gap-1">
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
            Dibuja cuántas personas necesitas en cada tramo de 30 min, día por día. Obtienes horas‑persona, FTE y mix de contratos sugerido.
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

            {/* Tabs */}
            <div className="px-5 pt-4">
              <div className="flex gap-1 flex-wrap">
                {DAY_KEYS.map((k) => {
                  const s = computeStats(days[k].slots);
                  return (
                    <button
                      key={k}
                      onClick={() => setActiveDay(k)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeDay === k
                          ? "bg-slate-900 text-white"
                          : days[k].open && s.personHours > 0
                          ? "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                          : days[k].open
                          ? "bg-white border border-dashed border-slate-200 text-slate-500 hover:border-slate-300"
                          : "bg-white border border-dashed border-slate-200 text-slate-300"
                      }`}
                    >
                      {DAY_LABELS[k]}
                      {days[k].open && s.personHours > 0 && (
                        <span className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${activeDay === k ? "bg-blue-400" : "bg-emerald-400"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor del día activo */}
            <div className="px-5 py-4 space-y-4">

              {/* Toggle abierto/cerrado */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => updateDay(activeDay, { open: !d.open })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${d.open ? "bg-blue-600" : "bg-slate-200"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${d.open ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-slate-700 font-medium">
                  {DAY_LABELS[activeDay]} — {d.open ? "abierto" : "cerrado"}
                </span>
              </label>

              {d.open && (
                <>
                  {/* Grilla de demanda */}
                  <SlotDemandGrid
                    values={d.slots}
                    onChange={(slots) => updateDay(activeDay, { slots })}
                    maxPeople={10}
                    startHour={0}
                  />

                  {/* Colación + traslape */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Colación (min)</label>
                      <input
                        type="number" min={0} max={120} step={5}
                        value={d.breakMinutes}
                        onChange={(e) => updateDay(activeDay, { breakMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Traslape (min)</label>
                      <input
                        type="number" min={0} max={120} step={5}
                        value={d.overlapMinutes}
                        onChange={(e) => updateDay(activeDay, { overlapMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Advertencia brecha colación */}
                  {d.breakMinutes > d.overlapMinutes && (
                    <p className="text-xs text-amber-600">
                      ⚠ Brecha colación: {((d.breakMinutes - d.overlapMinutes) / 60).toFixed(1)}h extra a cubrir
                    </p>
                  )}

                  {/* Copiar a otros días */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 shrink-0">Copiar a:</span>
                    <div className="flex gap-1 flex-wrap">
                      {DAY_KEYS.filter((k) => k !== activeDay).map((k) => (
                        <button
                          key={k}
                          onClick={() => copyDayTo(activeDay, k)}
                          className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                        >
                          {DAY_LABELS[k]}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Resumen semana */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs text-slate-500 shrink-0">Semana:</span>
                {DAY_KEYS.map((k) => {
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
                  return total > 0 ? (
                    <span className="ml-auto text-xs font-semibold mono text-slate-700">{total}h‑p/sem</span>
                  ) : null;
                })()}
              </div>
            </div>
          </section>

          {/* ── PANEL DERECHO: Configuración + Contratos ── */}
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
                    <input
                      type="number" min={20} max={60} step={1}
                      value={fullHours}
                      onChange={(e) => setFullHours(parseInt(e.target.value) || 42)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">Ej: 42 ó 44</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">
                      Factor reemplazo
                      <span className="ml-1 text-slate-400">(vacac. + lic.)</span>
                    </label>
                    <input
                      type="number" min={1} max={1.5} step={0.01}
                      value={replacementFactor}
                      onChange={(e) => setReplacementFactor(parseFloat(e.target.value) || 1.15)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {((replacementFactor - 1) * 100).toFixed(0)}% — retail ~12%, salud ~18%
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-2">Estrategia de mix</label>
                  <div className="flex gap-2">
                    {[
                      { id: "balanced", label: "Balanceado" },
                      { id: "lean", label: "Menos personas" },
                      { id: "stable", label: "Más estable" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStrategy(s.id)}
                        className={`flex-1 text-xs py-2 rounded-lg border transition-all font-medium ${
                          strategy === s.id
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ptWeekdays}
                    onChange={(e) => setPtWeekdays(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm text-slate-700">Permitir PT en días de semana (L–V)</span>
                    <p className="text-xs text-slate-400">Para servicios sin demanda de fin de semana</p>
                  </div>
                </label>
              </div>
            </section>

            {/* Contratos */}
            <section className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-700">Contratos disponibles</h2>
                <p className="text-xs text-slate-400 mt-0.5">El motor arma combinaciones por jornada (6×1 / 5×2 / 4×3 / PT fin de semana)</p>
              </div>
              <div className="px-5 py-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_100px_32px] gap-2 pb-1 border-b border-slate-100">
                    <span className="text-xs text-slate-400">Nombre</span>
                    <span className="text-xs text-slate-400">Horas/sem</span>
                    <span />
                  </div>
                  {contracts.map((c) => (
                    <div key={c.id} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
                      <input
                        value={c.name}
                        onChange={(e) => updateContract(c.id, { name: e.target.value })}
                        placeholder="Ej: Full time"
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number" min={1} max={60}
                        value={c.hoursPerWeek}
                        onChange={(e) => updateContract(c.id, { hoursPerWeek: parseInt(e.target.value) || 0 })}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeContract(c.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addContract}
                  className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                >
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
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Calculando…
              </>
            ) : "Calcular"}
          </button>
          <Link href="/calculadora/guia" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
            Ver guía de uso →
          </Link>
        </div>

        {/* ── Resultado ── */}
        {result && (
          <section className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Resultado</h2>
              <button className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Guardar reporte
              </button>
            </div>

            {result.warnings.length > 0 && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 space-y-1">
                {result.warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">{w}</p>)}
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100">
              {[
                { label: "Horas‑persona / sem", value: result.requiredHours.toFixed(1), sub: "demanda bruta" },
                { label: "Horas a contratar", value: result.requiredHoursAdjusted.toFixed(1), sub: `×${result.replacementFactor} reemplazo`, highlight: true },
                { label: "FTE bruto", value: result.fte.toFixed(2), sub: "sin reemplazo" },
                { label: "FTE a contratar", value: result.fteAdjusted.toFixed(2), sub: "dotación real", highlight: true },
              ].map((k) => (
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
                { label: "Brecha neta", value: result.gapHours.toFixed(1) + "h", warn: result.gapHours > 0 },
              ].map((k) => (
                <div key={k.label} className="bg-white px-5 py-3">
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className={`text-base font-semibold mono mt-0.5 ${k.warn ? "text-amber-600" : "text-slate-700"}`}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Mixes */}
            <div className="px-5 py-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Mix de contratos sugerido</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {result.mixes.map((mix, idx) => (
                  <div key={idx} className={`rounded-xl border p-4 ${idx === 0 ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className={`text-xs font-semibold ${idx === 0 ? "text-blue-700" : "text-slate-500"}`}>
                          {idx === 0 ? "Recomendado" : idx === 1 ? "Alternativa A" : "Alternativa B"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{mix.sundayOk ? "✅ domingo OK" : "⚠️ domingo justo"}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold mono ${idx === 0 ? "text-blue-700" : "text-slate-800"}`}>{mix.headcount}</p>
                        <p className="text-xs text-slate-400">personas</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {mix.items.map((item, j) => (
                        <div key={j} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-blue-500" : "bg-slate-400"}`} />
                            <span className="text-xs text-slate-700 font-medium">{item.contractName}</span>
                            <span className="text-xs text-slate-400 mono">{item.jornadaName}</span>
                          </div>
                          <span className={`text-xs font-bold mono ${idx === 0 ? "text-blue-700" : "text-slate-700"}`}>×{item.count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Total horas</p>
                        <p className="mono font-semibold text-slate-700">{mix.hoursTotal}h</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Holgura</p>
                        <p className={`mono font-semibold ${mix.slackPct > 0.3 ? "text-amber-600" : "text-slate-700"}`}>
                          {mix.slackHours}h ({(mix.slackPct * 100).toFixed(0)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-slate-100 py-6 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} dotaciones.cl</span>
          <div className="flex gap-4">
            <Link href="/blog" className="hover:text-slate-600 transition-colors">Blog</Link>
            <Link href="/contacto" className="hover:text-slate-600 transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
