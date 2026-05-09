"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { calculate, type CalcInput, type CalcResult, type Mix, type DayKey } from "@/lib/engine";
import { SlotDemandGrid, computeStats } from "@/components/SlotDemandGrid";

// ─── Constantes laborales Chile ───────────────────────────────────────────────

// Ley N°21.751 — vigente desde el 1 de enero de 2026
const MIN_WAGE_40H    = 539000;   // CLP bruto/mes
const EMPLOYER_RATE   = 0.0482;   // SIS 1.49% + Mutual ~0.93% + Seg.Cesantía emp. 2.40%
const WEEKS_PER_MONTH = 52 / 12;  // 4.333

// ─── Tipos ───────────────────────────────────────────────────────────────────

type DayConfig = {
  open: boolean;
  slots: number[];
  breakMinutes: number;
  overlapMinutes: number;
};

type PatternKey = "5x2_rot" | "5x2_lv" | "6x1" | "4x3" | "3days" | "weekend" | "5pt";

const PATTERN_INFO: Record<PatternKey, { label: string; short: string; daysPerCycle: number }> = {
  "5x2_rot": { label: "5×2 — rot. (cualquier día)", short: "5×2 rot", daysPerCycle: 5 },
  "5x2_lv":  { label: "5×2 — L a V (fijo)",        short: "5×2 L-V", daysPerCycle: 5 },
  "6x1":     { label: "6×1 — rotativo",             short: "6×1",     daysPerCycle: 6 },
  "4x3":     { label: "4×3 — rotativo",             short: "4×3",     daysPerCycle: 4 },
  "3days":   { label: "3 días / semana",             short: "3días",   daysPerCycle: 3 },
  "weekend": { label: "Fin de semana (S+D)",         short: "S+D",     daysPerCycle: 2 },
  "5pt":     { label: "5 días parciales",            short: "5días",   daysPerCycle: 5 },
};

// Mapeo de patrones UI → IDs de jornada del engine
const PATTERN_TO_JORNADA: Record<PatternKey, string> = {
  "5x2_rot": "J_5X2",
  "5x2_lv":  "J_5X2_LV",
  "6x1":     "J_6X1",
  "4x3":     "J_4X3",
  "weekend": "J_PT_WEEKEND",
  "5pt":     "J_PT_WEEKDAY",
  "3days":   "J_PT_WEEKDAY",
};

function availablePatterns(hoursPerWeek: number): PatternKey[] {
  if (hoursPerWeek >= 35) return ["5x2_rot", "5x2_lv", "6x1", "4x3"];
  if (hoursPerWeek >= 25) return ["5x2_rot", "5x2_lv", "6x1", "4x3", "3days"];
  return ["5x2_rot", "5x2_lv", "4x3", "3days", "weekend", "5pt"];
}

function defaultPatterns(hoursPerWeek: number): PatternKey[] {
  if (hoursPerWeek >= 35) return ["5x2_rot"];
  if (hoursPerWeek >= 25) return ["5x2_rot"];
  return ["weekend"];
}

type Contract = {
  id: string;
  name: string;
  hoursPerWeek: number;
  patterns: PatternKey[];
  monthlyGross?: number;
};

// ─── Helpers de costo ────────────────────────────────────────────────────────

const minWageForHours = (h: number) => Math.round(MIN_WAGE_40H * (h / 40));

const costoEmpresaHora = (monthlyGross: number, h: number) =>
  (monthlyGross * (1 + EMPLOYER_RATE)) / (h * WEEKS_PER_MONTH);

// ─── Selección de 3 opciones distintas ───────────────────────────────────────

type ThreeOptions = {
  cheapest:  Mix | null;
  optimal:   Mix | null;
  flexible:  Mix | null;
  // Budget analysis
  minMonthly:          number | null; // costo mensual mínimo posible
  budgetSurplus:       number | null; // positivo = sobra, negativo = falta
  withinBudgetCount:   number;        // cuántos mixes válidos caben en presupuesto
};

function selectOptions(
  mixes: Mix[],
  hasCosts: boolean,
  flexTolerance: number,
  targetBudgetMonthly: number | undefined, // CLP/mes objetivo
): ThreeOptions {
  const valid = mixes.filter(m => m.coverageOk && m.sundayOk);
  const pool  = valid.length > 0 ? valid
    : mixes.filter(m => m.coverageOk).length > 0 ? mixes.filter(m => m.coverageOk)
    : mixes;

  const empty: ThreeOptions = { cheapest: null, optimal: null, flexible: null,
    minMonthly: null, budgetSurplus: null, withinBudgetCount: 0 };
  if (!pool.length) return empty;

  // Ordenar por costo (o horas si sin costos)
  const sorted = hasCosts
    ? [...pool].filter(m => m.weeklyCost != null).sort((a, b) => (a.weeklyCost ?? 0) - (b.weeklyCost ?? 0))
    : [...pool].sort((a, b) => a.hoursTotal - b.hoursTotal);
  if (!sorted.length) return empty;

  // Mínimo posible
  const globalCheapest   = sorted[0];
  const minWeekly        = hasCosts ? (globalCheapest.weeklyCost ?? null) : null;
  const minMonthly       = minWeekly != null ? Math.round(minWeekly * WEEKS_PER_MONTH) : null;

  // ── Pool filtrado por presupuesto ──────────────────────────────────────
  const maxWeekly = targetBudgetMonthly && hasCosts
    ? (targetBudgetMonthly / WEEKS_PER_MONTH) * (1 + flexTolerance / 100)
    : null;

  const budgetPool = maxWeekly
    ? pool.filter(m => (m.weeklyCost ?? Infinity) <= maxWeekly)
    : pool;

  const budgetSurplus = (targetBudgetMonthly != null && minMonthly != null)
    ? targetBudgetMonthly - minMonthly
    : null;

  // Si hay presupuesto y NINGÚN mix cabe → devolver solo la mínima como referencia
  if (maxWeekly !== null && budgetPool.length === 0) {
    return { cheapest: globalCheapest, optimal: null, flexible: null,
      minMonthly, budgetSurplus, withinBudgetCount: 0 };
  }

  const workPool = budgetPool.length > 0 ? budgetPool : pool;

  // 1. Más económica: la más barata dentro del presupuesto (o global si sin presupuesto)
  const cheapest = hasCosts
    ? [...workPool].sort((a, b) => (a.weeklyCost ?? 0) - (b.weeklyCost ?? 0))[0]
    : [...workPool].sort((a, b) => a.hoursTotal - b.hoursTotal)[0];

  // 2. Equilibrada: menor holgura + mejor cobertura, diferente a cheapest
  const pool2   = workPool.filter(m => m.id !== cheapest.id);
  const optBase = pool2.length > 0 ? pool2 : workPool;
  const optimal = optBase.find(m => m.isOptimal)
    ?? [...optBase].sort((a, b) => (a.slackPct * 2 - a.ptShare * 0.5) - (b.slackPct * 2 - b.ptShare * 0.5))[0]
    ?? cheapest;

  // 3. Más flexible: mayor ptShare dentro del presupuesto + tolerancia extra
  const usedIds  = new Set([cheapest.id, optimal.id]);
  const pool3    = workPool.filter(m => !usedIds.has(m.id));
  const flexible = pool3.length > 0
    ? [...pool3].sort((a, b) => b.ptShare - a.ptShare)[0]
    : [...workPool].sort((a, b) => b.ptShare - a.ptShare)[0];

  return {
    cheapest, optimal, flexible,
    minMonthly,
    budgetSurplus,
    withinBudgetCount: budgetPool.length,
  };
}

// ─── Tarjeta de recomendación ─────────────────────────────────────────────────

const clpFmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

function RecommendationCard({ mix, label, icon, accent, hasCosts, cheapestMonthly, targetBudget }: {
  mix: Mix; label: string; icon: string; accent: boolean;
  hasCosts: boolean; cheapestMonthly: number | null; targetBudget?: number;
}) {
  const flex        = Math.round(mix.ptShare * 70 + Math.min(mix.headcount / 20, 1) * 30);
  const monthlyCost = (hasCosts && mix.weeklyCost != null)
    ? Math.round(mix.weeklyCost * WEEKS_PER_MONTH) : null;

  // Delta vs presupuesto objetivo (si se declaró)
  const vsTarget    = (monthlyCost != null && targetBudget != null && targetBudget > 0)
    ? monthlyCost - targetBudget : null;
  // Delta vs mínimo (si no hay presupuesto objetivo)
  const vsMin       = (monthlyCost != null && cheapestMonthly != null && cheapestMonthly > 0
    && targetBudget == null)
    ? monthlyCost - cheapestMonthly : null;
  const vsMinPct    = vsMin != null && cheapestMonthly! > 0
    ? vsMin / cheapestMonthly! * 100 : null;

  return (
    <div className={`rounded-xl border flex flex-col overflow-hidden ${accent ? "border-blue-300 shadow-sm shadow-blue-100" : "border-slate-200"}`}>
      <div className={`px-4 py-3 flex items-center justify-between ${accent ? "bg-blue-600" : "bg-slate-800"}`}>
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <span className={`text-[10px] ${mix.sundayOk ? "text-white/60" : "text-amber-300"}`}>
          {mix.sundayOk ? "✓ domingo OK" : "⚠ domingo ajustado"}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4 bg-white flex-1">
        <div className="flex items-end justify-between">
          <div>
            <p className={`text-4xl font-bold mono ${accent ? "text-blue-700" : "text-slate-900"}`}>
              {mix.headcount}
            </p>
            <p className="text-xs text-slate-400">personas</p>
          </div>
          <div className="text-right">
            {monthlyCost != null ? (
              <>
                <p className="text-lg font-bold mono text-slate-800">{clpFmt(monthlyCost)}</p>
                <p className="text-[10px] text-slate-400">costo empresa / mes *</p>
                {/* vs presupuesto objetivo */}
                {vsTarget != null && (
                  <p className={`text-[11px] font-semibold ${vsTarget > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {vsTarget > 0 ? "+" : ""}{clpFmt(vsTarget)} vs tu presupuesto
                  </p>
                )}
                {/* vs mínimo (cuando no hay presupuesto objetivo) */}
                {vsMin != null && vsMin !== 0 && vsMinPct != null && (
                  <p className={`text-[11px] font-semibold ${vsMin > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {vsMin > 0 ? "+" : ""}{clpFmt(vsMin)}/mes ({vsMinPct > 0 ? "+" : ""}{vsMinPct.toFixed(1)}%)
                  </p>
                )}
                {vsMin === 0 && targetBudget == null && (
                  <p className="text-[11px] text-emerald-600 font-semibold">= mínimo posible</p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-bold mono text-slate-800">{mix.hoursTotal}h</p>
                <p className="text-[10px] text-slate-400">horas contratadas / sem</p>
              </>
            )}
          </div>
        </div>

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
                <div className={`h-full rounded-full ${flex >= 60 ? "bg-emerald-500" : flex >= 35 ? "bg-blue-500" : "bg-slate-400"}`}
                  style={{ width: `${flex}%` }} />
              </div>
              <span className={`font-semibold mono text-[11px] ${flex >= 60 ? "text-emerald-600" : flex >= 35 ? "text-blue-600" : "text-slate-500"}`}>{flex}</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">% Part-time</p>
            <p className="mono font-semibold text-slate-700">{Math.round(mix.ptShare * 100)}%</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Total horas / sem</p>
            <p className="mono font-semibold text-slate-700">{mix.hoursTotal}h</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de contrato ─────────────────────────────────────────────────────────

function ContractRow({ contract, showGross, useMinWage, onUpdate, onRemove }: {
  contract: Contract; showGross: boolean; useMinWage: boolean;
  onUpdate: (patch: Partial<Contract>) => void; onRemove: () => void;
}) {
  const patterns = availablePatterns(contract.hoursPerWeek);

  const togglePattern = (p: PatternKey) => {
    const next = contract.patterns.includes(p)
      ? contract.patterns.filter(x => x !== p)
      : [...contract.patterns, p];
    if (next.length > 0) onUpdate({ patterns: next });
  };

  return (
    <div className="border border-slate-100 rounded-lg p-3 space-y-2.5 bg-slate-50/50">
      {/* Nombre + horas + eliminar */}
      <div className="flex items-center gap-2">
        <input type="text" value={contract.name}
          onChange={e => onUpdate({ name: e.target.value })}
          placeholder="Ej: Full time"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex items-center gap-1">
          <input type="number" min={1} max={60} value={contract.hoursPerWeek}
            onChange={e => {
              const h = parseInt(e.target.value) || 0;
              onUpdate({ hoursPerWeek: h, patterns: defaultPatterns(h) });
            }}
            className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-sm mono text-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-xs text-slate-400">h/sem</span>
        </div>
        <button onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Patrones como pills-checkbox */}
      <div>
        <p className="text-[11px] text-slate-400 mb-1.5">Patrones de turno habilitados</p>
        <div className="flex flex-wrap gap-1.5">
          {patterns.map(p => {
            const active = contract.patterns.includes(p);
            const isLV   = p === "5x2_lv";
            return (
              <div key={p} className="relative group">
                <button onClick={() => togglePattern(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                    active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}>
                  {PATTERN_INFO[p].label}
                </button>
                {isLV && (
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10 w-52 bg-slate-800 text-white text-[10px] rounded-lg px-2.5 py-2 leading-relaxed shadow-lg">
                    No cubre sábado ni domingo. Solo usar si el negocio cierra fines de semana.
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {contract.patterns.length > 1 && (
          <p className="text-[10px] text-blue-600 mt-1">
            {contract.patterns.length} patrones habilitados → el engine explorará combinaciones entre ellos
          </p>
        )}
      </div>

      {/* Sueldo bruto */}
      {showGross && (
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Sueldo bruto mensual (CLP)</label>
          {useMinWage ? (
            <p className="text-sm mono font-medium text-slate-600">
              ${minWageForHours(contract.hoursPerWeek).toLocaleString("es-CL")}
              <span className="text-[11px] text-slate-400 font-normal ml-2">(proporcional al mínimo)</span>
            </p>
          ) : (
            <input type="number" min={0} step={10000} value={contract.monthlyGross ?? ""}
              onChange={e => onUpdate({ monthlyGross: parseFloat(e.target.value) || undefined })}
              placeholder={`Ej: ${minWageForHours(contract.hoursPerWeek).toLocaleString("es-CL")}`}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Gate de email ─────────────────────────────────────────────────────────────

function EmailGate({ onSubmit }: { onSubmit: (email: string, nombre: string, empresa: string) => void }) {
  const [email, setEmail]     = useState("");
  const [nombre, setNombre]   = useState("");
  const [empresa, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, empresa, source: "calculadora_gate" }),
      });
    } catch (_) {}
    onSubmit(email, nombre, empresa);
    setLoading(false);
  };

  return (
    <div className="mt-6 border border-blue-200 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-white">
      <div className="px-6 py-5 border-b border-blue-100">
        <p className="text-sm font-semibold text-slate-800">Tu dotación está lista</p>
        <p className="text-xs text-slate-500 mt-1">
          Ingresa tu email para ver las 3 recomendaciones con presupuesto y flexibilidad. También te las enviamos.
        </p>
      </div>
      <div className="px-6 py-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Empresa</label>
            <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
              placeholder="Tu empresa"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Email <span className="text-blue-500">*</span></label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@empresa.cl" onKeyDown={e => e.key === "Enter" && submit()}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={submit} disabled={!email || loading}
          className="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Cargando…</>
            : "Ver mis recomendaciones →"}
        </button>
        <p className="text-[11px] text-slate-400 text-center">Sin spam. Solo tus resultados.</p>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<DayKey, string> = {
  mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom",
};

function makeDefaultDay(open: boolean): DayConfig {
  return { open, slots: Array(48).fill(0), breakMinutes: 30, overlapMinutes: 30 };
}

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
  const [flexTolerance,     setFlexTolerance]     = useState(3);

  const [contracts, setContracts] = useState<Contract[]>([
    { id: "1", name: "40h", hoursPerWeek: 40, patterns: ["5x2_rot"] },
    { id: "2", name: "30h", hoursPerWeek: 30, patterns: ["5x2_rot"] },
    { id: "3", name: "20h", hoursPerWeek: 20, patterns: ["weekend"] },
  ]);

  const [showGross,  setShowGross]  = useState(false);
  const [useMinWage, setUseMinWage] = useState(false);
  const [targetBudget, setTargetBudget] = useState<number | undefined>(undefined);
  const [result,     setResult]     = useState<CalcResult | null>(null);
  const [optimizedMix, setOptimizedMix] = useState<Mix | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [emailPassed, setEmailPassed] = useState(false);
  const [userEmail,   setUserEmail]   = useState("");

  const updateDay = useCallback((key: DayKey, patch: Partial<DayConfig>) =>
    setDays(prev => ({ ...prev, [key]: { ...prev[key], ...patch } })), []);

  const copyDayTo = (from: DayKey, to: DayKey) =>
    setDays(prev => ({ ...prev, [to]: { ...prev[from] } }));

  const addContract = () => setContracts(prev => [...prev,
    { id: Date.now().toString(), name: "", hoursPerWeek: 30, patterns: ["5x2_rot"] }]);

  const updateContract = (id: string, patch: Partial<Contract>) =>
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const removeContract = (id: string) =>
    setContracts(prev => prev.filter(c => c.id !== id));

  const handleCalculate = () => {
    setLoading(true);
    setEmailPassed(false);
    setResult(null);
    setOptimizedMix(null);
    setTimeout(() => {
      const hasGross = showGross && (useMinWage || contracts.some(c => c.monthlyGross != null));

      const baseContracts = contracts
        .filter(c => c.hoursPerWeek > 0 && c.name && c.patterns.length > 0)
        .map(c => {
          const gross  = useMinWage ? minWageForHours(c.hoursPerWeek) : c.monthlyGross;
          const costPH = (hasGross && gross && gross > 0)
            ? costoEmpresaHora(gross, c.hoursPerWeek) : undefined;
          const allowedJornadaIds = c.patterns
            .map(p => PATTERN_TO_JORNADA[p])
            .filter((v, i, a) => v && a.indexOf(v) === i);
          return {
            name: c.name, hoursPerWeek: c.hoursPerWeek, costPerHour: costPH,
            allowedJornadaIds: allowedJornadaIds.length > 0 ? allowedJornadaIds : undefined,
          };
        });

      const dayInput = Object.fromEntries(DAY_KEYS.map(k => {
        const d = days[k];
        const { peak, hoursOpen } = computeStats(d.slots);
        return [k, { open: d.open, hoursOpen: hoursOpen > 0 ? hoursOpen : 0,
          requiredPeople: peak, shiftsPerDay: 1,
          overlapMinutes: d.overlapMinutes, breakMinutes: d.breakMinutes }];
      })) as CalcInput["days"];

      const input: CalcInput = {
        fullHoursPerWeek: fullHours, replacementFactor,
        ptWeekdaysAllowed: ptWeekdays, contracts: baseContracts, days: dayInput,
      };

      try {
        const mainResult = calculate(input);
        setResult(mainResult);

        // Cálculo optimizado: mismos contratos, sin restricción de patrón
        // Busca la opción más barata posible con total libertad de jornadas
        const freeContracts = baseContracts.map(c => ({ ...c, allowedJornadaIds: undefined }));
        const optResult = calculate({ ...input, contracts: freeContracts, ptWeekdaysAllowed: true });
        const validOpt  = optResult.mixes.filter(m => m.coverageOk && m.sundayOk);
        const bestOpt   = validOpt.length > 0
          ? (optResult.hasCosts
              ? [...validOpt].sort((a, b) => (a.weeklyCost ?? 0) - (b.weeklyCost ?? 0))[0]
              : [...validOpt].sort((a, b) => a.hoursTotal - b.hoursTotal)[0])
          : null;

        // Propuesta optimizada: siempre mostrar (es el valor diferencial)
        setOptimizedMix(bestOpt ?? null);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 50);
  };

  const handleEmailSubmit = async (email: string, nombre: string, empresa: string) => {
    setUserEmail(email);
    setEmailPassed(true);
    if (!result) return;
    const opts = selectOptions(result.mixes, result.hasCosts, flexTolerance, targetBudget);
    const mixesArray = [opts.cheapest, opts.optimal, opts.flexible, optimizedMix]
      .filter(Boolean)
      .filter((m, i, arr) => arr.findIndex(x => x?.id === m?.id) === i);
    try {
      await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, email, empresa,
          source:      "calculadora-retail",
          calculadora: "Retail",
          sector:      "Retail / Servicios",
          hasCosts:    result.hasCosts,
          mixes:       mixesArray,
          resultados: {
            requiredHours:         result.requiredHours,
            requiredHoursAdjusted: result.requiredHoursAdjusted,
            fte:                   result.fte,
            fteAdjusted:           result.fteAdjusted,
            replacementFactor:     result.replacementFactor,
            totalMixes:            result.totalMixes,
            recomendaciones:       opts,
            propuestaOptimizada:   optimizedMix ?? null,
          },
        }),
      });
    } catch (_) {}
  };

  const d = days[activeDay];
  const threeOptions = result && emailPassed
    ? selectOptions(result.mixes, result.hasCosts, flexTolerance, targetBudget) : null;
  const cheapestMonthly = threeOptions?.minMonthly ?? null;

  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'DM Mono', monospace; }
      `}</style>

      <SiteNav />

      <div className="border-b border-[#52B788]/20 bg-[#D8F3DC]">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <p className="text-xs text-[#1B4332]"><span className="font-semibold">Nuevo:</span> Calculadora SAN Hospitalaria — normativa MINSAL</p>
          <Link href="/san" className="text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 transition-colors">
            Ir a SAN <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Calculadora de dotación por tramos</h1>
          <p className="text-sm text-slate-500">
            Define la demanda por tramos de 30 min, los contratos y sus patrones de turno.
            Obtendrás 3 recomendaciones con presupuesto real costo empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* PANEL IZQUIERDO: Demanda */}
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
                        : days[k].open && s.personHours > 0 ? "bg-white border border-slate-200 text-slate-700"
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
                <span className="text-sm text-slate-700 font-medium">{DAY_LABELS[activeDay]} — {d.open ? "abierto" : "cerrado"}</span>
              </label>

              {d.open && (
                <>
                  <SlotDemandGrid values={d.slots} onChange={slots => updateDay(activeDay, { slots })} maxPeople={10} startHour={0} />
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Colación (min)</label>
                      <input type="number" min={0} max={120} step={5} value={d.breakMinutes}
                        onChange={e => updateDay(activeDay, { breakMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Traslape (min)</label>
                      <input type="number" min={0} max={120} step={5} value={d.overlapMinutes}
                        onChange={e => updateDay(activeDay, { overlapMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  {d.breakMinutes > d.overlapMinutes && (
                    <p className="text-xs text-amber-600">⚠ Brecha colación: {((d.breakMinutes - d.overlapMinutes) / 60).toFixed(1)}h extra a cubrir</p>
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
                  return days[k].open && s.personHours > 0
                    ? <span key={k} className="text-xs mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">{DAY_LABELS[k]} <span className="font-semibold">{s.personHours}h‑p</span></span>
                    : <span key={k} className="text-xs text-slate-300">{DAY_LABELS[k]}</span>;
                })}
                {(() => {
                  const t = DAY_KEYS.reduce((s, k) => s + computeStats(days[k].slots).personHours, 0);
                  return t > 0 ? <span className="ml-auto text-xs font-semibold mono text-slate-700">{t}h‑p/sem</span> : null;
                })()}
              </div>
            </div>
          </section>

          {/* PANEL DERECHO */}
          <div className="space-y-6">

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
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-slate-400 mt-1">Ley 40h vigente</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Factor reemplazo</label>
                    <input type="number" min={1} max={1.5} step={0.01} value={replacementFactor}
                      onChange={e => setReplacementFactor(parseFloat(e.target.value) || 1.15)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-slate-400 mt-1">{((replacementFactor - 1) * 100).toFixed(0)}% — retail ~12%</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-500">Tolerancia presupuestaria para opción flexible</label>
                    <span className="text-xs font-semibold mono text-blue-600">+{flexTolerance}%</span>
                  </div>
                  <input type="range" min={0} max={15} step={1} value={flexTolerance}
                    onChange={e => setFlexTolerance(parseInt(e.target.value))} className="w-full accent-blue-600" />
                  <p className="text-[11px] text-slate-400 mt-1">Cuánto más puede costar el mix más flexible vs el más económico</p>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={ptWeekdays} onChange={e => setPtWeekdays(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                  <div>
                    <span className="text-sm text-slate-700">Permitir PT en días de semana (L–V)</span>
                    <p className="text-xs text-slate-400">Para servicios sin demanda de fin de semana</p>
                  </div>
                </label>

                {/* Presupuesto objetivo */}
                {showGross && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-700">
                        Presupuesto objetivo mensual
                        <span className="text-slate-400 font-normal ml-1">(opcional)</span>
                      </label>
                      {targetBudget != null && (
                        <button onClick={() => setTargetBudget(undefined)}
                          className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">
                          Quitar
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">$</span>
                      <input type="number" min={0} step={100000}
                        value={targetBudget ?? ""}
                        onChange={e => setTargetBudget(parseFloat(e.target.value) || undefined)}
                        placeholder="Ej: 6.000.000"
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="text-xs text-slate-400 shrink-0">CLP/mes</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      El engine buscará mixes que cumplan la demanda dentro de este presupuesto ± tolerancia.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Contratos */}
            <section className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700">Contratos disponibles</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Jornadas, patrones de turno y sueldos</p>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showGross} onChange={e => setShowGross(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600" />
                    <span className="text-xs text-slate-500">Agregar sueldos</span>
                  </label>
                </div>
                {showGross && (
                  <div className="mt-3 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={useMinWage} onChange={e => setUseMinWage(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-slate-700">Usar sueldo mínimo como referencia</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          40h → ${MIN_WAGE_40H.toLocaleString("es-CL")}/mes. Las demás jornadas se calculan proporcionalmente.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
              <div className="px-5 py-4 space-y-3">
                {contracts.map(c => (
                  <ContractRow key={c.id} contract={c} showGross={showGross} useMinWage={useMinWage}
                    onUpdate={patch => updateContract(c.id, patch)} onRemove={() => removeContract(c.id)} />
                ))}
                <button onClick={addContract}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar contrato
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Calcular */}
        <div className="flex items-center gap-4 py-2">
          <button onClick={handleCalculate} disabled={loading}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading
              ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Calculando…</>
              : "Calcular dotación"}
          </button>
          <Link href="/calculadora/guia" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">Ver guía →</Link>
        </div>

        {result && !emailPassed && <EmailGate onSubmit={handleEmailSubmit} />}

        {result && emailPassed && threeOptions && (
          <section className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Tus 3 recomendaciones</h2>
              <span className="text-xs text-slate-400">Enviadas a {userEmail}</span>
            </div>

            {result.warnings.length > 0 && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 space-y-1">
                {result.warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">{w}</p>)}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100">
              {[
                { label: "Horas‑persona / sem", value: result.requiredHours.toFixed(1),         sub: "demanda bruta" },
                { label: "Horas a contratar",   value: result.requiredHoursAdjusted.toFixed(1), sub: `×${result.replacementFactor} reemplazo`, hl: true },
                { label: "FTE bruto",           value: result.fte.toFixed(2),                   sub: "sin reemplazo" },
                { label: "FTE a contratar",     value: result.fteAdjusted.toFixed(2),           sub: "dotación real", hl: true },
              ].map(k => (
                <div key={k.label} className={`px-5 py-4 ${k.hl ? "bg-blue-50" : "bg-white"}`}>
                  <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold mono ${k.hl ? "text-blue-700" : "text-slate-900"}`}>{k.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            <div className="px-5 py-5">
              {threeOptions.cheapest || threeOptions.optimal || threeOptions.flexible ? (
                <>
                  {/* Banner de estado presupuestario */}
                  {result.hasCosts && targetBudget != null && threeOptions.minMonthly != null && (
                    <div className={`mb-4 rounded-xl px-4 py-3 flex items-start gap-3 ${
                      threeOptions.budgetSurplus != null && threeOptions.budgetSurplus >= 0
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-red-50 border border-red-200"
                    }`}>
                      <span className="text-lg flex-shrink-0">
                        {threeOptions.budgetSurplus != null && threeOptions.budgetSurplus >= 0 ? "✅" : "❌"}
                      </span>
                      <div>
                        {threeOptions.budgetSurplus != null && threeOptions.budgetSurplus >= 0 ? (
                          <>
                            <p className="text-sm font-semibold text-emerald-800">
                              Tu presupuesto de {clpFmt(targetBudget)}/mes es suficiente
                            </p>
                            <p className="text-xs text-emerald-700 mt-0.5">
                              Hay {threeOptions.withinBudgetCount} mix{threeOptions.withinBudgetCount !== 1 ? "es" : ""} válidos dentro del presupuesto.
                              El mínimo posible es {clpFmt(threeOptions.minMonthly)}/mes —
                              te sobran {clpFmt(threeOptions.budgetSurplus)}.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-red-800">
                              Tu presupuesto de {clpFmt(targetBudget)}/mes no alcanza
                            </p>
                            <p className="text-xs text-red-700 mt-0.5">
                              La dotación mínima para cubrir esta demanda requiere {clpFmt(threeOptions.minMonthly)}/mes.
                              Te faltan {clpFmt(Math.abs(threeOptions.budgetSurplus ?? 0))}.
                              Abajo ves la opción más barata posible como referencia.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={`grid gap-4 ${optimizedMix ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}>
                    {threeOptions.cheapest && (
                      <RecommendationCard mix={threeOptions.cheapest}
                        label={targetBudget != null ? "Mínimo posible" : "Más económica"}
                        icon="💰" accent={false}
                        hasCosts={result.hasCosts} cheapestMonthly={cheapestMonthly}
                        targetBudget={targetBudget} />
                    )}
                    {threeOptions.optimal && (
                      <RecommendationCard mix={threeOptions.optimal}
                        label={targetBudget != null ? "Mejor dentro del presupuesto" : "Equilibrada"}
                        icon="⚖️" accent={true}
                        hasCosts={result.hasCosts} cheapestMonthly={cheapestMonthly}
                        targetBudget={targetBudget} />
                    )}
                    {threeOptions.flexible && (
                      <RecommendationCard mix={threeOptions.flexible}
                        label={targetBudget != null ? "Más flexible dentro del presupuesto" : "Más flexible"}
                        icon="🔄" accent={false}
                        hasCosts={result.hasCosts} cheapestMonthly={cheapestMonthly}
                        targetBudget={targetBudget} />
                    )}
                    {optimizedMix && (
                      <div className="rounded-xl border-2 border-emerald-400 flex flex-col overflow-hidden shadow-sm shadow-emerald-100">
                        <div className="px-4 py-3 flex items-center justify-between bg-emerald-600">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🎯</span>
                            <span className="text-sm font-semibold text-white">Propuesta optimizada</span>
                          </div>
                          <span className="text-[10px] text-white/70">sin restricciones</span>
                        </div>
                        <div className="p-3 bg-emerald-50 border-b border-emerald-100">
                          <p className="text-[11px] text-emerald-700 leading-relaxed">
                            El engine exploró todas las jornadas disponibles sin las restricciones que seleccionaste.
                            Podría requerir ajustes operativos.
                          </p>
                        </div>
                        <RecommendationCard mix={optimizedMix} label="" icon=""
                          accent={false} hasCosts={result.hasCosts} cheapestMonthly={cheapestMonthly}
                          targetBudget={targetBudget} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">No se encontraron mixes válidos. Revisa los patrones y la demanda configurada.</p>
              )}

              {result.hasCosts && (
                <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
                  * Costo empresa aproximado: sueldo bruto + SIS 1.49% + mutual promedio 0.93% + seguro de cesantía empleador 2.40%.
                  No incluye gratificaciones legales, bonos, colación ni beneficios adicionales.
                  Sueldo mínimo de referencia: ${MIN_WAGE_40H.toLocaleString("es-CL")}/mes para 40h (vigente desde enero 2026).
                </p>
              )}

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">¿Quieres el calendario de turnos del mes?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Generamos 4 semanas de turnos para cada opción. Descarga en Excel, listo para operar.</p>
                </div>
                <button disabled className="shrink-0 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-40 cursor-not-allowed">
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