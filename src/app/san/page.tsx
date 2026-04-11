"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

// ─── Tipos ──────────────────────────────────────────────────────────────────

type ApiResp = { ok: true; result: any } | { ok: false; error: string };
type MixApiResp = { ok: true; result: any } | { ok: false; error: string };
type EquipmentLevel = "all" | "some" | "none";
type RoundingMode = "normativo" | "conservador";

function safeNum(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function pct(x: number) {
  if (!Number.isFinite(x)) return "0%";
  return `${Math.round(x * 100)}%`;
}

// ─── Componentes pequeños ────────────────────────────────────────────────────

function SectionHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function NumInput({ value, onChange, min = 0, max, step = 1, disabled = false }: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; disabled?: boolean;
}) {
  return (
    <input
      type="number" min={min} max={max} step={step}
      value={value} disabled={disabled}
      onChange={(e) => onChange(safeNum(e.target.value))}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
    />
  );
}

function KpiCard({ label, value, sub, highlight = false }: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`px-5 py-4 ${highlight ? "bg-blue-50" : "bg-white"}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${highlight ? "text-blue-700" : "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function SanPage() {

  // ── Etapa 1: Normativa SAN ──────────────────────────────────────────────

  const [maxWeekHours, setMaxWeekHours] = useState<44 | 42 | 40>(44);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>("normativo");

  // RTD
  const [useMeals, setUseMeals] = useState(false);
  const [rtdPatients, setRtdPatients] = useState(0);
  const [rtdCasino, setRtdCasino] = useState(0);
  const [pDes, setPDes] = useState(0);
  const [pColAm, setPColAm] = useState(0);
  const [pAlm, setPAlm] = useState(0);
  const [pOnce, setPOnce] = useState(0);
  const [pCen, setPCen] = useState(0);
  const [cDes, setCDes] = useState(0);
  const [cAlm, setCAlm] = useState(0);
  const [cCen, setCCen] = useState(0);

  // RCD
  const [advanced, setAdvanced] = useState(false);
  const [rcd, setRcd] = useState(0);
  const [rtdTotal, setRtdTotal] = useState(0);
  // FC
  const [equipmentLevel, setEquipmentLevel] = useState<EquipmentLevel>("all");
  const [useEquipmentFC, setUseEquipmentFC] = useState(false);
  const [useExtraLines, setUseExtraLines] = useState(false);
  const [extraMealsPerDay, setExtraMealsPerDay] = useState(0);
  const [useVeg, setUseVeg] = useState(false);
  const [vegPercent, setVegPercent] = useState(0);

  // Camas (clínica)
  const [bedsBasic, setBedsBasic] = useState(0);
  const [bedsMedium, setBedsMedium] = useState(0);
  const [bedsCritical, setBedsCritical] = useState(0);

  // ── Etapa 2: Perfil operacional ──────────────────────────────────────────

  const [weekendMode, setWeekendMode] = useState<"percent" | "rtd">("percent");
  const [weekendReduction, setWeekendReduction] = useState(30);
  const [rtdPatientsWeekend, setRtdPatientsWeekend] = useState(0);
  const [rtdCasinoWeekend, setRtdCasinoWeekend] = useState(0);
  const [hoursPerShift, setHoursPerShift] = useState(10);
  const [shiftsPerDay, setShiftsPerDay] = useState(1);
  const [replacementFactor, setReplacementFactor] = useState(1.18);
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [overlapMinutes, setOverlapMinutes] = useState(30);

  // ── Etapa 3: Mix contratos ───────────────────────────────────────────────

  const [allowedContracts, setAllowedContracts] = useState<number[]>([44, 42, 40, 30, 20]);
  const [allowedJornadas, setAllowedJornadas] = useState({
    allow_6x1: true,
    allow_5x2: true,
    allow_4x3: true,
    allow_pt_weekend: true,
    allow_2x2: false,
    allow_3x3: false,
  });
  const [ptMaxShare, setPtMaxShare] = useState(0.25);

  function toggleContract(h: number) {
    setAllowedContracts((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h].sort((a, b) => b - a)
    );
  }

  // ── API calls ────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [mixLoading, setMixLoading] = useState(false);
  const [mixResp, setMixResp] = useState<MixApiResp | null>(null);
  const [exporting, setExporting] = useState(false);

  // ── Estados IA ───────────────────────────────────────────────────────────

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadNombre, setLeadNombre] = useState("");
  const [leadEmpresa, setLeadEmpresa] = useState("");
  const [leadEnviado, setLeadEnviado] = useState(false);
  const [analisisIA, setAnalisisIA] = useState<string | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);

  const sanPayload = useMemo(() => ({
    scenario: { maxWeekHours, roundingMode },
    rtdPatients: useMeals ? undefined : rtdPatients,
    rtdCasino: useMeals ? undefined : rtdCasino,
    rtdMeals: useMeals ? {
      enabled: true,
      integerMode: roundingMode === "conservador" ? "ceil" : "round",
      patients: { desayuno: pDes, colacion_am: pColAm, almuerzo: pAlm, once: pOnce, cena: pCen },
      casino: { desayuno: cDes, almuerzo: cAlm, cena: cCen },
    } : undefined,
    rcd: advanced ? undefined : rcd,
    rtdTotal: advanced ? rtdTotal : undefined,
    factors: advanced ? {
      equipmentTechnology: { enabled: useEquipmentFC, level: equipmentLevel },
      extraProductionLines: { enabled: useExtraLines, extraMealsPerDay },
      vegUnprocessedShare: { enabled: useVeg, percent: vegPercent },
    } : undefined,
    bedsBasic, bedsMedium, bedsCritical,
  }), [maxWeekHours, roundingMode, useMeals, rtdPatients, rtdCasino, pDes, pColAm, pAlm, pOnce, pCen, cDes, cAlm, cCen, advanced, rcd, rtdTotal, useEquipmentFC, equipmentLevel, useExtraLines, extraMealsPerDay, useVeg, vegPercent, bedsBasic, bedsMedium, bedsCritical]);

  async function runSan() {
    setLoading(true); setResp(null);
    // Reset IA al recalcular
    setShowLeadForm(false); setLeadEnviado(false); setAnalisisIA(null);
    try {
      const r = await fetch("/api/san", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sanPayload) });
      setResp(await r.json());
    } catch (e: any) {
      setResp({ ok: false, error: e?.message ?? "Error inesperado" });
    } finally { setLoading(false); }
  }

  async function generateMix() {
    setMixLoading(true); setMixResp(null);

    const sanResult = resp?.ok ? resp.result : null;
    const ucpAreas: any[] = sanResult?.ucpStaffByArea ?? [];
    const peopleFromSan = ucpAreas.reduce((sum: number, a: any) => sum + (Number(a.applied) || 0), 0);
    const peopleLV = peopleFromSan > 0 ? peopleFromSan : shiftsPerDay;

    const weekendFactor = weekendMode === "percent"
      ? (1 - weekendReduction / 100)
      : (rtdPatientsWeekend + rtdCasinoWeekend) / Math.max(1, rtdPatients + rtdCasino);

    const peopleWeekend = Math.max(0, Math.round(peopleLV * weekendFactor));

    const daysPayload: any = {};
    for (const d of ["mon", "tue", "wed", "thu", "fri"]) {
      daysPayload[d] = { open: true, hoursOpen: hoursPerShift, requiredPeople: peopleLV, overlapMinutes, breakMinutes };
    }
    for (const d of ["sat", "sun"]) {
      daysPayload[d] = { open: peopleWeekend > 0, hoursOpen: hoursPerShift, requiredPeople: peopleWeekend, overlapMinutes, breakMinutes };
    }

    try {
      const r = await fetch("/api/san/mix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: { maxWeekHours }, days: daysPayload, allowedContracts, allowedJornadas, ptMaxShare, replacementFactor }),
      });
      setMixResp(await r.json());
    } catch (e: any) {
      setMixResp({ ok: false, error: e?.message ?? "Error generando mix" });
    } finally { setMixLoading(false); }
  }

  async function downloadExcel() {
    setExporting(true);
    try {
      const body = { ...sanPayload, days: {}, allowedContracts, allowedJornadas, ptMaxShare, replacementFactor };
      const r = await fetch("/api/san/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "SAN_dotacion.xlsx";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e: any) { alert(e?.message ?? "Error descargando Excel"); }
    finally { setExporting(false); }
  }

  async function handleSolicitarAnalisis() {
    if (!leadEmail) return;
    setLoadingIA(true);

    try {
      const sanResult = resp?.ok ? resp.result : null;
      const mixResult = mixResp?.ok ? mixResp.result : null;

      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: leadNombre || leadEmail,
          email: leadEmail,
          empresa: leadEmpresa,
          sector: "Hospitalario/SAN",
          calculadora: "SAN Hospitalaria",
          fuente: "Calculadora",
        }),
      });

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultados: {
            totalHorasSemanales: sanResult?.totalHoursPerWeek_required,
            fteEquivalente: sanResult?.totalFte_equivalent,
            complejidadUCP: sanResult?.ucpComplexity,
            nutricionistasCli: sanResult?.clinicaNutricionistas,
            dotacionPorArea: sanResult?.ucpStaffByArea,
            replacementFactor,
            mixRecomendado: mixResult?.mixes?.[0] ?? null,
            advertencias: mixResult?.warnings ?? [],
          },
          sector: "Hospitalario / SAN",
          calculadora: "SAN Hospitalaria",
        }),
      });

      const data = await res.json();
      setAnalisisIA(data.analisis);
      setLeadEnviado(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIA(false);
    }
  }

  const sanResult = resp?.ok ? resp.result : null;
  const mixResult = mixResp?.ok ? mixResp.result : null;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap'); * { box-sizing: border-box; } .mono { font-family: 'DM Mono', monospace; }`}</style>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-slate-900 text-lg tracking-tight">
            dotaciones<span className="text-blue-600">.cl</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/calculadora" className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">Calculadora</Link>
            <Link href="/blog" className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">Blog</Link>
            <Link href="/san/glosario" className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">Glosario</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Título */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">PRO</span>
            <span className="text-xs text-slate-400">OT-SAN MINSAL 2025</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Calculadora SAN Hospitalaria</h1>
          <p className="text-sm text-slate-500">
            Normativa MINSAL → perfil operacional → mix de contratos. Tres etapas integradas.
          </p>
        </div>

        {/* Configuración global */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Configuración del escenario</h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <Field label="Jornada máxima">
              <div className="flex gap-2">
                {([44, 42, 40] as const).map((h) => (
                  <button key={h} onClick={() => setMaxWeekHours(h)}
                    className={`flex-1 text-sm py-2 rounded-lg border font-mono font-medium transition-all ${maxWeekHours === h ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                    {h}h
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Ley 21.561 reduce a 42h el 26 abr 2025</p>
            </Field>
            <Field label="Modo de redondeo">
              <div className="flex gap-2">
                {[{ id: "normativo" as const, label: "Normativo" }, { id: "conservador" as const, label: "Conservador" }].map((m) => (
                  <button key={m.id} onClick={() => setRoundingMode(m.id)}
                    className={`flex-1 text-sm py-2 rounded-lg border font-medium transition-all ${roundingMode === m.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Conservador redondea hacia arriba (anti-riesgo)</p>
            </Field>
          </div>
        </div>

        {/* ── ETAPA 1: Normativa SAN ── */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <SectionHeader step={1} title="Normativa SAN" subtitle="RTD → RCD → Factores de complejidad → Dotación normativa" />

          <div className="px-5 py-5 space-y-6">

            {/* RTD */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Raciones Totales Día (RTD)</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setUseMeals(!useMeals)}
                    className={`relative w-8 h-4 rounded-full transition-colors ${useMeals ? "bg-blue-600" : "bg-slate-200"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${useMeals ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-xs text-slate-500">Calcular desde tiempos de comida</span>
                </label>
              </div>

              {!useMeals ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="RTD pacientes + unidades anexas">
                    <NumInput value={rtdPatients} onChange={setRtdPatients} />
                  </Field>
                  <Field label="RTD casino (funcionarios)">
                    <NumInput value={rtdCasino} onChange={setRtdCasino} />
                  </Field>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Desayuno pacientes", value: pDes, set: setPDes },
                      { label: "Colación AM pacientes", value: pColAm, set: setPColAm },
                      { label: "Almuerzo pacientes", value: pAlm, set: setPAlm },
                      { label: "Once pacientes", value: pOnce, set: setPOnce },
                      { label: "Cena pacientes", value: pCen, set: setPCen },
                    ].map((f) => (
                      <Field key={f.label} label={f.label}>
                        <NumInput value={f.value} onChange={f.set} />
                      </Field>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-3">Casino / funcionarios</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Desayuno casino", value: cDes, set: setCDes },
                        { label: "Almuerzo casino", value: cAlm, set: setCAlm },
                        { label: "Cena casino", value: cCen, set: setCCen },
                      ].map((f) => (
                        <Field key={f.label} label={f.label}>
                          <NumInput value={f.value} onChange={f.set} />
                        </Field>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RCD */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Raciones Completas Día (RCD)</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setAdvanced(!advanced)}
                    className={`relative w-8 h-4 rounded-full transition-colors ${advanced ? "bg-blue-600" : "bg-slate-200"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${advanced ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-xs text-slate-500">Calcular RCD desde RTD + FC</span>
                </label>
              </div>

              {!advanced ? (
                <Field label="RCD (valor directo)" hint="Si ya calculaste RCD externamente, ingrésalo aquí">
                  <NumInput value={rcd} onChange={setRcd} />
                </Field>
              ) : (
                <div className="space-y-4">
                  <Field label="RTD total (base para RCD)">
                    <NumInput value={rtdTotal} onChange={setRtdTotal} />
                  </Field>
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 font-medium">Factores de complejidad (OT-SAN 2025)</p>

                    {/* FC 1: Equipos */}
                    <div className="border border-slate-100 rounded-lg p-3">
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input type="checkbox" checked={useEquipmentFC} onChange={(e) => setUseEquipmentFC(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                        <span className="text-sm text-slate-700">FC nivel tecnológico de equipos</span>
                      </label>
                      {useEquipmentFC && (
                        <div className="flex gap-2 ml-6">
                          {([
                            { id: "all" as const, label: "Todos", hint: "FC 1.0" },
                            { id: "some" as const, label: "Al menos uno", hint: "FC 1.1" },
                            { id: "none" as const, label: "Ninguno", hint: "FC 1.2" },
                          ]).map((opt) => (
                            <button key={opt.id} onClick={() => setEquipmentLevel(opt.id)}
                              className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${equipmentLevel === opt.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                              {opt.label}
                              <span className={`ml-1 font-mono ${equipmentLevel === opt.id ? "text-blue-200" : "text-slate-400"}`}>{opt.hint}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {useEquipmentFC && (
                        <p className="text-xs text-slate-400 mt-2 ml-6">Equipos: lavavajillas, hornos combinados, marmitas automáticas</p>
                      )}
                    </div>

                    {/* FC 2: Líneas adicionales */}
                    <div className="border border-slate-100 rounded-lg p-3">
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input type="checkbox" checked={useExtraLines} onChange={(e) => setUseExtraLines(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                        <span className="text-sm text-slate-700">FC líneas adicionales de producción</span>
                      </label>
                      {useExtraLines && (
                        <div className="ml-6">
                          <Field label="Almuerzos o cenas en líneas adicionales (usar el mayor, no sumar)">
                            <NumInput value={extraMealsPerDay} onChange={setExtraMealsPerDay} />
                          </Field>
                          <p className="text-xs text-slate-400 mt-1">0-29: FC 1.0 · 30-59: FC 1.1 · 60-89: FC 1.2 · 90+: FC 1.3</p>
                        </div>
                      )}
                    </div>

                    {/* FC 3: Vegetal sin procesar */}
                    <div className="border border-slate-100 rounded-lg p-3">
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input type="checkbox" checked={useVeg} onChange={(e) => setUseVeg(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                        <span className="text-sm text-slate-700">FC materia prima vegetal sin procesar</span>
                      </label>
                      {useVeg && (
                        <div className="ml-6">
                          <Field label="% MP vegetal sin procesar (excluye fruta natural)">
                            <NumInput value={vegPercent} onChange={setVegPercent} min={0} max={100} />
                          </Field>
                          <p className="text-xs text-slate-400 mt-1">{"< 30%: FC 1.0 · ≥ 30%: FC 1.1"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Camas clínica */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Clínica — Nutricionistas</p>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Camas básico" hint="1 nutri / 32 camas">
                  <NumInput value={bedsBasic} onChange={setBedsBasic} />
                </Field>
                <Field label="Camas medio" hint="1 nutri / 24 camas">
                  <NumInput value={bedsMedium} onChange={setBedsMedium} />
                </Field>
                <Field label="Camas crítico" hint="1 nutri / 16 camas">
                  <NumInput value={bedsCritical} onChange={setBedsCritical} />
                </Field>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={runSan} disabled={loading}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Calculando…</> : "Calcular normativa SAN →"}
              </button>
            </div>
          </div>

          {/* Resultado Etapa 1 */}
          {resp && (
            <div className="border-t border-slate-200">
              {!resp.ok ? (
                <div className="px-5 py-4 bg-red-50 text-sm text-red-700">❌ {resp.error}</div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100">
                    <KpiCard label="Horas/sem requeridas" value={sanResult.totalHoursPerWeek_required} sub={`base ${maxWeekHours}h`} />
                    <KpiCard label="FTE equivalente" value={sanResult.totalFte_equivalent} sub="dotación normativa" highlight />
                    <KpiCard label="Complejidad UCP" value={sanResult.ucpComplexity ?? "—"} sub="mínima / mediana / máxima" />
                    <KpiCard label="Nutricionistas clínica" value={sanResult.clinicaNutricionistas ?? "—"} sub="total requerido" />
                  </div>
                  {/* UCP por área */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Dotación por área (UCP)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(sanResult.ucpStaffByArea ?? []).map((a: any) => (
                        <div key={a.area} className="border border-slate-100 rounded-lg px-4 py-3">
                          <p className="text-xs text-slate-500 mb-1">{a.area.replace(/_/g, " ")}</p>
                          <p className="text-lg font-bold font-mono text-slate-800">{a.applied}</p>
                          <p className="text-xs text-slate-400">personas</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── ETAPA 2: Perfil operacional ── */}
        <div className={`border rounded-xl overflow-hidden mb-6 transition-opacity ${resp?.ok ? "border-slate-200 opacity-100" : "border-dashed border-slate-200 opacity-50 pointer-events-none"}`}>
          <SectionHeader step={2} title="Perfil operacional"
            subtitle="Define cómo varía la demanda en la semana — el sistema calcula las horas-persona reales" />

          <div className="px-5 py-5 space-y-5">

            {/* Variación fin de semana */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Variación sábado–domingo</p>
                <div className="flex gap-1">
                  {[
                    { id: "percent" as const, label: "% reducción" },
                    { id: "rtd" as const, label: "RTD diferenciado" },
                  ].map((m) => (
                    <button key={m.id} onClick={() => setWeekendMode(m.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${weekendMode === m.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {weekendMode === "percent" ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Reducción sáb-dom (%)" hint="Ej: 30% = operan al 70% el fin de semana">
                    <NumInput value={weekendReduction} onChange={setWeekendReduction} min={0} max={100} />
                  </Field>
                  <div className="flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 px-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Operación fin de semana</p>
                      <p className="text-2xl font-bold font-mono text-slate-800">{100 - weekendReduction}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="RTD pacientes sáb-dom" hint={`vs L-V: ${rtdPatients}`}>
                    <NumInput value={rtdPatientsWeekend} onChange={setRtdPatientsWeekend} />
                  </Field>
                  <Field label="RTD casino sáb-dom">
                    <NumInput value={rtdCasinoWeekend} onChange={setRtdCasinoWeekend} />
                  </Field>
                </div>
              )}
            </div>

            {/* Horario */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Horario de operación</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Horas por turno" hint="Ej: 10h (07:00-17:00)">
                  <NumInput value={hoursPerShift} onChange={setHoursPerShift} min={1} max={24} step={0.5} />
                </Field>
                <Field label="Colación (min)">
                  <NumInput value={breakMinutes} onChange={setBreakMinutes} min={0} max={120} step={5} />
                </Field>
                <Field label="Traslape entre turnos (min)">
                  <NumInput value={overlapMinutes} onChange={setOverlapMinutes} min={0} max={120} step={5} />
                </Field>
              </div>
            </div>

            {/* Factor reemplazo */}
            <div className="pt-4 border-t border-slate-100">
              <Field label="Factor de reemplazo" hint={`${((replacementFactor - 1) * 100).toFixed(0)}% ausentismo — salud pública ~18%, salud privada ~10%`}>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "10%", value: 1.10 },
                    { label: "15%", value: 1.15 },
                    { label: "18%", value: 1.18 },
                    { label: "Custom", value: null },
                  ].map((opt) => (
                    <button key={opt.label}
                      onClick={() => opt.value && setReplacementFactor(opt.value)}
                      className={`text-xs py-2 rounded-lg border transition-all ${opt.value && Math.abs(replacementFactor - opt.value) < 0.001 ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <NumInput value={replacementFactor} onChange={setReplacementFactor} min={1} max={1.5} step={0.01} />
                </div>
              </Field>
            </div>

            {/* Resumen horas-persona */}
            {resp?.ok && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Resumen estimado semana</p>
                <div className="grid grid-cols-3 gap-3">
                  {(() => {
                    const ucpAreas: any[] = sanResult?.ucpStaffByArea ?? [];
                    const pLV = ucpAreas.reduce((s: number, a: any) => s + (Number(a.applied) || 0), 0) || shiftsPerDay;
                    const wFactor = weekendMode === "percent"
                      ? (1 - weekendReduction / 100)
                      : (rtdPatientsWeekend + rtdCasinoWeekend) / Math.max(1, rtdPatients + rtdCasino);
                    const pWE = Math.round(pLV * wFactor);
                    const hpLV = pLV * hoursPerShift * 5;
                    const hpWE = pWE * hoursPerShift * 2;
                    const totalAdj = (hpLV + hpWE) * replacementFactor;
                    return [
                      { label: `Horas-persona L-V (${pLV}p × ${hoursPerShift}h × 5d)`, value: `${hpLV}h` },
                      { label: `Horas-persona Sáb-Dom (${pWE}p × ${hoursPerShift}h × 2d)`, value: `${hpWE}h` },
                      { label: "Total ajustado / sem", value: `${totalAdj.toFixed(0)}h`, highlight: true },
                    ];
                  })().map((k) => (
                    <div key={k.label} className={`rounded-lg border px-4 py-3 ${k.highlight ? "border-blue-200 bg-blue-50" : "border-slate-100"}`}>
                      <p className="text-xs text-slate-500">{k.label}</p>
                      <p className={`text-lg font-bold font-mono mt-0.5 ${k.highlight ? "text-blue-700" : "text-slate-800"}`}>{k.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ETAPA 3: Mix de contratos ── */}
        <div className={`border rounded-xl overflow-hidden mb-6 transition-opacity ${resp?.ok ? "border-slate-200 opacity-100" : "border-dashed border-slate-200 opacity-50 pointer-events-none"}`}>
          <SectionHeader step={3} title="Mix de contratos"
            subtitle="Jornadas disponibles y restricciones — el motor propone 2-3 combinaciones" />

          <div className="px-5 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-6">

              {/* Jornadas */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Jornadas permitidas</p>
                <div className="space-y-2">
                  {[
                    { key: "allow_6x1", label: "6×1", hint: "6 días trabajo, 1 descanso" },
                    { key: "allow_5x2", label: "5×2", hint: "5 días trabajo, 2 descanso" },
                    { key: "allow_4x3", label: "4×3 (solo 40h)", hint: "4 días trabajo, 3 descanso" },
                    { key: "allow_pt_weekend", label: "PT fin de semana", hint: "Sáb-Dom únicamente" },
                    { key: "allow_2x2", label: "2×2 (excepcional)", hint: "Requiere autorización" },
                    { key: "allow_3x3", label: "3×3 (excepcional)", hint: "Requiere autorización" },
                  ].map((j) => (
                    <label key={j.key} className="flex items-start gap-2.5 cursor-pointer group">
                      <input type="checkbox"
                        checked={allowedJornadas[j.key as keyof typeof allowedJornadas]}
                        onChange={(e) => setAllowedJornadas((p) => ({ ...p, [j.key]: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 mt-0.5" />
                      <div>
                        <span className="text-sm text-slate-700 font-medium">{j.label}</span>
                        <span className="text-xs text-slate-400 ml-2">{j.hint}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contratos */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Contratos disponibles (horas/sem)</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {[44, 42, 40, 33, 30, 22, 20].map((h) => (
                    <button key={h} onClick={() => toggleContract(h)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition-all ${allowedContracts.includes(h) ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                      {h}h
                    </button>
                  ))}
                </div>
                <Field label="Máx. % contratos PT (parciales)" hint="Recomendado ≤25% en sector hospitalario">
                  <NumInput value={Math.round(ptMaxShare * 100)} onChange={(v) => setPtMaxShare(v / 100)} min={0} max={100} />
                </Field>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button onClick={generateMix} disabled={mixLoading || !resp?.ok}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {mixLoading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Generando mix…</> : "Generar mix PRO →"}
              </button>
              <button onClick={downloadExcel} disabled={exporting || !resp?.ok}
                className="px-5 py-2.5 bg-white text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 hover:border-slate-300 transition-colors disabled:opacity-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {exporting ? "Generando…" : "Excel PRO"}
              </button>
            </div>
          </div>

          {/* Resultado mix */}
          {mixResp && (
            <div className="border-t border-slate-200">
              {!mixResp.ok ? (
                <div className="px-5 py-4 bg-red-50 text-sm text-red-700">❌ {mixResp.error}</div>
              ) : (
                <div className="px-5 py-5">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 text-sm text-slate-500">
                    <span>Horas requeridas: <strong className="text-slate-800 mono">{mixResult.requiredHours}</strong></span>
                    <span>FTE: <strong className="text-slate-800 mono">{mixResult.fte}</strong></span>
                    <span>PT máx: <strong className="text-slate-800 mono">{pct(mixResult.ptMaxShare)}</strong></span>
                    {mixResult.warnings?.length > 0 && (
                      <span className="text-amber-600">⚠ {mixResult.warnings.join(" · ")}</span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {(mixResult.mixes ?? []).map((m: any, i: number) => {
                      const breakdown = Array.isArray(m.dayBreakdown) ? m.dayBreakdown : [];
                      const maxBrecha = breakdown.reduce((mx: number, r: any) => Math.max(mx, safeNum(r?.remaining)), 0);
                      return (
                        <div key={i} className={`rounded-xl border p-4 ${i === 0 ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className={`text-xs font-semibold ${i === 0 ? "text-blue-700" : "text-slate-500"}`}>
                                {m.title ?? (i === 0 ? "Recomendado" : `Alternativa ${i}`)}
                              </p>
                              {maxBrecha > 0.1 && (
                                <p className="text-xs text-amber-600 mt-0.5">⚠ Brecha máx: {Math.round(maxBrecha * 10) / 10}h-p/día</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold mono ${i === 0 ? "text-blue-700" : "text-slate-800"}`}>{m.headcount}</p>
                              <p className="text-xs text-slate-400">personas</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 mb-3">
                            {(m.items ?? []).map((it: any, j: number) => (
                              <div key={j} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-blue-500" : "bg-slate-400"}`} />
                                  <span className="text-xs text-slate-700 font-medium">{it.contractName ?? `${it.hoursPerWeek}h`}</span>
                                  <span className="text-xs text-slate-400 mono">{it.jornadaLabel ?? it.jornadaName}</span>
                                </div>
                                <span className={`text-xs font-bold mono ${i === 0 ? "text-blue-700" : "text-slate-700"}`}>×{it.count}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Horas</p>
                              <p className="mono font-semibold text-slate-700">{m.hoursTotal}h</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Holgura</p>
                              <p className={`mono font-semibold ${m.slackPct > 0.3 ? "text-amber-600" : "text-slate-700"}`}>
                                {m.slackHours}h ({(m.slackPct * 100).toFixed(0)}%)
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">PT share</p>
                              <p className="mono font-semibold text-slate-700">{pct(m.ptShare ?? 0)}</p>
                            </div>
                          </div>

                          {breakdown.length > 0 && (
                            <details className="mt-3">
                              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                                Ver cobertura por día →
                              </summary>
                              <div className="mt-2 space-y-1">
                                {breakdown.map((r: any, k: number) => {
                                  const brecha = safeNum(r?.remaining);
                                  return (
                                    <div key={k} className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500 w-8">{r.day}</span>
                                      <span className="text-slate-600 mono">dem: {r.demand}</span>
                                      <span className="text-slate-600 mono">cubre: {r.supply}</span>
                                      <span className={`mono font-semibold ${brecha > 0.001 ? "text-amber-600" : "text-emerald-600"}`}>
                                        {brecha > 0.001 ? `−${r.remaining}` : "✓"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PANEL IA NEXWORK ── */}
          {resp?.ok && (
            <div className="mx-5 mb-5 mt-2 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Análisis IA de tu dotación SAN</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Interpretación normativa, alertas legales y cómo presentarlo ante el directorio — gratis
                  </p>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Nexwork SpA
                </span>
              </div>

              {!leadEnviado ? (
                <div className="px-5 py-4">
                  {!showLeadForm ? (
                    <button
                      onClick={() => setShowLeadForm(true)}
                      className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
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
                          <input
                            type="text"
                            value={leadNombre}
                            onChange={(e) => setLeadNombre(e.target.value)}
                            placeholder="Tu nombre"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Hospital / Clínica</label>
                          <input
                            type="text"
                            value={leadEmpresa}
                            onChange={(e) => setLeadEmpresa(e.target.value)}
                            placeholder="Nombre del establecimiento"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Email <span className="text-blue-600">*</span>
                        </label>
                        <input
                          type="email"
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="tu@hospital.cl"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleSolicitarAnalisis}
                        disabled={!leadEmail || loadingIA}
                        className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loadingIA ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Analizando con IA…
                          </>
                        ) : "Ver mi análisis →"}
                      </button>
                      <p className="text-xs text-slate-400 text-center">
                        Sin spam. Solo usamos tu email para enviarte el análisis.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium">Análisis generado por Nexwork SpA</span>
                  </div>
                  {analisisIA && (
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white rounded-lg p-4 border border-slate-100">
                      {analisisIA}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <footer className="border-t border-slate-100 py-6 px-6 mt-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} dotaciones.cl — <span className="text-slate-500 font-medium">Nexwork SpA</span></span>
          <div className="flex gap-4">
            <Link href="/blog" className="hover:text-slate-600 transition-colors">Blog</Link>
            <Link href="/san/glosario" className="hover:text-slate-600 transition-colors">Glosario</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
