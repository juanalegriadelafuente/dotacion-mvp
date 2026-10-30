"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { computeStats, SlotDemandGrid } from "@/components/SlotDemandGrid";
import {
  aMixDeCorreo,
  curvaPorHora,
  type DiaWeb,
  entradasPorDia,
  horaTexto,
  type JornadaPedida,
  NOMBRE_DIA,
  type Opcion,
  pedirMix,
  type RespuestaMix,
} from "@/lib/dimensionador";
import { medir } from "@/lib/medir";
import { URL_LITE, URL_REVISAR } from "@/lib/sitio";

// ─── Constantes laborales Chile ───────────────────────────────────────────────

// Ingreso mínimo mensual, Ley N°21.751 — vigente desde el 1 de enero de 2026.
// Corresponde a la jornada ordinaria completa; las jornadas parciales, en proporción.
const MIN_WAGE = 539000; // CLP bruto/mes
const EMPLOYER_RATE = 0.0482; // SIS 1.49% + Mutual ~0.93% + Seg.Cesantía emp. 2.40%
const WEEKS_PER_MONTH = 52 / 12; // 4.333

// ─── Tipos ───────────────────────────────────────────────────────────────────

type DayConfig = { open: boolean; slots: number[] };

type Contract = {
  id: string;
  name: string;
  hoursPerWeek: number;
  daysPerWeek: number;
  monthlyGross?: number;
  maxPeople?: number;
};

const DIAS_POSIBLES = [6, 5, 4, 3, 2, 1];

// ─── Helpers de costo ────────────────────────────────────────────────────────

const minWageForHours = (h: number, full: number) =>
  Math.round(MIN_WAGE * (h / full));

const costoEmpresaHora = (monthlyGross: number, h: number) =>
  (monthlyGross * (1 + EMPLOYER_RATE)) / (h * WEEKS_PER_MONTH);

const clpFmt = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;
const horasFmt = (n: number) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: 1 });

// ─── Tarjeta de una opción ───────────────────────────────────────────────────

function OpcionCard({
  opcion,
  titulo,
  bajada,
  accent,
  conCostos,
  factor,
}: {
  opcion: Opcion;
  titulo: string;
  bajada: string;
  accent: boolean;
  conCostos: boolean;
  factor: number;
}) {
  const mensual =
    conCostos && opcion.costo_semanal != null
      ? Math.round(opcion.costo_semanal * WEEKS_PER_MONTH)
      : null;
  const uso =
    opcion.horas_contratadas > 0
      ? Math.round((opcion.horas_requeridas / opcion.horas_contratadas) * 100)
      : 0;
  const conReemplazos = Math.ceil(opcion.dotacion_total * factor);

  return (
    <div
      className={`rounded-xl border flex flex-col overflow-hidden ${accent ? "border-blue-300 shadow-sm shadow-blue-100" : "border-slate-200"}`}
    >
      <div className={`px-4 py-3 ${accent ? "bg-blue-600" : "bg-slate-800"}`}>
        <p className="text-sm font-semibold text-white">{titulo}</p>
        <p className="text-[11px] text-white/70">{bajada}</p>
      </div>

      <div className="p-4 flex flex-col gap-4 bg-white flex-1">
        <div className="flex items-end justify-between">
          <div>
            <p
              className={`text-4xl font-bold mono ${accent ? "text-blue-700" : "text-slate-900"}`}
            >
              {opcion.dotacion_total}
            </p>
            <p className="text-xs text-slate-400">
              personas para cubrir la semana
            </p>
          </div>
          <div className="text-right">
            {mensual != null ? (
              <>
                <p className="text-lg font-bold mono text-slate-800">
                  {clpFmt(mensual)}
                </p>
                <p className="text-[10px] text-slate-400">
                  costo empresa / mes *
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold mono text-slate-800">
                  {horasFmt(opcion.horas_contratadas)} h
                </p>
                <p className="text-[10px] text-slate-400">
                  horas contratadas / semana
                </p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {Object.entries(opcion.personas).map(([nombre, n]) => (
            <div key={nombre} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${accent ? "bg-blue-500" : "bg-slate-400"}`}
                />
                <span className="text-xs text-slate-700 font-medium">
                  {nombre}
                </span>
              </div>
              <span
                className={`text-xs font-bold mono ${accent ? "text-blue-700" : "text-slate-700"}`}
              >
                ×{n}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400 mb-0.5">
              Horas contratadas que se usan
            </p>
            <p className="mono font-semibold text-slate-700">{uso}%</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Con reemplazos (estimado)</p>
            <p className="mono font-semibold text-slate-700">
              {conReemplazos} personas
            </p>
          </div>
        </div>

        <p
          className={`text-[11px] ${opcion.optima ? "text-emerald-700" : "text-amber-700"}`}
        >
          {opcion.optima
            ? "✓ Es la mejor combinación posible con estos contratos."
            : "Cubre la demanda, pero el cálculo no alcanzó a probar que no exista una mejor."}
        </p>

        <details className="text-xs text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-700">
            ¿A qué hora entra cada uno?
          </summary>
          <div className="mt-2 space-y-2">
            {entradasPorDia(opcion).map(([dia, entradas]) => (
              <div key={dia}>
                <p className="font-semibold text-slate-700">
                  {NOMBRE_DIA[dia]}
                </p>
                <ul className="mt-0.5 space-y-0.5">
                  {entradas.map((e) => (
                    <li key={`${e.jornada}-${e.hora_inicio}`} className="mono">
                      {e.personas} × {e.jornada}: {horaTexto(e.hora_inicio)} a{" "}
                      {horaTexto(e.hora_inicio + e.horas)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

// ─── Fila de contrato ─────────────────────────────────────────────────────────

function ContractRow({
  contract,
  showGross,
  useMinWage,
  fullHours,
  onUpdate,
  onRemove,
}: {
  contract: Contract;
  showGross: boolean;
  useMinWage: boolean;
  fullHours: number;
  onUpdate: (patch: Partial<Contract>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-slate-100 rounded-lg p-3 space-y-2.5 bg-slate-50/50">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={contract.name}
          maxLength={30}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Ej: Full time"
          className="flex-1 min-w-0 border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={fullHours}
            value={contract.hoursPerWeek}
            onChange={(e) =>
              onUpdate({ hoursPerWeek: parseInt(e.target.value, 10) || 0 })
            }
            className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-sm mono text-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-400">h/sem</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar contrato"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          Días por semana
          <select
            value={contract.daysPerWeek}
            onChange={(e) =>
              onUpdate({ daysPerWeek: parseInt(e.target.value, 10) })
            }
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DIAS_POSIBLES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          Máximo de personas
          <input
            type="number"
            min={0}
            max={200}
            value={contract.maxPeople ?? ""}
            onChange={(e) =>
              onUpdate({
                maxPeople:
                  e.target.value === ""
                    ? undefined
                    : parseInt(e.target.value, 10),
              })
            }
            placeholder="sin tope"
            className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        {contract.daysPerWeek > 0 && contract.hoursPerWeek > 0 && (
          <span className="text-[11px] text-slate-400">
            turnos de {horasFmt(contract.hoursPerWeek / contract.daysPerWeek)} h
          </span>
        )}
      </div>

      {showGross && (
        <div>
          <label
            htmlFor={`sueldo-${contract.id}`}
            className="block text-[11px] text-slate-400 mb-1"
          >
            Sueldo bruto mensual (CLP)
          </label>
          {useMinWage ? (
            <p className="text-sm mono font-medium text-slate-600">
              {clpFmt(minWageForHours(contract.hoursPerWeek, fullHours))}
              <span className="text-[11px] text-slate-400 font-normal ml-2">
                (proporcional al mínimo)
              </span>
            </p>
          ) : (
            <input
              id={`sueldo-${contract.id}`}
              type="number"
              min={0}
              step={10000}
              value={contract.monthlyGross ?? ""}
              onChange={(e) =>
                onUpdate({
                  monthlyGross: parseFloat(e.target.value) || undefined,
                })
              }
              placeholder={`Ej: ${minWageForHours(contract.hoursPerWeek, fullHours).toLocaleString("es-CL")}`}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Gate de email ─────────────────────────────────────────────────────────────

function EmailGate({
  onSubmit,
}: {
  onSubmit: (email: string, nombre: string, empresa: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          empresa,
          source: "calculadora_gate",
        }),
      });
    } catch (_) {}
    onSubmit(email, nombre, empresa);
    setLoading(false);
  };

  return (
    <div className="mt-6 border border-blue-200 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-white">
      <div className="px-6 py-5 border-b border-blue-100">
        <p className="text-sm font-semibold text-slate-800">
          Tu dotación está lista
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Ingresa tu email para ver las dos opciones: la más barata y la de
          menos personas. También te las enviamos.
        </p>
      </div>
      <div className="px-6 py-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="gate-nombre"
              className="block text-xs text-slate-500 mb-1"
            >
              Nombre
            </label>
            <input
              id="gate-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="gate-empresa"
              className="block text-xs text-slate-500 mb-1"
            >
              Empresa
            </label>
            <input
              id="gate-empresa"
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Tu empresa"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="gate-email"
            className="block text-xs text-slate-500 mb-1"
          >
            Email <span className="text-blue-500">*</span>
          </label>
          <input
            id="gate-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.cl"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!email || loading}
          className="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Cargando…" : "Ver mis opciones →"}
        </button>
        <p className="text-[11px] text-slate-400 text-center">
          Sin spam. Solo tus resultados.
        </p>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const DAY_KEYS: DiaWeb[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<DiaWeb, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
};

function makeDefaultDay(open: boolean): DayConfig {
  return { open, slots: Array(48).fill(0) };
}

export default function CalculadoraPage() {
  const [days, setDays] = useState<Record<DiaWeb, DayConfig>>(() => ({
    mon: makeDefaultDay(true),
    tue: makeDefaultDay(true),
    wed: makeDefaultDay(true),
    thu: makeDefaultDay(true),
    fri: makeDefaultDay(true),
    sat: makeDefaultDay(false),
    sun: makeDefaultDay(false),
  }));
  const [activeDay, setActiveDay] = useState<DiaWeb>("mon");

  // Jornada completa vigente: 42 h desde el 26-04-2026; 40 h desde el 26-04-2028 (Ley 21.561).
  const [fullHours, setFullHours] = useState(42);
  const [replacementFactor, setReplacementFactor] = useState(1.15);

  const [contracts, setContracts] = useState<Contract[]>([
    { id: "1", name: "Full 42h", hoursPerWeek: 42, daysPerWeek: 5 },
    { id: "2", name: "Part 30h", hoursPerWeek: 30, daysPerWeek: 5 },
    { id: "3", name: "Part 20h", hoursPerWeek: 20, daysPerWeek: 2 },
  ]);

  const [showGross, setShowGross] = useState(false);
  const [useMinWage, setUseMinWage] = useState(false);
  const [result, setResult] = useState<RespuestaMix | null>(null);
  const [sent, setSent] = useState<JornadaPedida[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailPassed, setEmailPassed] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const updateDay = useCallback(
    (key: DiaWeb, patch: Partial<DayConfig>) =>
      setDays((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } })),
    [],
  );

  const copyDayTo = (from: DiaWeb, to: DiaWeb) =>
    setDays((prev) => ({
      ...prev,
      [to]: { ...prev[from], slots: [...prev[from].slots] },
    }));

  const addContract = () =>
    setContracts((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", hoursPerWeek: 30, daysPerWeek: 5 },
    ]);

  const updateContract = (id: string, patch: Partial<Contract>) =>
    setContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );

  const removeContract = (id: string) =>
    setContracts((prev) => prev.filter((c) => c.id !== id));

  const handleCalculate = async () => {
    medir("dotacion_calculo", "/calculadora");
    setEmailPassed(false);
    setResult(null);
    setError(null);

    const curva = curvaPorHora(days);
    if (Object.keys(curva).length === 0) {
      setError(
        "Marca en la grilla cuántas personas necesitas en cada tramo de al menos un día abierto.",
      );
      return;
    }
    const conSueldos = showGross;
    const jornadas: JornadaPedida[] = contracts
      .filter((c) => c.name.trim() && c.hoursPerWeek > 0)
      .map((c) => {
        const gross = useMinWage
          ? minWageForHours(c.hoursPerWeek, fullHours)
          : c.monthlyGross;
        return {
          nombre: c.name.trim(),
          horas_semana: c.hoursPerWeek,
          dias_semana: c.daysPerWeek,
          ...(conSueldos && gross && gross > 0
            ? {
                costo_hora: Math.max(
                  1,
                  Math.round(costoEmpresaHora(gross, c.hoursPerWeek)),
                ),
              }
            : {}),
          ...(c.maxPeople != null ? { maximo: c.maxPeople } : {}),
        };
      });
    if (jornadas.length === 0) {
      setError("Agrega al menos un contrato con nombre y horas por semana.");
      return;
    }

    setLoading(true);
    try {
      setResult(await pedirMix(curva, jornadas));
      setSent(jornadas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos calcular ahora.");
    }
    setLoading(false);
  };

  const handleEmailSubmit = async (
    email: string,
    nombre: string,
    empresa: string,
  ) => {
    setUserEmail(email);
    setEmailPassed(true);
    if (!result) return;
    const opciones = [
      result.mas_barata &&
        aMixDeCorreo(result.mas_barata, sent, 1, {
          isCheapest: true,
          isOptimal: false,
        }),
      result.menos_personas &&
        aMixDeCorreo(result.menos_personas, sent, 2, {
          isCheapest: false,
          isOptimal: true,
        }),
    ].filter(Boolean);
    const requeridas =
      result.mas_barata?.horas_requeridas ??
      result.menos_personas?.horas_requeridas ??
      0;
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          empresa,
          source: "calculadora-retail",
          calculadora: "Retail",
          sector: "Retail / Servicios",
          hasCosts: result.barata_por === "pesos",
          mixes: opciones,
          resultados: {
            motor: "Kaden CP-SAT",
            requiredHours: requeridas,
            requiredHoursAdjusted: requeridas * replacementFactor,
            fte: requeridas / fullHours,
            fteAdjusted: (requeridas * replacementFactor) / fullHours,
            replacementFactor,
            totalMixes: opciones.length,
            masBarata: opciones[0] ?? null,
            menosPersonas: opciones[1] ?? null,
          },
        }),
      });
    } catch (_) {}
  };

  const d = days[activeDay];
  const conCostos = result?.barata_por === "pesos";
  const mismas =
    result?.mas_barata &&
    result.menos_personas &&
    JSON.stringify(result.mas_barata.personas) ===
      JSON.stringify(result.menos_personas.personas);

  return (
    <div
      className="min-h-screen bg-[#FAFAF7]"
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'DM Mono', monospace; }
      `}</style>

      <SiteNav />

      <div className="border-b border-[#52B788]/20 bg-[#D8F3DC]">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <p className="text-xs text-[#1B4332]">
            <span className="font-semibold">Nuevo:</span> Calculadora SAN
            Hospitalaria — normativa MINSAL
          </p>
          <Link
            href="/san"
            className="text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 transition-colors"
          >
            Ir a SAN{" "}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            ¿Cuánta gente necesitas?
          </h1>
          <p className="text-sm text-slate-500">
            Marca cuántas personas necesitas en cada tramo y qué contratos
            puedes ofrecer. Un optimizador matemático busca cuántas personas de
            cada contrato y a qué hora entra cada una: la opción más barata y la
            de menos personas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* PANEL IZQUIERDO: Demanda */}
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Demanda por día
              </h2>
              <span className="text-xs text-slate-400">
                Arrastra para definir personas por tramo
              </span>
            </div>

            <div className="px-5 pt-4">
              <div className="flex gap-1 flex-wrap">
                {DAY_KEYS.map((k) => {
                  const s = computeStats(days[k].slots);
                  return (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setActiveDay(k)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeDay === k
                          ? "bg-slate-900 text-white"
                          : days[k].open && s.personHours > 0
                            ? "bg-white border border-slate-200 text-slate-700"
                            : days[k].open
                              ? "bg-white border border-dashed border-slate-200 text-slate-500"
                              : "bg-white border border-dashed border-slate-200 text-slate-300"
                      }`}
                    >
                      {DAY_LABELS[k]}
                      {days[k].open && s.personHours > 0 && (
                        <span
                          className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${activeDay === k ? "bg-blue-400" : "bg-emerald-400"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={d.open}
                  onChange={() => updateDay(activeDay, { open: !d.open })}
                />
                <span
                  aria-hidden="true"
                  className={`relative w-9 h-5 rounded-full transition-colors ${d.open ? "bg-blue-600" : "bg-slate-200"}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${d.open ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </span>
                <span className="text-sm text-slate-700 font-medium">
                  {DAY_LABELS[activeDay]} — {d.open ? "abierto" : "cerrado"}
                </span>
              </label>

              {d.open && (
                <>
                  <SlotDemandGrid
                    values={d.slots}
                    onChange={(slots) => updateDay(activeDay, { slots })}
                    maxPeople={10}
                    startHour={0}
                  />
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 shrink-0">
                      Copiar a:
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {DAY_KEYS.filter((k) => k !== activeDay).map((k) => (
                        <button
                          type="button"
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

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs text-slate-500 shrink-0">Semana:</span>
                {DAY_KEYS.map((k) => {
                  const s = computeStats(days[k].slots);
                  return days[k].open && s.personHours > 0 ? (
                    <span
                      key={k}
                      className="text-xs mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {DAY_LABELS[k]}{" "}
                      <span className="font-semibold">{s.personHours}h‑p</span>
                    </span>
                  ) : (
                    <span key={k} className="text-xs text-slate-300">
                      {DAY_LABELS[k]}
                    </span>
                  );
                })}
                {(() => {
                  const t = DAY_KEYS.reduce(
                    (s, k) =>
                      s +
                      (days[k].open
                        ? computeStats(days[k].slots).personHours
                        : 0),
                    0,
                  );
                  return t > 0 ? (
                    <span className="ml-auto text-xs font-semibold mono text-slate-700">
                      {t}h‑p/sem
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          </section>

          {/* PANEL DERECHO */}
          <div className="space-y-6">
            <section className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-700">
                  Configuración
                </h2>
              </div>
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="jornada-completa"
                      className="block text-xs text-slate-500 mb-1.5"
                    >
                      Jornada completa (h/sem)
                    </label>
                    <input
                      id="jornada-completa"
                      type="number"
                      min={20}
                      max={42}
                      step={1}
                      value={fullHours}
                      onChange={(e) =>
                        setFullHours(
                          Math.min(42, parseInt(e.target.value, 10) || 42),
                        )
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      42 h vigente desde el 26-04-2026 (Ley 21.561)
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="factor-reemplazo"
                      className="block text-xs text-slate-500 mb-1.5"
                    >
                      Factor reemplazo
                    </label>
                    <input
                      id="factor-reemplazo"
                      type="number"
                      min={1}
                      max={1.5}
                      step={0.01}
                      value={replacementFactor}
                      onChange={(e) =>
                        setReplacementFactor(parseFloat(e.target.value) || 1.15)
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {((replacementFactor - 1) * 100).toFixed(0)}% para
                      ausencias y vacaciones
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contratos */}
            <section className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700">
                      Contratos que puedes ofrecer
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Horas y días por semana; el optimizador elige qué días y a
                      qué hora
                    </p>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGross}
                      onChange={(e) => setShowGross(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-xs text-slate-500">
                      Agregar sueldos
                    </span>
                  </label>
                </div>
                {showGross && (
                  <div className="mt-3 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useMinWage}
                        onChange={(e) => setUseMinWage(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <span className="text-xs font-medium text-slate-700">
                          Usar sueldo mínimo como referencia
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {fullHours} h → {clpFmt(MIN_WAGE)}/mes. Las jornadas
                          parciales, en proporción.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
              <div className="px-5 py-4 space-y-3">
                {contracts.map((c) => (
                  <ContractRow
                    key={c.id}
                    contract={c}
                    showGross={showGross}
                    useMinWage={useMinWage}
                    fullHours={fullHours}
                    onUpdate={(patch) => updateContract(c.id, patch)}
                    onRemove={() => removeContract(c.id)}
                  />
                ))}
                {contracts.length < 6 && (
                  <button
                    type="button"
                    onClick={addContract}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Agregar contrato
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Calcular */}
        <div className="flex items-center gap-4 py-2">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={loading}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Optimizando…
              </>
            ) : (
              "Calcular dotación"
            )}
          </button>
          <Link
            href="/calculadora/guia"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Ver guía →
          </Link>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {error}
          </p>
        )}

        {result && !emailPassed && <EmailGate onSubmit={handleEmailSubmit} />}

        {result && emailPassed && (
          <section className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Tus opciones
              </h2>
              <span className="text-xs text-slate-400 truncate">
                Enviadas a {userEmail}
              </span>
            </div>

            <div className="px-5 py-5">
              {result.mas_barata || result.menos_personas ? (
                <>
                  <p className="text-xs text-slate-500 mb-4">
                    Operación de {horaTexto(result.apertura)} a{" "}
                    {horaTexto(result.cierre)} ·{" "}
                    {horasFmt(
                      (result.mas_barata ?? result.menos_personas)
                        ?.horas_requeridas ?? 0,
                    )}{" "}
                    horas‑persona por semana (cada hora con lo que pide su tramo
                    más alto).
                  </p>
                  <div
                    className={`grid gap-4 ${mismas ? "" : "md:grid-cols-2"}`}
                  >
                    {result.mas_barata && (
                      <OpcionCard
                        opcion={result.mas_barata}
                        titulo={
                          mismas
                            ? "La más barata y la de menos personas"
                            : "La más barata"
                        }
                        bajada={
                          mismas
                            ? "Con estos contratos, la más barata también es la más chica."
                            : conCostos
                              ? "Menor costo empresa al mes"
                              : "Menos horas contratadas a la semana"
                        }
                        accent={true}
                        conCostos={conCostos}
                        factor={replacementFactor}
                      />
                    )}
                    {result.menos_personas && !mismas && (
                      <OpcionCard
                        opcion={result.menos_personas}
                        titulo="La de menos personas"
                        bajada="Equipo más chico: menos contratos que administrar"
                        accent={false}
                        conCostos={conCostos}
                        factor={replacementFactor}
                      />
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Con estos contratos no hay una combinación que cubra la
                  demanda. Prueba con más días por semana o quitando el máximo
                  de personas de algún contrato.
                </p>
              )}

              <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
                {result.alcance}
              </p>
              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                «Con reemplazos» multiplica la dotación por el factor de
                reemplazo: es una estimación para cubrir ausencias y vacaciones,
                no parte del cálculo optimizado.
              </p>
              {conCostos && (
                <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                  * Costo empresa aproximado: sueldo bruto + SIS 1.49% + mutual
                  promedio 0.93% + seguro de cesantía empleador 2.40%, más el
                  recargo de domingo que usa el optimizador. No incluye
                  gratificaciones legales, bonos, colación ni beneficios
                  adicionales.
                </p>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <a
                  href={URL_LITE}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 hover:border-blue-300 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    Arma los turnos del mes →
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Con Kaden Lite, gratis: la planilla de cada persona,
                    respetando descansos y domingos.
                  </p>
                </a>
                <a
                  href={URL_REVISAR}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 hover:border-blue-300 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    ¿Ya tienes turnos? Revisa si son legales →
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pega tu planilla y te decimos qué no cumple, con el artículo
                    de la ley.
                  </p>
                </a>
                <Link
                  href="/kit-turnos"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 hover:border-blue-300 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    ¿Prefieres Excel? Kit Turnos Legales →
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Planilla que avisa los errores mientras armas, más una guía
                    con la ley de cada regla.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
