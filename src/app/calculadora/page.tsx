"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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

// ─── Selección de 4 mixes destacados ─────────────────────────────────────────

function selectFeatured(mixes: Mix[], hasCosts: boolean) {
  const ok  = mixes.filter(m => m.sundayOk && m.coverageOk);
  const all = ok.length > 0 ? ok : mixes.filter(m => m.coverageOk).length > 0 ? mixes.filter(m => m.coverageOk) : mixes;

  const optimal  = all.find(m => m.isOptimal) ?? all[0] ?? null;
  const cheapest = hasCosts
    ? (all.find(m => m.isCheapest) ?? [...all].filter(m => m.weeklyCost != null).sort((a, b) => (a.weeklyCost ?? 0) - (b.weeklyCost ?? 0))[0] ?? null)
    : null;
  const leanest  = [...all].sort((a, b) => a.slackPct - b.slackPct)[0] ?? null;
  const mostFull = [...all].sort((a, b) => a.ptShare - b.ptShare)[0] ?? null;

  return { optimal, cheapest, leanest, mostFull };
}

// ─── Tarjeta de mix ───────────────────────────────────────────────────────────

function MixCard({ mix, label, accent, hasCosts }: {
  mix: Mix; label: string; accent: boolean; hasCosts: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${accent ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold ${accent ? "text-blue-700" : "text-slate-500"}`}>{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{mix.sundayOk ? "✅ domingo cubierto" : "⚠️ domingo ajustado"}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold mono ${accent ? "text-blue-700" : "text-slate-800"}`}>{mix.headcount}</p>
          <p className="text-xs text-slate-400">personas</p>
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

      <div className={`pt-3 border-t ${accent ? "border-blue-100" : "border-slate-100"} grid grid-cols-2 gap-2 text-xs`}>
        <div>
          <p className="text-slate-400">Total horas</p>
          <p className="mono font-semibold text-slate-700">{mix.hoursTotal}h</p>
        </div>
        <div>
          <p className="text-slate-400">Holgura</p>
          <p className={`mono font-semibold ${mix.slackPct > 0.25 ? "text-amber-600" : "text-slate-700"}`}>
            {mix.slackHours}h ({Math.round(mix.slackPct * 100)}%)
          </p>
        </div>
        {hasCosts && mix.weeklyCost != null && (
          <>
            <div>
              <p className="text-slate-400">Costo/sem</p>
              <p className="mono font-semibold text-slate-700">${mix.weeklyCost.toLocaleString("es-CL")}</p>
            </div>
            <div>
              <p className="text-slate-400">% PT</p>
              <p className="mono font-semibold text-slate-700">{Math.round(mix.ptShare * 100)}%</p>
            </div>
          </>
        )}
        {!hasCosts && (
          <div>
            <p className="text-slate-400">% PT</p>
            <p className="mono font-semibold text-slate-700">{Math.round(mix.ptShare * 100)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tabla completa ───────────────────────────────────────────────────────────

type SortKey = "headcount" | "slackPct" | "weeklyCost" | "ptShare";

function MixTable({ mixes, hasCosts }: { mixes: Mix[]; hasCosts: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>("headcount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...mixes].sort((a, b) => {
    const av = (a[sortKey] ?? Infinity) as number;
    const bv = (b[sortKey] ?? Infinity) as number;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <button onClick={() => toggleSort(col)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors ${active ? "text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>
        {label}
        <span className="mono">{active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left"><SortBtn col="headcount" label="Personas" /></th>
            <th className="px-4 py-3 text-left text-slate-500 font-medium">Composición</th>
            <th className="px-4 py-3 text-left text-slate-500 font-medium">Domingo</th>
            <th className="px-4 py-3 text-left"><SortBtn col="slackPct" label="Holgura" /></th>
            <th className="px-4 py-3 text-left"><SortBtn col="ptShare" label="% PT" /></th>
            {hasCosts && <th className="px-4 py-3 text-left"><SortBtn col="weeklyCost" label="Costo/sem" /></th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((mix, i) => (
            <tr key={mix.id}
              className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                mix.isOptimal ? "bg-blue-50/60" : i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
              }`}>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold mono text-slate-800">{mix.headcount}</span>
                  {mix.isOptimal && <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">óptimo</span>}
                  {mix.isCheapest && <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">más barato</span>}
                </div>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {mix.items.map((it, j) => (
                    <span key={j} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      <span className="font-semibold mono">×{it.count}</span>
                      <span>{it.contractName}</span>
                      <span className="text-slate-400">{it.jornadaName}</span>
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2.5">
                {mix.sundayOk
                  ? <span className="text-emerald-600 font-medium">✓ OK</span>
                  : <span className="text-amber-600 font-medium">⚠ Ajustado</span>}
              </td>
              <td className="px-4 py-2.5">
                <span className={`mono font-medium ${mix.slackPct > 0.25 ? "text-amber-600" : "text-slate-700"}`}>
                  {mix.slackHours}h ({Math.round(mix.slackPct * 100)}%)
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className="mono text-slate-700">{Math.round(mix.ptShare * 100)}%</span>
              </td>
              {hasCosts && (
                <td className="px-4 py-2.5">
                  <span className="mono text-slate-700">
                    {mix.weeklyCost != null ? `$${mix.weeklyCost.toLocaleString("es-CL")}` : "—"}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
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

  const [fullHours, setFullHours] = useState(42);
  const [replacementFactor, setReplacementFactor] = useState(1.15);
  const [ptWeekdays, setPtWeekdays] = useState(false);

  const [contracts, setContracts] = useState<Contract[]>([
    { id: "1", name: "44h", hoursPerWeek: 44 },
    { id: "2", name: "42h", hoursPerWeek: 42 },
    { id: "3", name: "40h", hoursPerWeek: 40 },
    { id: "4", name: "30h", hoursPerWeek: 30 },
    { id: "5", name: "20h", hoursPerWeek: 20 },
  ]);
  const [showCosts, setShowCosts] = useState(false);

  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAllMixes, setShowAllMixes] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Estados IA
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadNombre, setLeadNombre] = useState("");
  const [leadEmpresa, setLeadEmpresa] = useState("");
  const [leadEnviado, setLeadEnviado] = useState(false);
  const [analisisIA, setAnalisisIA] = useState<string | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);

  // ── Helpers ──

  const updateDay = useCallback((key: DayKey, patch: Partial<DayConfig>) => {
    setDays(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const copyDayTo = (from: DayKey, to: DayKey) => {
    setDays(prev => ({ ...prev, [to]: { ...prev[from] } }));
  };

  const addContract = () => {
    setContracts(prev => [...prev, { id: Date.now().toString(), name: "", hoursPerWeek: 40 }]);
  };
  const removeContract = (id: string) => setContracts(prev => prev.filter(c => c.id !== id));
  const updateContract = (id: string, patch: Partial<Contract>) =>
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  // ── Calcular ──

  const handleCalculate = () => {
    setLoading(true);
    setShowAllMixes(false);
    setShowLeadForm(false);
    setLeadEnviado(false);
    setAnalisisIA(null);

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

  // ── Exportar Excel ──

  const handleExportExcel = async () => {
    if (!result) return;
    setExportingExcel(true);
    try {
      const res = await fetch("/api/export-mixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mixes: result.mixes,
          hasCosts: result.hasCosts,
          requiredHours: result.requiredHours,
          requiredHoursAdjusted: result.requiredHoursAdjusted,
          fte: result.fte,
          fteAdjusted: result.fteAdjusted,
          replacementFactor: result.replacementFactor,
        }),
      });
      if (!res.ok) throw new Error("Error generando Excel");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `dotaciones_mixes_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExportingExcel(false);
    }
  };

  // ── Análisis IA + Lead + Email ──

  const handleSolicitarAnalisis = async () => {
    if (!result || !leadEmail) return;
    setLoadingIA(true);
    try {
      const mixOptimo = result.mixes.find(m => m.isOptimal) ?? result.mixes[0];
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: leadNombre || leadEmail,
          email: leadEmail,
          empresa: leadEmpresa,
          sector: "Retail",
          calculadora: "Retail / Servicios",
          fuente: "Calculadora",
          resultados: {
            requiredHours: result.requiredHours,
            requiredHoursAdjusted: result.requiredHoursAdjusted,
            fte: result.fte,
            fteAdjusted: result.fteAdjusted,
            replacementFactor: result.replacementFactor,
            gapHours: result.gapHours,
            breakHours: result.breakHours,
            totalMixesEncontrados: result.totalMixes,
            mixOptimo,
            advertencias: result.warnings,
          },
        }),
      });
      const data = await res.json();
      setAnalisisIA(data.analisis ?? null);
      setLeadEnviado(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIA(false);
    }
  };

  const d = days[activeDay];

  const featured = result ? selectFeatured(result.mixes, result.hasCosts) : null;
  const featuredMixes = featured
    ? [
        featured.optimal  ? { mix: featured.optimal,  label: "Óptimo",              accent: true  } : null,
        featured.cheapest ? { mix: featured.cheapest, label: "Más económico",        accent: false } : null,
        featured.leanest && featured.leanest !== featured.optimal
          ? { mix: featured.leanest,  label: "Menor holgura",          accent: false } : null,
        featured.mostFull && featured.mostFull !== featured.optimal && featured.mostFull !== featured.leanest
          ? { mix: featured.mostFull, label: "Más estable (menos PT)", accent: false } : null,
      ].filter(Boolean)
    : [];

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
            Dibuja cuántas personas necesitas en cada tramo de 30 min, día por día. Obtienes horas‑persona, FTE y todos los mixes de contratos posibles.
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
                      onChange={e => setFullHours(parseInt(e.target.value) || 42)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-slate-400 mt-1">Ej: 42 ó 44</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Factor reemplazo <span className="text-slate-400">(vacac. + lic.)</span></label>
                    <input type="number" min={1} max={1.5} step={0.01} value={replacementFactor}
                      onChange={e => setReplacementFactor(parseFloat(e.target.value) || 1.15)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-slate-400 mt-1">{((replacementFactor - 1) * 100).toFixed(0)}% — retail ~12%, salud ~18%</p>
                  </div>
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
                  <p className="text-xs text-slate-400 mt-0.5">Define los tipos de contrato que permite tu empresa</p>
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
              <span className="text-xs text-slate-400">Powered by Nexwork SpA</span>
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
                { label: "Horas a contratar",   value: result.requiredHoursAdjusted.toFixed(1), sub: `×${result.replacementFactor} reemplazo`, highlight: true },
                { label: "FTE bruto",           value: result.fte.toFixed(2), sub: "sin reemplazo" },
                { label: "FTE a contratar",     value: result.fteAdjusted.toFixed(2), sub: "dotación real", highlight: true },
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

            {/* 4 tarjetas destacadas */}
            <div className="px-5 py-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Mix de contratos sugerido</h3>
                <span className="text-xs text-slate-400 mono">{result.totalMixes} combinaciones válidas</span>
              </div>

              {featuredMixes.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {featuredMixes.map((f, i) => f && (
                    <MixCard key={i} mix={f.mix} label={f.label} accent={f.accent} hasCosts={result.hasCosts} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No se encontraron mixes válidos. Revisa que los contratos puedan cubrir todos los días abiertos.</p>
              )}

              {/* Botones: ver tabla + exportar Excel */}
              {result.totalMixes > 0 && (
                <div className="mt-4 flex items-center gap-5 flex-wrap">
                  <button onClick={() => setShowAllMixes(v => !v)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5">
                    <svg className={`w-3.5 h-3.5 transition-transform ${showAllMixes ? "rotate-90" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {showAllMixes ? "Ocultar tabla" : `Ver todas las ${result.totalMixes} combinaciones`}
                  </button>

                  <button onClick={handleExportExcel} disabled={exportingExcel}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {exportingExcel ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Generando Excel…
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Exportar todas las combinaciones a Excel
                      </>
                    )}
                  </button>
                </div>
              )}

              {showAllMixes && result.totalMixes > 0 && (
                <div className="mt-4">
                  <MixTable mixes={result.mixes} hasCosts={result.hasCosts} />
                </div>
              )}
            </div>

            {/* Panel IA Nexwork */}
            <div className="mx-5 mb-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Análisis IA de tu dotación</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Interpretación experta, alertas legales y cómo presentarlo a gerencia — gratis. Te lo enviamos también por email.
                  </p>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Nexwork SpA</span>
              </div>

              {!leadEnviado ? (
                <div className="px-5 py-4">
                  {!showLeadForm ? (
                    <button onClick={() => setShowLeadForm(true)}
                      className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Obtener análisis IA gratuito
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                          <input type="text" value={leadNombre} onChange={e => setLeadNombre(e.target.value)}
                            placeholder="Tu nombre"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Empresa</label>
                          <input type="text" value={leadEmpresa} onChange={e => setLeadEmpresa(e.target.value)}
                            placeholder="Tu empresa"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Email <span className="text-blue-600">*</span></label>
                        <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)}
                          placeholder="tu@empresa.cl"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <button onClick={handleSolicitarAnalisis} disabled={!leadEmail || loadingIA}
                        className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {loadingIA ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Analizando y enviando…
                          </>
                        ) : "Ver mi análisis →"}
                      </button>
                      <p className="text-xs text-slate-400 text-center">Sin spam. Te enviamos el análisis a tu email.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium">Análisis generado y enviado a {leadEmail}</span>
                  </div>
                  {analisisIA && (
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white rounded-lg p-4 border border-slate-100">
                      {analisisIA}
                    </div>
                  )}
                </div>
              )}
            </div>

          </section>
        )}
      </div>

      <footer className="border-t border-slate-100 py-6 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} dotaciones.cl — <span className="text-slate-500 font-medium">Nexwork SpA</span></span>
          <div className="flex gap-4">
            <Link href="/blog" className="hover:text-slate-600 transition-colors">Blog</Link>
            <Link href="/contacto" className="hover:text-slate-600 transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
