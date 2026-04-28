"use client";

import React, { useState, useEffect, useCallback, ReactNode } from "react";

// ─── Constantes legales Chile 2025 ───────────────────────────────────────────
const AFP_RATE           = 0.1045;
const SALUD_RATE         = 0.07;
const CIC_EMPLEADOR_RATE = 0.016;   // 1,6% aporte empleador seguro cesantía
const DIAS_FERIADO_ANUAL = 15;
const TOPE_ANIOS         = 11;
const UF_FALLBACK        = 38200;

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface FormState {
  sueldo:         string;
  anios:          string;
  meses:          string;
  dias:           string;
  causal:         string;
  avisoPrevio:    boolean | null;
  diasVacaciones: string;
  descontarCIC:   boolean | null;  // ¿el empleador descontará la CIC?
}

interface CalcResult {
  indem:       number;
  aviso:       number;
  descAfp:     number;
  descSalud:   number;
  feriado:     number;
  diasAcum:    number;
  descCIC:     number;   // descuento seguro cesantía (imputación)
  bruto:       number;
  descuentos:  number;
  liquido:     number;
}

interface Causal {
  value: string;
  short: string;
  label: string;
  desc:  string;
}

// ─── Datos ────────────────────────────────────────────────────────────────────
const CAUSALES: Causal[] = [
  { value: "161",          short: "Art. 161",      label: "Necesidades de la empresa",  desc: "La empresa te despide por razones económicas o de organización interna." },
  { value: "mutuoAcuerdo", short: "Mutuo acuerdo", label: "Mutuo acuerdo",              desc: "Tú y la empresa acordaron terminar el contrato (art. 159 nº1)." },
  { value: "renuncia",     short: "Renuncia",       label: "Renuncia voluntaria",        desc: "Decidiste irte tú (art. 159 nº2). Solo cobras feriado y días trabajados." },
  { value: "vencimiento",  short: "Vencimiento",    label: "Vencimiento del contrato",   desc: "El plazo del contrato a plazo fijo llegó a su fin (art. 159 nº4)." },
  { value: "160",          short: "Art. 160",       label: "Despido con causa grave",    desc: "La empresa invoca una causal de falta grave. Puedes impugnarla." },
];

// ─── Motivos de reserva disponibles ──────────────────────────────────────────
const MOTIVOS_RESERVA = [
  { id: "despido",    label: "Despido injustificado",        texto: "despido injustificado, indebido o improcedente, junto con el recargo legal correspondiente" },
  { id: "feriado",   label: "Diferencias en feriado",        texto: "diferencias en el cálculo del feriado proporcional" },
  { id: "horas",     label: "Horas extra no pagadas",        texto: "cobro de horas extraordinarias no pagadas" },
  { id: "remuner",   label: "Diferencias en remuneraciones", texto: "diferencias en el cálculo de remuneraciones" },
  { id: "bonos",     label: "Bonos o gratificaciones",       texto: "no pago o diferencias en bonos y gratificaciones legales" },
  { id: "cesantia",  label: "Imputación CIC incorrecta",     texto: "descuento indebido o mal calculado del seguro de cesantía (imputación CIC)" },
];

// ─── Utilidades ───────────────────────────────────────────────────────────────
async function fetchUF(): Promise<number> {
  try {
    const r = await fetch("https://mindicador.cl/api/uf");
    const d = await r.json();
    return (d.serie?.[0]?.valor as number) ?? UF_FALLBACK;
  } catch { return UF_FALLBACK; }
}

function clp(n: number): string {
  return Math.round(n).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function pct(n: number): string { return `${(n * 100).toFixed(2)}%`; }

function calcular(form: FormState, uf: number): CalcResult {
  const sb = Number(form.sueldo)         || 0;
  const a  = Number(form.anios)          || 0;
  const m  = Number(form.meses)          || 0;
  const d  = Number(form.dias)           || 0;
  const dv = Number(form.diasVacaciones) || 0;

  // 1. Indemnización años de servicio
  let indem = 0;
  if (["161", "mutuoAcuerdo"].includes(form.causal)) {
    const base = Math.min(sb, 90 * uf);
    indem = Math.min(a, TOPE_ANIOS) * base;
  }

  // 2. Aviso previo sustitutivo (solo art.161 sin aviso)
  let aviso = 0, descAfp = 0, descSalud = 0;
  if (form.causal === "161" && !form.avisoPrevio) {
    aviso     = sb;
    descAfp   = aviso * AFP_RATE;
    descSalud = aviso * SALUD_RATE;
  }

  // 3. Feriado proporcional
  const diasAcum = (m / 12) * DIAS_FERIADO_ANUAL + (d / 30) * (DIAS_FERIADO_ANUAL / 12) + dv;
  const feriado  = (sb / 30) * diasAcum;

  // 4. Descuento CIC (imputación seguro cesantía, solo art.161 si empleador lo aplica)
  //    Base: sueldo × 1,6% × años cotizados (máx 11)
  let descCIC = 0;
  if (form.causal === "161" && form.descontarCIC === true && indem > 0) {
    const aniosParaCIC = Math.min(a, TOPE_ANIOS);
    descCIC = sb * CIC_EMPLEADOR_RATE * aniosParaCIC;
    // El descuento no puede superar la indemnización
    descCIC = Math.min(descCIC, indem);
  }

  const bruto      = indem + aviso + feriado;
  const descuentos = descAfp + descSalud + descCIC;
  const liquido    = bruto - descuentos;

  return { indem, aviso, descAfp, descSalud, feriado, diasAcum, descCIC, bruto, descuentos, liquido };
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function Pregunta({ numero, titulo, desc, children }: {
  numero: string; titulo: string; desc: string; children: ReactNode;
}) {
  const T1 = "#e8f5e9", T2 = "#8aab96", G = "#3ddc84";
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: G, marginBottom: 16 }}>{numero}</div>
      <h2 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, color: T1, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 12 }}>{titulo}</h2>
      <p style={{ fontSize: 14, color: T2, lineHeight: 1.7, marginBottom: 28 }}>{desc}</p>
      {children}
    </div>
  );
}

function FilaDetalle({ label, sub, monto, negativo }: {
  label: string; sub: string; monto: number; negativo?: boolean;
}) {
  const T1 = "#e8f5e9", T3 = "#5a8070", G = "#3ddc84", B = "#1e3d29";
  return (
    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${B}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: negativo ? "#ff6b6b" : T1, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 11, color: T3, lineHeight: 1.5 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: negativo ? "#ff6b6b" : G, whiteSpace: "nowrap" }}>
        {negativo ? "−" : "+"}{Math.round(Math.abs(monto)).toLocaleString("es-CL")}
      </div>
    </div>
  );
}

function Alerta({ children, color, bg, border }: { children: ReactNode; color: string; bg: string; border: string }) {
  return (
    <div style={{ marginBottom: 14, padding: "14px 16px", background: bg, border: `1.5px solid ${border}`, borderRadius: 10, fontSize: 13, color, lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CalculadoraFiniquito() {
  const G = "#3ddc84", BG = "#0a1f12", C1 = "#0f2b1a", B = "#1e3d29";
  const T1 = "#e8f5e9", T2 = "#8aab96", T3 = "#5a8070", DK = "#07160d";

  const [uf,        setUf]        = useState<number>(UF_FALLBACK);
  const [paso,      setPaso]      = useState<number>(0);
  const [animDir,   setAnimDir]   = useState<string>("forward");
  const [visible,   setVisible]   = useState<boolean>(true);
  const [form,      setForm]      = useState<FormState>({
    sueldo: "", anios: "", meses: "0", dias: "0",
    causal: "161", avisoPrevio: null, diasVacaciones: "", descontarCIC: null,
  });
  const [resultado, setResultado] = useState<CalcResult | null>(null);
  const [lead,      setLead]      = useState<{ nombre: string; email: string }>({ nombre: "", email: "" });
  const [leadOk,    setLeadOk]    = useState<boolean>(false);
  const [err,       setErr]       = useState<string>("");
  const [motivosSeleccionados, setMotivos] = useState<string[]>([]);
  const [mostrarReserva, setMostrarReserva] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);

  useEffect(() => { fetchUF().then(setUf); }, []);

  const setField = useCallback((k: keyof FormState, v: string | boolean | null) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);

  const irA = useCallback((destino: number) => {
    setAnimDir(destino > paso ? "forward" : "back");
    setVisible(false);
    setTimeout(() => { setPaso(destino); setVisible(true); setErr(""); }, 220);
  }, [paso]);

  const validar = useCallback((): string => {
    if (paso === 0 && (!form.sueldo || Number(form.sueldo) < 1)) return "Ingresa tu sueldo bruto mensual.";
    if (paso === 1 && form.anios === "") return "Ingresa los años de servicio (puede ser 0).";
    if (paso === 3 && !form.causal) return "Selecciona la causal de término.";
    if (paso === 4 && form.causal === "161" && form.avisoPrevio === null) return "Indica si la empresa te dio aviso previo.";
    if (paso === 5 && form.causal === "161" && form.descontarCIC === null) return "Indica si el empleador descontará la CIC.";
    return "";
  }, [paso, form]);

  // Total pasos según causal
  const totalPasos = form.causal === "161" ? 6 : 4;

  const siguiente = useCallback(() => {
    const e = validar();
    if (e) { setErr(e); return; }
    setErr("");

    // Saltar paso 4 (aviso) y 5 (CIC) si no es art.161
    if (paso === 3 && form.causal !== "161") {
      setResultado(calcular(form, uf));
      irA(6);
      return;
    }
    if (paso === 4 && form.causal === "161") { irA(5); return; }
    if (paso === 5 && form.causal === "161") {
      setResultado(calcular(form, uf));
      irA(6);
      return;
    }
    irA(paso + 1);
  }, [paso, form, uf, validar, irA]);

  const anterior = useCallback(() => {
    if (paso === 6) { irA(form.causal === "161" ? 5 : 3); return; }
    irA(paso - 1);
  }, [paso, form, irA]);

  const enviarLead = useCallback(async () => {
    if (!lead.nombre || !lead.email) return;
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, source: "calculadora-finiquito" }),
      });
    } catch { /* silencioso */ }
    setLeadOk(true);
  }, [lead]);

  const resetear = useCallback(() => {
    setResultado(null); setLeadOk(false); setMotivos([]); setMostrarReserva(false);
    setForm({ sueldo: "", anios: "", meses: "0", dias: "0", causal: "161", avisoPrevio: null, diasVacaciones: "", descontarCIC: null });
    irA(0);
  }, [irA]);

  const toggleMotivo = (id: string) => {
    setMotivos((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const textoReserva = motivosSeleccionados.length > 0
    ? `"Me reservo el derecho de demandar por ${MOTIVOS_RESERVA.filter(m => motivosSeleccionados.includes(m.id)).map(m => m.texto).join(", ")}."` 
    : "";

  const copiarTexto = () => {
    if (textoReserva) {
      navigator.clipboard.writeText(textoReserva).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500); });
    }
  };

  const progreso  = paso === 6 ? 100 : Math.round((paso / totalPasos) * 100);
  const causalObj = CAUSALES.find((c: Causal) => c.value === form.causal);
  const animClass = visible ? (animDir === "forward" ? "anim-fw" : "anim-bk") : "";

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "14px 18px",
    background: DK, border: `2px solid ${B}`,
    borderRadius: 10, color: T1, fontSize: 22, fontWeight: 700,
    fontFamily: "inherit", outline: "none", transition: "border-color .15s",
  };
  const btnPrimario: React.CSSProperties = {
    width: "100%", padding: "15px", background: G, color: "#0a1f12",
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800,
    cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
  };
  const btnSecundario: React.CSSProperties = {
    background: "transparent", border: `1.5px solid ${B}`,
    color: T2, borderRadius: 8, padding: "10px 20px",
    fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: BG, minHeight: "100vh", padding: "0 0 80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .fq-in:focus{border-color:#3ddc84!important;outline:none}
        .fq-btn-p:hover{opacity:.85}.fq-btn-p:active{transform:scale(.98)}
        .fq-btn-s:hover{border-color:#3ddc84;color:#3ddc84}
        .fq-causal:hover{border-color:#3ddc84!important}
        .fq-causal.sel{border-color:#3ddc84!important;background:#0d2a1a!important}
        .fq-motivo{cursor:pointer;background:#07160d;border:1.5px solid #1e3d29;border-radius:8px;padding:10px 14px;font-size:13px;color:#8aab96;font-family:inherit;text-align:left;transition:all .15s;width:100%}
        .fq-motivo.sel{border-color:#3ddc84;color:#3ddc84;background:#0d2a1a}
        .fq-motivo:hover{border-color:#3ddc84}
        @keyframes fwIn{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
        @keyframes bkIn{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .anim-fw{animation:fwIn .25s ease}
        .anim-bk{animation:bkIn .25s ease}
        .anim-fade{animation:fadeIn .35s ease}
        select option{background:#0f2b1a}
        input[type=number]::-webkit-inner-spin-button{opacity:.3}
      `}</style>

      {/* ── Barra de progreso ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: BG, borderBottom: `1px solid ${B}`, padding: "16px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: G }}>● FINIQUITO</span>
              <span style={{ fontSize: 11, color: T3, letterSpacing: "0.06em" }}>· DOTACIONES.CL</span>
            </div>
            <span style={{ fontSize: 12, color: T3, fontWeight: 500 }}>
              {paso < 6 ? `Paso ${paso + 1} de ${totalPasos}` : "Resultado"}
            </span>
          </div>
          <div style={{ height: 4, background: B, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progreso}%`, background: G, borderRadius: 99, transition: "width .4s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "52px 24px 0" }}>

        {/* ── Pasos ── */}
        {paso < 6 && (
          <div className={animClass}>

            {/* Paso 0 — Sueldo */}
            {paso === 0 && (
              <Pregunta numero="01" titulo="¿Cuál es tu sueldo base mensual bruto?" desc="El monto antes de que te descuenten AFP, salud e impuestos. Lo encuentras en tu liquidación.">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 22, fontWeight: 700, color: T3 }}>$</span>
                  <input className="fq-in" type="number" placeholder="850000" value={form.sueldo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("sueldo", e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && siguiente()}
                    style={{ ...inputBase, paddingLeft: 42 }} autoFocus />
                </div>
                <p style={{ fontSize: 12, color: T3, marginTop: 10 }}>
                  UF de referencia: ${uf.toLocaleString("es-CL")} (actualizada automáticamente)
                </p>
              </Pregunta>
            )}

            {/* Paso 1 — Antigüedad */}
            {paso === 1 && (
              <Pregunta numero="02" titulo="¿Cuánto tiempo llevas en la empresa?" desc="La indemnización depende directamente de tu antigüedad. El tope legal es 11 años.">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {([ { k: "anios" as keyof FormState, label: "AÑOS" }, { k: "meses" as keyof FormState, label: "MESES" }, { k: "dias" as keyof FormState, label: "DÍAS" } ] as Array<{ k: keyof FormState; label: string }>).map(({ k, label }) => (
                    <div key={k}>
                      <p style={{ fontSize: 11, color: T3, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 8 }}>{label}</p>
                      <input className="fq-in" type="number" placeholder="0" min="0" value={form[k] as string}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField(k, e.target.value)}
                        style={{ ...inputBase, fontSize: 26, textAlign: "center" }} />
                    </div>
                  ))}
                </div>
                {Number(form.anios) >= TOPE_ANIOS && (
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#1a1200", border: "1.5px solid #3d2d00", borderRadius: 8, fontSize: 12, color: "#c8a84b", lineHeight: 1.6 }}>
                    Tope de {TOPE_ANIOS} remuneraciones — aplicaremos ese máximo.
                  </div>
                )}
              </Pregunta>
            )}

            {/* Paso 2 — Vacaciones */}
            {paso === 2 && (
              <Pregunta numero="03" titulo="¿Tienes días de vacaciones sin tomar?" desc="Si no los sabes, déjalo en blanco y estimamos según tu antigüedad.">
                <input className="fq-in" type="number" placeholder="Ej: 5" min="0" value={form.diasVacaciones}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("diasVacaciones", e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && siguiente()}
                  style={inputBase} />
                <p style={{ fontSize: 12, color: T3, marginTop: 10 }}>
                  Estimamos <strong style={{ color: G }}>
                    {((Number(form.meses) / 12) * DIAS_FERIADO_ANUAL + (Number(form.dias) / 30) * (DIAS_FERIADO_ANUAL / 12)).toFixed(1)} días
                  </strong> acumulados en el año en curso.
                </p>
              </Pregunta>
            )}

            {/* Paso 3 — Causal */}
            {paso === 3 && (
              <Pregunta numero="04" titulo="¿Por qué termina el contrato?" desc="La causal debería estar en tu carta de aviso o en el finiquito.">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {CAUSALES.map((c: Causal) => (
                    <button key={c.value} type="button"
                      className={`fq-causal${form.causal === c.value ? " sel" : ""}`}
                      onClick={() => setField("causal", c.value)}
                      style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px",
                        background: form.causal === c.value ? "#0d2a1a" : DK,
                        border: `1.5px solid ${form.causal === c.value ? G : B}`,
                        borderRadius: 10, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                        transition: "border-color .15s, background .15s" }}>
                      <div style={{ minWidth: 42, height: 42, borderRadius: 8,
                        background: form.causal === c.value ? "#1a4a2a" : "#0f2216",
                        border: `1px solid ${form.causal === c.value ? G : B}`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                        color: form.causal === c.value ? G : T3, flexShrink: 0 }}>
                        {c.short.split(" ").map((w: string, i: number) => <span key={i} style={{ display: "block", lineHeight: 1.2 }}>{w}</span>)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: form.causal === c.value ? G : T1, marginBottom: 3 }}>{c.label}</div>
                        <div style={{ fontSize: 12, color: T3, lineHeight: 1.5 }}>{c.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Pregunta>
            )}

            {/* Paso 4 — Aviso previo (solo art.161) */}
            {paso === 4 && form.causal === "161" && (
              <Pregunta numero="05" titulo="¿La empresa te avisó con 30 días de anticipación?" desc="Si no te dieron aviso previo escrito con 30 días, corresponde un mes de sueldo adicional.">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {([ { val: false, label: "No me avisaron", sub: "Corresponde 1 mes extra", path: "M10 3v14M6 7l4-4 4 4" }, { val: true, label: "Sí, me avisaron", sub: "30 días de anticipación", path: "M4 10l4 4 8-8" } ] as Array<{ val: boolean; label: string; sub: string; path: string }>).map(({ val, label, sub, path }) => (
                    <button key={String(val)} type="button" onClick={() => setField("avisoPrevio", val)}
                      style={{ padding: "20px 16px", background: form.avisoPrevio === val ? "#0d2a1a" : DK,
                        border: `2px solid ${form.avisoPrevio === val ? G : B}`,
                        borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "all .15s" }}>
                      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke={form.avisoPrevio === val ? G : T3} strokeWidth="1.8" style={{ marginBottom: 10, display: "block", margin: "0 auto 10px" }}><path d={path} /></svg>
                      <div style={{ fontSize: 14, fontWeight: 700, color: form.avisoPrevio === val ? G : T1, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 11, color: T3 }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </Pregunta>
            )}

            {/* Paso 5 — Descuento CIC (solo art.161) */}
            {paso === 5 && form.causal === "161" && (
              <Pregunta numero="06" titulo="¿El empleador descontará tu seguro de cesantía (CIC)?" desc="Por ley, en despidos art. 161 el empleador puede descontar de tu indemnización el 1,6% que él aportó a tu Cuenta Individual de Cesantía.">
                <div style={{ padding: "14px 16px", background: "#0d1a0a", border: `1px solid ${B}`, borderRadius: 10, fontSize: 13, color: T3, lineHeight: 1.7, marginBottom: 20 }}>
                  <strong style={{ color: T2 }}>¿Cuándo es legal?</strong> Solo en despidos por art. 161 (necesidades de la empresa). Si la causal fuera otra o hay error en el cálculo, puedes impugnar el descuento con reserva de derechos.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {([ { val: true, label: "Sí, lo descontarán", sub: `≈ ${clp(Number(form.sueldo) * CIC_EMPLEADOR_RATE * Math.min(Number(form.anios), TOPE_ANIOS))} estimado` },
                     { val: false, label: "No, no aplicará", sub: "No harán imputación CIC" } ] as Array<{ val: boolean; label: string; sub: string }>).map(({ val, label, sub }) => (
                    <button key={String(val)} type="button" onClick={() => setField("descontarCIC", val)}
                      style={{ padding: "20px 16px", background: form.descontarCIC === val ? "#0d2a1a" : DK,
                        border: `2px solid ${form.descontarCIC === val ? G : B}`,
                        borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "all .15s" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: form.descontarCIC === val ? G : T1, marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 11, color: T3 }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </Pregunta>
            )}

            {/* Navegación */}
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              {err && <p style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center" }}>{err}</p>}
              <button className="fq-btn-p" type="button" onClick={siguiente} style={btnPrimario}>
                {(paso === 5) || (paso === 3 && form.causal !== "161") ? "Ver mi finiquito →" : "Siguiente →"}
              </button>
              {paso > 0 && (
                <button className="fq-btn-s" type="button" onClick={anterior} style={{ ...btnSecundario, alignSelf: "center" }}>
                  ← Volver
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Resultado ── */}
        {paso === 6 && resultado && (
          <div className="anim-fade">

            {/* Total */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: G, marginBottom: 16 }}>RESULTADO DEL CÁLCULO</div>
              <div style={{ fontSize: 13, color: T3, marginBottom: 8 }}>Estimación total que te corresponde</div>
              <div style={{ fontSize: "clamp(44px,8vw,64px)", fontWeight: 800, color: G, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {clp(resultado.liquido)}
              </div>
              <div style={{ fontSize: 13, color: T3, marginTop: 12 }}>
                Causal: <strong style={{ color: T2 }}>{causalObj?.label}</strong>
                {" · "}Sueldo: <strong style={{ color: T2 }}>{clp(Number(form.sueldo))}</strong>
              </div>
            </div>

            {/* Desglose */}
            <div style={{ background: C1, border: `1.5px solid ${B}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: T3 }}>DESGLOSE ÍTEM POR ÍTEM</span>
              </div>
              <div style={{ padding: "4px 0" }}>
                {resultado.indem > 0 && (
                  <FilaDetalle label="Indemnización por años de servicio"
                    sub={`${Math.min(Number(form.anios), TOPE_ANIOS)} año(s) × ${clp(Math.min(Number(form.sueldo), 90 * uf))}`}
                    monto={resultado.indem} />
                )}
                {resultado.aviso > 0 && (
                  <FilaDetalle label="Aviso previo sustitutivo"
                    sub="Empresa no dio aviso de 30 días (art. 161)"
                    monto={resultado.aviso} />
                )}
                <FilaDetalle label="Feriado proporcional"
                  sub={`${resultado.diasAcum.toFixed(1)} días acumulados`}
                  monto={resultado.feriado} />
                {resultado.descAfp > 0 && (
                  <FilaDetalle label="Descuento AFP" sub={`${pct(AFP_RATE)} sobre aviso previo`} monto={resultado.descAfp} negativo />
                )}
                {resultado.descSalud > 0 && (
                  <FilaDetalle label="Descuento salud" sub={`${pct(SALUD_RATE)} sobre aviso previo`} monto={resultado.descSalud} negativo />
                )}
                {resultado.descCIC > 0 && (
                  <FilaDetalle label="Imputación seguro de cesantía (CIC)"
                    sub={`${pct(CIC_EMPLEADOR_RATE)} × ${Math.min(Number(form.anios), TOPE_ANIOS)} años · aporte empleador descontado de indemnización`}
                    monto={resultado.descCIC} negativo />
                )}
              </div>
              <div style={{ padding: "16px 20px", borderTop: `1px solid ${B}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: T3, marginBottom: 4 }}>Bruto</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T2 }}>{clp(resultado.bruto)}</div>
                </div>
                {resultado.descuentos > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#ff6b6b", marginBottom: 4 }}>Total descuentos</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#ff6b6b" }}>−{clp(resultado.descuentos)}</div>
                  </div>
                )}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: T3, marginBottom: 4 }}>Líquido estimado</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: G }}>{clp(resultado.liquido)}</div>
                </div>
              </div>
            </div>

            {/* Alertas contextuales */}
            {form.causal === "160" && (
              <Alerta color="#c8a84b" bg="#1a1200" border="#3d2d00">
                <strong>Art. 160 — despido con causa grave:</strong> el empleador argumenta que no corresponde indemnización.
                Si crees que la causal es falsa, tienes <strong>60 días hábiles</strong> para impugnarla. La carga de la prueba es del empleador.
              </Alerta>
            )}
            {form.causal === "renuncia" && (
              <Alerta color="#c8a84b" bg="#1a1200" border="#3d2d00">
                <strong>Renuncia voluntaria:</strong> no corresponde indemnización por años de servicio. Si te presionaron a renunciar, puede configurarse un despido indirecto — consulta con un abogado.
              </Alerta>
            )}
            {Number(form.anios) > TOPE_ANIOS && (
              <Alerta color="#c8a84b" bg="#1a1200" border="#3d2d00">
                <strong>Tope legal:</strong> máximo {TOPE_ANIOS} remuneraciones (art. 163 CT).
              </Alerta>
            )}
            {resultado.descCIC > 0 && (
              <Alerta color="#8aab96" bg="#071a10" border="#1e3d29">
                <strong>Sobre la imputación CIC:</strong> el empleador puede descontar el aporte que él hizo a tu seguro de cesantía (1,6%), más su rentabilidad. Si crees que el cálculo es incorrecto o la causal no corresponde, inclúyelo en tu reserva de derechos al firmar.
              </Alerta>
            )}

            {/* ── RESERVA DE DERECHOS ── */}
            <div style={{ background: "#071a10", border: `1.5px solid #1e5a35`, borderRadius: 14, padding: "22px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: G }}>Reserva de derechos</div>
                <button type="button" onClick={() => setMostrarReserva(!mostrarReserva)}
                  style={{ background: "transparent", border: `1px solid #1e5a35`, borderRadius: 6, color: G, fontSize: 11, fontWeight: 700, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                  {mostrarReserva ? "Cerrar" : "Generar texto →"}
                </button>
              </div>
              <p style={{ fontSize: 12, color: T3, lineHeight: 1.6, marginBottom: mostrarReserva ? 20 : 0 }}>
                Escrita de puño y letra en el finiquito (en las 3 copias), antes de firmar ante el ministro de fe. Te permite cobrar y aún así demandar por los conceptos que indiques.
              </p>

              {mostrarReserva && (
                <div>
                  <p style={{ fontSize: 12, color: T2, lineHeight: 1.6, marginBottom: 16 }}>
                    Selecciona los conceptos que quieres reclamar:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {MOTIVOS_RESERVA.map((m) => (
                      <button key={m.id} type="button"
                        className={`fq-motivo${motivosSeleccionados.includes(m.id) ? " sel" : ""}`}
                        onClick={() => toggleMotivo(m.id)}>
                        <span style={{ marginRight: 8 }}>{motivosSeleccionados.includes(m.id) ? "✓" : "○"}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {textoReserva && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: T3, marginBottom: 10 }}>TEXTO GENERADO — COPIA ESTO EN EL FINIQUITO:</p>
                      <div style={{ background: "#07160d", border: `1.5px solid ${G}`, borderRadius: 10, padding: "16px 18px", marginBottom: 14 }}>
                        <p style={{ fontSize: 14, color: G, fontStyle: "italic", lineHeight: 1.7 }}>{textoReserva}</p>
                      </div>
                      <button type="button" onClick={copiarTexto}
                        style={{ ...btnPrimario, fontSize: 13, padding: "11px 0", marginBottom: 14 }}>
                        {copiado ? "✓ Copiado" : "Copiar texto"}
                      </button>
                      <div style={{ background: "#1a1200", border: "1.5px solid #3d2d00", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#c8a84b", marginBottom: 8 }}>⚠ Cómo y dónde escribirla</div>
                        <ul style={{ fontSize: 12, color: "#c8a84b", lineHeight: 1.8, paddingLeft: 16 }}>
                          <li>Escríbela <strong>en el anverso</strong> del finiquito, cerca de tu firma. No al reverso.</li>
                          <li>Debe estar en <strong>las 3 copias</strong> del documento.</li>
                          <li>Hazlo <strong>antes de firmar</strong> ante el notario o ministro de fe.</li>
                          <li>Sé específico/a: las frases genéricas como "me reservo derechos" pueden no ser válidas en tribunales.</li>
                          <li>El empleador <strong>no puede negarse</strong> a pagar los montos no disputados aunque incluyas la reserva.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: 11, color: "#3a5a48", marginTop: 14, lineHeight: 1.6 }}>
                    Se recomienda asesorarse con un abogado laboral para redactar la reserva adecuadamente, especialmente en casos de despido injustificado o montos disputados.
                  </p>
                </div>
              )}
            </div>

            {/* Lead capture */}
            {!leadOk ? (
              <div style={{ background: C1, border: `1.5px solid ${B}`, borderRadius: 14, padding: "22px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T1, marginBottom: 4 }}>¿Quieres este desglose en tu correo?</div>
                <div style={{ fontSize: 13, color: T3, marginBottom: 16 }}>Resumen + guía de qué revisar antes de firmar. Sin spam.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <input className="fq-in" placeholder="Tu nombre" value={lead.nombre}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLead((p) => ({ ...p, nombre: e.target.value }))}
                    style={{ padding: "11px 14px", background: DK, border: `1.5px solid ${B}`, borderRadius: 8, color: T1, fontSize: 14, fontFamily: "inherit" }} />
                  <input className="fq-in" type="email" placeholder="Tu correo" value={lead.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLead((p) => ({ ...p, email: e.target.value }))}
                    style={{ padding: "11px 14px", background: DK, border: `1.5px solid ${B}`, borderRadius: 8, color: T1, fontSize: 14, fontFamily: "inherit" }} />
                </div>
                <button className="fq-btn-p" type="button" onClick={enviarLead} style={{ ...btnPrimario, fontSize: 14 }}>
                  Enviar resumen gratis
                </button>
              </div>
            ) : (
              <div style={{ background: C1, border: `1.5px solid ${B}`, borderRadius: 14, padding: "28px 20px", textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 28, color: G, marginBottom: 10 }}>✓</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T1, marginBottom: 6 }}>¡Listo, {lead.nombre}!</div>
                <div style={{ fontSize: 13, color: T3 }}>Revisa <strong style={{ color: T2 }}>{lead.email}</strong></div>
              </div>
            )}

            <button className="fq-btn-s" type="button" onClick={resetear}
              style={{ ...btnSecundario, width: "100%", padding: "13px", marginBottom: 12 }}>
              Hacer un nuevo cálculo
            </button>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: T3, marginTop: 40, lineHeight: 1.8 }}>
          UF: ${uf.toLocaleString("es-CL")} · Código del Trabajo Chile · Actualizado abril 2026 ·{" "}
          <a href="https://dotaciones.cl" style={{ color: G, textDecoration: "none" }}>dotaciones.cl</a>
        </p>
      </div>
    </div>
  );
}