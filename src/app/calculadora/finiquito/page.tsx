"use client";
import React from "react";
import { useState, useEffect, useCallback } from "react";

// ── Constantes ────────────────────────────────────────────────────────────────
const AFP_RATE   = 0.1045;
const SALUD_RATE = 0.07;
const DIAS_FERIADO_ANUAL = 15;
const TOPE_ANIOS = 11;
const UF_FALLBACK = 38200;

// ── Fetch UF desde mindicador.cl ──────────────────────────────────────────────
async function fetchUF() {
  try {
    const r = await fetch("https://mindicador.cl/api/uf");
    const d = await r.json();
    return d.serie?.[0]?.valor ?? UF_FALLBACK;
  } catch {
    return UF_FALLBACK;
  }
}

// ── Motor de cálculo ──────────────────────────────────────────────────────────
interface CalcInput { sueldo:string; anios:string; meses:string; dias:string; causal:string; avisoPrevio:boolean|null; diasVacaciones:string; uf:number }
function calcular({ sueldo, anios, meses, dias, causal, avisoPrevio, diasVacaciones, uf }:CalcInput) {
  const sb = Number(sueldo) || 0;
  const a  = Number(anios)  || 0;
  const m  = Number(meses)  || 0;
  const d  = Number(dias)   || 0;
  const dv = Number(diasVacaciones) || 0;

  // 1) Indemnización por años
  let indem = 0;
  if (["161","mutuoAcuerdo"].includes(causal)) {
    const topeUF  = 90 * uf;
    const base    = Math.min(sb, topeUF);
    indem = Math.min(a, TOPE_ANIOS) * base;
  }

  // 2) Aviso previo sustitutivo (solo art.161 sin aviso)
  let aviso = 0, descAfp = 0, descSalud = 0;
  if (causal === "161" && !avisoPrevio) {
    aviso     = sb;
    descAfp   = aviso * AFP_RATE;
    descSalud = aviso * SALUD_RATE;
  }

  // 3) Feriado proporcional — días acumulados en año + pendientes ingresados
  const diasAcum = (m / 12) * DIAS_FERIADO_ANUAL + (d / 30) * (DIAS_FERIADO_ANUAL / 12) + dv;
  const feriado  = (sb / 30) * diasAcum;

  const bruto      = indem + aviso + feriado;
  const descuentos = descAfp + descSalud;
  const liquido    = bruto - descuentos;

  return { indem, aviso, descAfp, descSalud, feriado, diasAcum, bruto, descuentos, liquido };
}

// ── Formateadores ─────────────────────────────────────────────────────────────
const clp = (n: number) => Math.round(n).toLocaleString("es-CL", { style:"currency", currency:"CLP", maximumFractionDigits:0 });
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

// ── Pasos del wizard ──────────────────────────────────────────────────────────
const CAUSALES = [
  { value:"161",         short:"Art. 161",       label:"Necesidades de la empresa",     desc:"La empresa te despide por razones económicas o de organización interna." },
  { value:"mutuoAcuerdo",short:"Mutuo acuerdo",  label:"Mutuo acuerdo",                 desc:"Tú y la empresa acordaron terminar el contrato (art. 159 nº1)." },
  { value:"renuncia",    short:"Renuncia",        label:"Renuncia voluntaria",           desc:"Decidiste irte tú (art. 159 nº2). Solo cobras feriado y días trabajados." },
  { value:"vencimiento", short:"Vencimiento",     label:"Vencimiento del contrato",      desc:"El plazo del contrato a plazo fijo llegó a su fin (art. 159 nº4)." },
  { value:"160",         short:"Art. 160",        label:"Despido con causa grave",       desc:"La empresa invoca una causal de falta grave. Puedes impugnarla en tribunales." },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function CalculadoraFiniquito() {
  const [uf, setUf]               = useState(UF_FALLBACK);
  const [paso, setPaso]           = useState(0);
  const [animDir, setAnimDir]     = useState("forward");
  const [visible, setVisible]     = useState(true);
  const [form, setForm]           = useState({
    sueldo:"", anios:"", meses:"0", dias:"0",
    causal:"161", avisoPrevio:null, diasVacaciones:"",
  });
  const [resultado, setResultado] = useState(null);
  const [lead, setLead]           = useState({ nombre:"", email:"" });
  const [leadOk, setLeadOk]       = useState(false);
  const [err, setErr]             = useState("");

  useEffect(() => { fetchUF().then(setUf); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const irA = useCallback((destino) => {
    setAnimDir(destino > paso ? "forward" : "back");
    setVisible(false);
    setTimeout(() => {
      setPaso(destino);
      setVisible(true);
      setErr("");
    }, 220);
  }, [paso]);

  const validar = useCallback(() => {
    if (paso === 0 && (!form.sueldo || Number(form.sueldo) < 1))
      return "Ingresa tu sueldo bruto mensual.";
    if (paso === 1 && form.anios === "")
      return "Ingresa cuántos años llevas en la empresa (puede ser 0).";
    if (paso === 3 && !form.causal)
      return "Selecciona la causal de término.";
    if (paso === 4 && form.causal === "161" && form.avisoPrevio === null)
      return "Indica si la empresa te avisó con 30 días de anticipación.";
    return "";
  }, [paso, form]);

  const siguiente = useCallback(() => {
    const e = validar();
    if (e) { setErr(e); return; }
    setErr("");

    // Saltar paso 4 si no es art.161
    if (paso === 3 && form.causal !== "161") {
      const r = calcular({ ...form, uf });
      setResultado(r);
      irA(5); // resultado directo
      return;
    }
    if (paso === 4) {
      const r = calcular({ ...form, uf });
      setResultado(r);
      irA(5);
      return;
    }
    irA(paso + 1);
  }, [paso, form, uf, validar, irA]);

  const anterior = useCallback(() => {
    if (paso === 5) { irA(form.causal === "161" ? 4 : 3); return; }
    irA(paso - 1);
  }, [paso, form, irA]);

  const enviarLead = async () => {
    if (!lead.nombre || !lead.email) return;
    try {
      await fetch("/api/leads", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ ...lead, source:"calculadora-finiquito" }),
      });
    } catch (_) {}
    setLeadOk(true);
  };

  const totalPasos = 5;
  const progreso   = paso === 5 ? 100 : Math.round((paso / totalPasos) * 100);
  const causalObj  = CAUSALES.find(c => c.value === form.causal);

  // ── Colores brand ─────────────────────────────────────────────────────────
  const G  = "#3ddc84";   // verde neón
  const BG = "#0a1f12";   // fondo
  const C1 = "#0f2b1a";   // card
  const B  = "#1e3d29";   // border
  const T1 = "#e8f5e9";   // texto primario
  const T2 = "#8aab96";   // texto secundario
  const T3 = "#5a8070";   // texto terciario
  const DK = "#07160d";   // input bg

  // ── Estilos compartidos ───────────────────────────────────────────────────
  const inputSt = {
    width:"100%", padding:"14px 18px",
    background:DK, border:`2px solid ${B}`,
    borderRadius:10, color:T1,
    fontSize:22, fontWeight:700,
    fontFamily:"inherit", outline:"none",
    transition:"border-color .15s",
  };
  const btnPrimario = {
    width:"100%", padding:"15px",
    background:G, color:"#0a1f12",
    border:"none", borderRadius:10,
    fontSize:15, fontWeight:800,
    cursor:"pointer", fontFamily:"inherit",
    letterSpacing:"-0.01em",
    transition:"opacity .15s",
  };
  const btnSecundario = {
    background:"transparent", border:`1.5px solid ${B}`,
    color:T2, borderRadius:8, padding:"10px 20px",
    fontSize:13, fontWeight:500, cursor:"pointer",
    fontFamily:"inherit",
  };

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background:BG, minHeight:"100vh", padding:"0 0 80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .fq-in:focus{border-color:#3ddc84 !important;outline:none}
        .fq-btn-p:hover{opacity:.85} .fq-btn-p:active{transform:scale(.98)}
        .fq-btn-s:hover{border-color:#3ddc84;color:#3ddc84}
        .fq-causal:hover{border-color:#3ddc84 !important}
        .fq-causal.sel{border-color:#3ddc84 !important;background:#0d2a1a !important}
        .fq-tog button:hover{color:#e8f5e9}
        @keyframes fwIn{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
        @keyframes bkIn{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .anim-fw{animation:fwIn .25s ease}
        .anim-bk{animation:bkIn .25s ease}
        .anim-fade{animation:fadeIn .35s ease}
        select option{background:#0f2b1a}
        input[type=number]::-webkit-inner-spin-button{opacity:.3}
      `}</style>

      {/* ── Barra de progreso ─────────────────────────────────────────────── */}
      <div style={{ position:"sticky", top:0, zIndex:10, background:BG, borderBottom:`1px solid ${B}`, padding:"16px 24px" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.12em", color:G }}>● FINIQUITO</span>
              <span style={{ fontSize:11, color:T3, letterSpacing:"0.06em" }}>· DOTACIONES.CL</span>
            </div>
            <span style={{ fontSize:12, color:T3, fontWeight:500 }}>
              {paso < 5 ? `Paso ${paso + 1} de ${totalPasos}` : "Resultado"}
            </span>
          </div>
          <div style={{ height:4, background:B, borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progreso}%`, background:G, borderRadius:99, transition:"width .4s ease" }} />
          </div>
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:640, margin:"0 auto", padding:"52px 24px 0" }}>

        {/* ─── PASOS 0–4 ──────────────────────────────────────────────────── */}
        {paso < 5 && (
          <div className={visible ? (animDir === "forward" ? "anim-fw" : "anim-bk") : ""}>

            {/* Paso 0 — Sueldo */}
            {paso === 0 && (
              <Pregunta
                numero="01" titulo="¿Cuál es tu sueldo base mensual bruto?"
                desc="Es el monto antes de que te descuenten AFP, salud e impuestos. Lo encuentras en tu liquidación de sueldo."
                t1={T1} t2={T2} t3={T3} g={G}
              >
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:18, top:"50%", transform:"translateY(-50%)", fontSize:22, fontWeight:700, color:T3 }}>$</span>
                  <input className="fq-in" type="number" placeholder="850.000"
                    value={form.sueldo} onChange={e => set("sueldo", e.target.value)}
                    style={{ ...inputSt, paddingLeft:42 }}
                    onKeyDown={e => e.key === "Enter" && siguiente()}
                    autoFocus
                  />
                </div>
                <p style={{ fontSize:12, color:T3, marginTop:10 }}>UF de referencia: ${uf.toLocaleString("es-CL")} (actualizada automáticamente)</p>
              </Pregunta>
            )}

            {/* Paso 1 — Antigüedad */}
            {paso === 1 && (
              <Pregunta
                numero="02" titulo="¿Cuánto tiempo llevas en la empresa?"
                desc="La indemnización por años de servicio depende directamente de tu antigüedad. El tope legal es 11 años."
                t1={T1} t2={T2} t3={T3} g={G}
              >
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  {[
                    { k:"anios", ph:"0", label:"Años" },
                    { k:"meses", ph:"0", label:"Meses" },
                    { k:"dias",  ph:"0", label:"Días" },
                  ].map(({ k, ph, label }) => (
                    <div key={k}>
                      <p style={{ fontSize:11, color:T3, fontWeight:600, letterSpacing:"0.08em", marginBottom:8 }}>{label.toUpperCase()}</p>
                      <input className="fq-in" type="number" placeholder={ph} min="0"
                        value={form[k]} onChange={e => set(k, e.target.value)}
                        style={{ ...inputSt, fontSize:26, textAlign:"center" }}
                      />
                    </div>
                  ))}
                </div>
                {Number(form.anios) >= TOPE_ANIOS && (
                  <div style={{ marginTop:14, padding:"10px 14px", background:"#1a1200", border:"1.5px solid #3d2d00", borderRadius:8, fontSize:12, color:"#c8a84b", lineHeight:1.6 }}>
                    La ley establece un tope de {TOPE_ANIOS} remuneraciones — aplicaremos ese máximo.
                  </div>
                )}
              </Pregunta>
            )}

            {/* Paso 2 — Vacaciones */}
            {paso === 2 && (
              <Pregunta
                numero="03" titulo="¿Tienes días de vacaciones sin tomar?"
                desc="Si no los sabes exactamente, déjalo en blanco y estimamos los días acumulados según tu antigüedad."
                t1={T1} t2={T2} t3={T3} g={G}
              >
                <input className="fq-in" type="number" placeholder="Ej: 5" min="0"
                  value={form.diasVacaciones} onChange={e => set("diasVacaciones", e.target.value)}
                  style={{ ...inputSt }}
                  onKeyDown={e => e.key === "Enter" && siguiente()}
                />
                <p style={{ fontSize:12, color:T3, marginTop:10 }}>
                  Con {form.anios || "0"} años y {form.meses || "0"} meses, estimamos{" "}
                  <strong style={{ color:G }}>
                    {((Number(form.meses)/12)*DIAS_FERIADO_ANUAL + (Number(form.dias)/30)*(DIAS_FERIADO_ANUAL/12)).toFixed(1)} días
                  </strong>{" "}
                  acumulados en el año en curso.
                </p>
              </Pregunta>
            )}

            {/* Paso 3 — Causal */}
            {paso === 3 && (
              <Pregunta
                numero="04" titulo="¿Por qué termina el contrato?"
                desc="La causal es el artículo del Código del Trabajo que usa la empresa para justificar el despido. Debería estar en tu carta de aviso."
                t1={T1} t2={T2} t3={T3} g={G}
              >
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {CAUSALES.map(c => (
                    <button key={c.value} type="button"
                      className={`fq-causal${form.causal === c.value ? " sel" : ""}`}
                      onClick={() => set("causal", c.value)}
                      style={{
                        display:"flex", alignItems:"flex-start", gap:14,
                        padding:"14px 16px",
                        background: form.causal === c.value ? "#0d2a1a" : DK,
                        border:`1.5px solid ${form.causal === c.value ? G : B}`,
                        borderRadius:10, cursor:"pointer",
                        textAlign:"left", fontFamily:"inherit",
                        transition:"border-color .15s, background .15s",
                      }}
                    >
                      <div style={{
                        minWidth:42, height:42, borderRadius:8,
                        background: form.causal === c.value ? "#1a4a2a" : "#0f2216",
                        border:`1px solid ${form.causal === c.value ? G : B}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:10, fontWeight:800, letterSpacing:"0.06em",
                        color: form.causal === c.value ? G : T3,
                        flexShrink:0,
                      }}>
                        {c.short.split(" ").map((w,i) => <span key={i} style={{ display:"block", lineHeight:1.2 }}>{w}</span>)}
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:form.causal === c.value ? G : T1, marginBottom:3 }}>{c.label}</div>
                        <div style={{ fontSize:12, color:T3, lineHeight:1.5 }}>{c.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Pregunta>
            )}

            {/* Paso 4 — Aviso previo (solo art.161) */}
            {paso === 4 && form.causal === "161" && (
              <Pregunta
                numero="05" titulo="¿La empresa te avisó con 30 días de anticipación?"
                desc="Por ley, si no te dieron aviso previo escrito con 30 días de anticipación, corresponde un mes de sueldo adicional como compensación."
                t1={T1} t2={T2} t3={T3} g={G}
              >
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {[
                    { val:false, label:"No me avisaron", sub:"Corresponde 1 mes extra", icon:"M10 3v14M6 7l4-4 4 4" },
                    { val:true,  label:"Sí, me avisaron", sub:"30 días de anticipación", icon:"M4 10l4 4 8-8" },
                  ].map(({ val, label, sub, icon }) => (
                    <button key={String(val)} type="button"
                      onClick={() => set("avisoPrevio", val)}
                      style={{
                        padding:"20px 16px",
                        background: form.avisoPrevio === val ? "#0d2a1a" : DK,
                        border:`2px solid ${form.avisoPrevio === val ? G : B}`,
                        borderRadius:12, cursor:"pointer",
                        fontFamily:"inherit", textAlign:"center",
                        transition:"all .15s",
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke={form.avisoPrevio === val ? G : T3} strokeWidth="1.8" style={{ marginBottom:10 }}>
                        <path d={icon} />
                      </svg>
                      <div style={{ fontSize:14, fontWeight:700, color:form.avisoPrevio === val ? G : T1, marginBottom:4 }}>{label}</div>
                      <div style={{ fontSize:11, color:T3 }}>{sub}</div>
                    </button>
                  ))}
                </div>
                {form.avisoPrevio === false && (
                  <div style={{ marginTop:14, padding:"12px 16px", background:"#0d2a1a", border:`1px solid ${G}`, borderRadius:8, fontSize:13, color:G, lineHeight:1.6 }}>
                    Se agregará <strong>{clp(Number(form.sueldo))}</strong> como aviso previo sustitutivo.
                  </div>
                )}
              </Pregunta>
            )}

            {/* Navegación */}
            <div style={{ marginTop:32, display:"flex", flexDirection:"column", gap:12 }}>
              {err && <p style={{ color:"#ff6b6b", fontSize:13, textAlign:"center" }}>{err}</p>}
              <button className="fq-btn-p" type="button" onClick={siguiente} style={btnPrimario}>
                {paso === 4 || (paso === 3 && form.causal !== "161") ? "Ver mi finiquito →" : "Siguiente →"}
              </button>
              {paso > 0 && (
                <button className="fq-btn-s" type="button" onClick={anterior} style={{ ...btnSecundario, alignSelf:"center" }}>
                  ← Volver
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── RESULTADO ──────────────────────────────────────────────────── */}
        {paso === 5 && resultado && (
          <div className="anim-fade">

            {/* Encabezado resultado */}
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:G, marginBottom:16 }}>RESULTADO DEL CÁLCULO</div>
              <div style={{ fontSize:13, color:T3, marginBottom:8 }}>Estimación total que te corresponde</div>
              <div style={{ fontSize:"clamp(44px,8vw,64px)", fontWeight:800, color:G, letterSpacing:"-0.03em", lineHeight:1 }}>
                {clp(resultado.liquido)}
              </div>
              <div style={{ fontSize:13, color:T3, marginTop:12 }}>
                Causal: <strong style={{ color:T2 }}>{causalObj?.label}</strong>
                {" · "}Sueldo bruto: <strong style={{ color:T2 }}>{clp(Number(form.sueldo))}</strong>
              </div>
            </div>

            {/* Desglose */}
            <div style={{ background:C1, border:`1.5px solid ${B}`, borderRadius:14, overflow:"hidden", marginBottom:20 }}>
              <div style={{ padding:"16px 20px", borderBottom:`1px solid ${B}` }}>
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:T3 }}>DESGLOSE ÍTEM POR ÍTEM</span>
              </div>
              <div style={{ padding:"4px 0" }}>
                {resultado.indem > 0 && (
                  <FilaDetalle
                    label="Indemnización por años de servicio"
                    sub={`${Math.min(Number(form.anios), TOPE_ANIOS)} año(s) × ${clp(Math.min(Number(form.sueldo), 90 * uf))}`}
                    monto={resultado.indem} g={G} t1={T1} t2={T2} t3={T3} b={B}
                  />
                )}
                {resultado.aviso > 0 && (
                  <FilaDetalle
                    label="Aviso previo sustitutivo"
                    sub="La empresa no dio aviso de 30 días (art. 161)"
                    monto={resultado.aviso} g={G} t1={T1} t2={T2} t3={T3} b={B}
                  />
                )}
                <FilaDetalle
                  label="Feriado proporcional"
                  sub={`${resultado.diasAcum.toFixed(1)} días · ${clp(Number(form.sueldo))} / 30 × días`}
                  monto={resultado.feriado} g={G} t1={T1} t2={T2} t3={T3} b={B}
                />
                {resultado.descAfp > 0 && (
                  <FilaDetalle
                    label="Descuento AFP"
                    sub={`${pct(AFP_RATE)} sobre aviso previo · solo esta partida está afecta`}
                    monto={resultado.descAfp} negativo
                    g={G} t1={T1} t2={T2} t3={T3} b={B}
                  />
                )}
                {resultado.descSalud > 0 && (
                  <FilaDetalle
                    label="Descuento salud"
                    sub={`${pct(SALUD_RATE)} sobre aviso previo`}
                    monto={resultado.descSalud} negativo
                    g={G} t1={T1} t2={T2} t3={T3} b={B}
                  />
                )}
              </div>
              <div style={{ padding:"16px 20px", borderTop:`1px solid ${B}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:11, color:T3, marginBottom:4 }}>Bruto</div>
                  <div style={{ fontSize:15, fontWeight:600, color:T2 }}>{clp(resultado.bruto)}</div>
                </div>
                {resultado.descuentos > 0 && (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:"#ff6b6b", marginBottom:4 }}>Descuentos</div>
                    <div style={{ fontSize:15, fontWeight:600, color:"#ff6b6b" }}>−{clp(resultado.descuentos)}</div>
                  </div>
                )}
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:T3, marginBottom:4 }}>Líquido estimado</div>
                  <div style={{ fontSize:20, fontWeight:800, color:G }}>{clp(resultado.liquido)}</div>
                </div>
              </div>
            </div>

            {/* Alertas contextuales */}
            {form.causal === "160" && (
              <Alerta color="#c8a84b" bg="#1a1200" border="#3d2d00">
                <strong>Despido con causa grave (art. 160):</strong> el empleador argumenta que no corresponde indemnización.
                Si crees que la causal es falsa, tienes <strong>60 días hábiles</strong> para impugnarla en el Juzgado del Trabajo.
                La carga de la prueba es del empleador.
              </Alerta>
            )}
            {form.causal === "renuncia" && (
              <Alerta color="#c8a84b" bg="#1a1200" border="#3d2d00">
                <strong>Renuncia voluntaria:</strong> en general no corresponde indemnización por años de servicio.
                Solo cobras el feriado proporcional y los días trabajados del mes. Si te presionaron a renunciar,
                consulta con un abogado — podría configurarse un despido indirecto.
              </Alerta>
            )}
            {Number(form.anios) > TOPE_ANIOS && (
              <Alerta color="#c8a84b" bg="#1a1200" border="#3d2d00">
                <strong>Tope legal aplicado:</strong> la ley limita la indemnización a {TOPE_ANIOS} remuneraciones
                independiente de los años de servicio (art. 163 CT).
              </Alerta>
            )}

            {/* Reserva de derecho */}
            <div style={{ background:"#0a2818", border:`1.5px solid #1e5a35`, borderRadius:12, padding:"20px 22px", marginBottom:20 }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ minWidth:36, height:36, borderRadius:8, background:"#0f3320", border:`1px solid #1e5a35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={G} strokeWidth="1.8">
                    <circle cx="10" cy="10" r="7"/><path d="M10 7v4M10 14v.5"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:G, marginBottom:8 }}>Reserva de derecho — qué debes saber antes de firmar</div>
                  <p style={{ fontSize:13, color:T2, lineHeight:1.7, marginBottom:10 }}>
                    Esta calculadora entrega una <strong>estimación referencial</strong> basada en los datos que ingresaste y el Código del Trabajo vigente.
                    El monto real puede variar según bonos, gratificaciones, horas extra pendientes o errores en la liquidación.
                  </p>
                  <p style={{ fontSize:13, color:T2, lineHeight:1.7, marginBottom:10 }}>
                    <strong>Antes de firmar el finiquito</strong>, revisa que los montos coincidan con lo que te ofrece la empresa.
                    Si hay diferencias o dudas, tienes derecho a <strong>no firmar en el momento</strong> y pedir tiempo para revisarlo.
                    La firma del finiquito, una vez ratificada ante la Inspección del Trabajo o un ministro de fe, tiene carácter de pago total.
                  </p>
                  <p style={{ fontSize:13, color:T3, lineHeight:1.7 }}>
                    Se recomienda consultar con un abogado o la Inspección del Trabajo antes de firmar,
                    especialmente si el monto ofrecido difiere significativamente de esta estimación.
                  </p>
                </div>
              </div>
            </div>

            {/* Lead capture */}
            {!leadOk ? (
              <div style={{ background:C1, border:`1.5px solid ${B}`, borderRadius:14, padding:"22px 20px", marginBottom:20 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T1, marginBottom:4 }}>
                  ¿Quieres este desglose en tu correo?
                </div>
                <div style={{ fontSize:13, color:T3, marginBottom:16 }}>
                  Te enviamos el resumen en PDF + guía de qué revisar antes de firmar. Sin spam.
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  <input className="fq-in" placeholder="Tu nombre"
                    value={lead.nombre} onChange={e => setLead(p => ({ ...p, nombre:e.target.value }))}
                    style={{ padding:"11px 14px", background:DK, border:`1.5px solid ${B}`, borderRadius:8, color:T1, fontSize:14, fontFamily:"inherit" }}
                  />
                  <input className="fq-in" type="email" placeholder="Tu correo"
                    value={lead.email} onChange={e => setLead(p => ({ ...p, email:e.target.value }))}
                    style={{ padding:"11px 14px", background:DK, border:`1.5px solid ${B}`, borderRadius:8, color:T1, fontSize:14, fontFamily:"inherit" }}
                  />
                </div>
                <button className="fq-btn-p" type="button" onClick={enviarLead} style={{ ...btnPrimario, fontSize:14 }}>
                  Enviar resumen gratis
                </button>
              </div>
            ) : (
              <div style={{ background:C1, border:`1.5px solid ${B}`, borderRadius:14, padding:"28px 20px", textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:28, color:G, marginBottom:10 }}>✓</div>
                <div style={{ fontSize:15, fontWeight:700, color:T1, marginBottom:6 }}>¡Listo, {lead.nombre}!</div>
                <div style={{ fontSize:13, color:T3 }}>Revisa tu correo en <strong style={{ color:T2 }}>{lead.email}</strong></div>
              </div>
            )}

            {/* Recalcular */}
            <button className="fq-btn-s" type="button"
              onClick={() => { setResultado(null); setLeadOk(false); irA(0); setForm({ sueldo:"", anios:"", meses:"0", dias:"0", causal:"161", avisoPrevio:null, diasVacaciones:"" }); }}
              style={{ ...btnSecundario, width:"100%", padding:"13px", marginBottom:12 }}
            >
              Hacer un nuevo cálculo
            </button>
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign:"center", fontSize:11, color:T3, marginTop:40, lineHeight:1.8 }}>
          UF: ${uf.toLocaleString("es-CL")} · Código del Trabajo Chile · Actualizado 2025 ·{" "}
          <a href="https://dotaciones.cl" style={{ color:G, textDecoration:"none" }}>dotaciones.cl</a>
        </p>
      </div>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

interface PreguntaProps { numero:string; titulo:string; desc:string; children:React.ReactNode; t1:string; t2:string; t3:string; g:string }
function Pregunta({ numero, titulo, desc, children, t1, t2, t3, g }:PreguntaProps) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.12em", color:g, marginBottom:16 }}>
        {numero}
      </div>
      <h2 style={{ fontSize:"clamp(22px,4vw,30px)", fontWeight:800, color:t1, lineHeight:1.2, letterSpacing:"-0.02em", marginBottom:12 }}>
        {titulo}
      </h2>
      <p style={{ fontSize:14, color:t2, lineHeight:1.7, marginBottom:28 }}>
        {desc}
      </p>
      {children}
    </div>
  );
}

interface FilaProps { label:string; sub:string; monto:number; negativo?:boolean; g:string; t1:string; t2:string; t3:string; b:string }
function FilaDetalle({ label, sub, monto, negativo, g, t1, t2, t3, b }:FilaProps) {
  return (
    <div style={{ padding:"14px 20px", borderBottom:`1px solid ${b}`, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color: negativo ? "#ff6b6b" : t1, marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:11, color:t3, lineHeight:1.5 }}>{sub}</div>
      </div>
      <div style={{ fontSize:15, fontWeight:700, color: negativo ? "#ff6b6b" : g, whiteSpace:"nowrap" }}>
        {negativo ? "−" : "+"}{Math.round(Math.abs(monto)).toLocaleString("es-CL")}
      </div>
    </div>
  );
}

interface AlertaProps { children:React.ReactNode; color:string; bg:string; border:string }
function Alerta({ children, color, bg, border }:AlertaProps) {
  return (
    <div style={{ marginBottom:14, padding:"14px 16px", background:bg, border:`1.5px solid ${border}`, borderRadius:10, fontSize:13, color, lineHeight:1.7 }}>
      {children}
    </div>
  );
}
