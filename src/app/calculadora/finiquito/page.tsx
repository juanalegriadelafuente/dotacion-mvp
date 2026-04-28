"use client";

import React, { useState, useEffect, useCallback, ReactNode } from "react";

// ─── Constantes legales Chile 2026 ───────────────────────────────────────────
const AFP_RATE           = 0.1045;   // tasa promedio AFP (10% + comisión ~0.45%)
const SALUD_RATE         = 0.07;     // 7% salud (Fonasa/Isapre)
const AFC_TRABAJADOR     = 0.006;    // 0.6% seguro cesantía trabajador (sobre imponibles)
const AFC_EMPLEADOR_INDEF = 0.016;   // 1.6% aporte empleador (contrato indefinido)
const TOPE_ANIOS         = 11;       // tope años indemnización art.163
const DIAS_VACACIONES    = 15;       // días hábiles por año art.67
const SUELDO_MINIMO_2026 = 539000;   // IMM vigente 2026
const GRATIF_TOPE_MES    = Math.round((SUELDO_MINIMO_2026 * 4.75) / 12); // ~$213.354
const UF_FALLBACK        = 38500;
const TOPE_UF            = 90;       // tope 90 UF para indemnización art.163

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TipoRemuneracion = "fija" | "variable" | "mixta";
type Causal = "161" | "mutuoAcuerdo" | "renuncia" | "vencimiento" | "160" | "obraFaena";

interface FormState {
  // Tipo de remuneración
  tipoRemuneracion: TipoRemuneracion;

  // Remuneración fija
  sueldoBase:       string;  // sueldo base del contrato
  gratificacion:    string;  // gratificación mensual si la pagan (art.50)
  colacion:         string;  // asignación colación mensual
  movilizacion:     string;  // asignación movilización mensual
  otrosHaberes:     string;  // otros haberes fijos imponibles

  // Remuneración variable (promedio 3 meses)
  mes1: string;
  mes2: string;
  mes3: string;

  // Antigüedad
  fechaIngreso:   string;
  fechaTermino:   string;
  aniosTotales:   string;  // años totales empleadores anteriores (para vacaciones progresivas)

  // Causal
  causal:         Causal;
  avisoPrevio:    boolean | null;  // ¿dieron aviso 30 días?

  // Vacaciones
  diasVacPendientes: string;  // días hábiles pendientes de períodos anteriores
  diasVacTomados:    string;  // días hábiles tomados del período en curso

  // Extras
  horasExtra:        string;  // horas extra adeudadas
  gratifPropPendiente: string; // meses de gratificación no pagada en el año
  descontarCIC:      boolean | null;
  saldoCIC:          string;  // saldo real CIC si lo sabe
  otrosConceptos:    string;  // bonos u otros adeudados
}

interface DesgloseFeriado {
  diasHabilesAnio:    number;  // 15 + progresivos
  diasProgresivos:    number;
  diasAcumPeriodo:    number;  // días hábiles acumulados período en curso
  diasPendientes:     number;  // días de períodos anteriores
  totalDiasHabiles:  number;
  valorDiario:       number;
  montoFeriado:      number;   // solo días hábiles × valor diario
  // No sumamos inhábiles en este modelo simplificado
}

interface CalcResult {
  // Base de cálculo art.172
  baseCalculo:          number;  // remuneración íntegra para indemnizaciones
  baseCalculoFeriado:   number;  // base para feriado (puede incluir colación/mov en criterio DT)

  // Conceptos imponibles (AFP+salud+AFC trabajador aplican)
  remPeriodo:           number;  // días trabajados del mes
  diasTrabajadosMes:    number;
  feriado:              DesgloseFeriado;
  gratifProporcional:   number;  // gratificación proporcional no pagada
  horasExtraMonto:      number;
  otrosConceptos:       number;

  // Indemnizaciones (no imponibles — sin AFP/salud)
  indemAnios:           number;
  avisoPrevioMonto:     number;
  aniosEfectivos:       number;  // años usados para indemnización (con redondeo)

  // Descuentos
  descAfpSalud:         number;  // sobre conceptos imponibles
  descAfcTrabajador:    number;  // 0.6% sobre imponibles
  descCIC:              number;  // imputación empleador sobre indemnización

  // Totales
  totalHaberes:         number;
  totalDescuentos:      number;
  totalLiquido:         number;
}

// ─── Causales ─────────────────────────────────────────────────────────────────
const CAUSALES = [
  { value:"161"         as Causal, short:"Art. 161",      label:"Necesidades de la empresa",        desc:"Razones económicas o de organización. Da derecho a indemnización por años." },
  { value:"mutuoAcuerdo"as Causal, short:"Mutuo acuerdo", label:"Mutuo acuerdo (art. 159 nº1)",     desc:"Acuerdo de ambas partes. Puede incluir bono de salida voluntario." },
  { value:"renuncia"    as Causal, short:"Renuncia",       label:"Renuncia voluntaria (art. 159 nº2)",desc:"Sin indemnización por años. Solo feriado, gratificación y rem. del período." },
  { value:"vencimiento" as Causal, short:"Vencimiento",    label:"Vencimiento de contrato (art. 159 nº4)",desc:"Término natural del plazo. Sin indemnización por años." },
  { value:"obraFaena"   as Causal, short:"Obra/Faena",     label:"Conclusión de obra/faena (art. 159 nº5)",desc:"2,5 días por mes trabajado. Aplica indemnización especial." },
  { value:"160"         as Causal, short:"Art. 160",       label:"Despido con causa grave (art. 160)", desc:"Sin indemnización. Si es falsa, tienes 60 días hábiles para impugnar." },
];

const MOTIVOS_RESERVA = [
  { id:"despido",  label:"Despido injustificado",          texto:"despido injustificado, indebido o improcedente, junto con el recargo legal correspondiente" },
  { id:"feriado",  label:"Diferencias en feriado",         texto:"diferencias en el cálculo del feriado proporcional" },
  { id:"horas",    label:"Horas extra no pagadas",         texto:"cobro de horas extraordinarias no pagadas" },
  { id:"gratif",   label:"Gratificación mal calculada",    texto:"diferencias en el cálculo de la gratificación proporcional" },
  { id:"remuner",  label:"Diferencias en remuneraciones",  texto:"diferencias en el cálculo de remuneraciones del período" },
  { id:"cic",      label:"Imputación CIC incorrecta",      texto:"descuento indebido o mal calculado del seguro de cesantía (imputación CIC)" },
  { id:"bonos",    label:"Bonos o beneficios no pagados",  texto:"no pago de bonos, beneficios o asignaciones adeudadas" },
];

// ─── Fetch UF ─────────────────────────────────────────────────────────────────
async function fetchUF(): Promise<number> {
  try {
    const r = await fetch("https://mindicador.cl/api/uf");
    const d = await r.json();
    return (d.serie?.[0]?.valor as number) ?? UF_FALLBACK;
  } catch { return UF_FALLBACK; }
}

// ─── Utilidades de fecha ──────────────────────────────────────────────────────
function calcularAntiguedad(ingreso: string, termino: string): { anios: number; meses: number; dias: number; totalMeses: number; aniosEfectivos: number } {
  if (!ingreso || !termino) return { anios:0, meses:0, dias:0, totalMeses:0, aniosEfectivos:0 };
  const fi = new Date(ingreso);
  const ft = new Date(termino);
  let anios = ft.getFullYear() - fi.getFullYear();
  let meses = ft.getMonth() - fi.getMonth();
  let dias  = ft.getDate() - fi.getDate();
  if (dias < 0)  { meses--; dias += 30; }
  if (meses < 0) { anios--; meses += 12; }
  // Redondeo art.163: fracción > 6 meses = 1 año adicional
  const aniosEfectivos = meses >= 6 ? anios + 1 : anios;
  return { anios, meses, dias, totalMeses: anios*12 + meses, aniosEfectivos };
}

// ─── Motor de cálculo ─────────────────────────────────────────────────────────
function calcular(form: FormState, uf: number): CalcResult {
  const n = (s: string) => Number(s) || 0;

  // 1) BASE DE CÁLCULO ART. 172
  // Última remuneración = todo lo que el trabajador percibe regularmente
  let baseCalculo = 0;
  let baseCalculoFeriado = 0;

  if (form.tipoRemuneracion === "fija") {
    // Remuneración fija: sueldo base + gratificación + colación + movilización + otros
    const gratifMes = Math.min(n(form.gratificacion), GRATIF_TOPE_MES);
    baseCalculo = n(form.sueldoBase) + gratifMes + n(form.colacion) + n(form.movilizacion) + n(form.otrosHaberes);
    // Para feriado, DT excluye colación/movilización (no son remuneración), Corte Suprema las incluye
    // Usamos criterio DT por seguridad (el mínimo legal)
    baseCalculoFeriado = n(form.sueldoBase) + gratifMes + n(form.otrosHaberes);
  } else if (form.tipoRemuneracion === "variable") {
    // Promedio 3 meses
    const prom = (n(form.mes1) + n(form.mes2) + n(form.mes3)) / 3;
    baseCalculo = prom;
    baseCalculoFeriado = prom;
  } else {
    // Mixta: sueldo base + promedio de variables
    const promVar = (n(form.mes1) + n(form.mes2) + n(form.mes3)) / 3;
    const gratifMes = Math.min(n(form.gratificacion), GRATIF_TOPE_MES);
    baseCalculo = n(form.sueldoBase) + gratifMes + n(form.colacion) + n(form.movilizacion) + n(form.otrosHaberes) + promVar;
    baseCalculoFeriado = n(form.sueldoBase) + gratifMes + n(form.otrosHaberes) + promVar;
  }

  // Tope 90 UF para indemnizaciones
  const baseCapada = Math.min(baseCalculo, TOPE_UF * uf);

  // 2) ANTIGÜEDAD
  const { anios, meses, totalMeses, aniosEfectivos } = calcularAntiguedad(form.fechaIngreso, form.fechaTermino);

  // Días trabajados del mes de despido
  let diasTrabajadosMes = 0;
  if (form.fechaTermino) {
    diasTrabajadosMes = new Date(form.fechaTermino).getDate();
  }

  // 3) REMUNERACIÓN DEL PERÍODO (días trabajados en el mes de despido)
  // Siempre corresponde en todo finiquito
  const remPeriodo = baseCalculoFeriado > 0
    ? (baseCalculoFeriado / 30) * diasTrabajadosMes
    : (n(form.sueldoBase) / 30) * diasTrabajadosMes;

  // 4) FERIADO PROPORCIONAL (art. 73 CT)
  // Días anuales base = 15 + progresivos
  const aniosTotalesPrevisionales = Math.max(
    anios + n(form.aniosTotales),
    anios
  );
  let diasProgresivos = 0;
  if (aniosTotalesPrevisionales >= 10) {
    // 1 día adicional por cada 3 años sobre los 10, con el mismo empleador
    diasProgresivos = Math.floor(anios / 3);
  }
  const diasVacAnuales = DIAS_VACACIONES + diasProgresivos;

  // Días acumulados período en curso
  const diasAcumPeriodo = (diasVacAnuales / 12) * meses + (diasVacAnuales / 12 / 30) * (totalMeses > 0 ? 0 : 0);
  // Cálculo más preciso: meses completos + fracción del mes parcial
  const diasHabilesAcum = (diasVacAnuales / 12) * (meses + (diasTrabajadosMes / 30));
  const diasPendientes  = n(form.diasVacPendientes);
  const diasTomados     = n(form.diasVacTomados);
  const totalDiasHabiles = Math.max(0, diasHabilesAcum + diasPendientes - diasTomados);

  const valorDiarioFeriado = baseCalculoFeriado / 30;
  // Feriado = días hábiles × valor diario (simplificado — el cálculo exacto requiere contar inhábiles en calendario)
  // Multiplicamos por factor 1.4 aprox para incluir fines de semana (metodología DT)
  const montoFeriado = valorDiarioFeriado * totalDiasHabiles * (30 / DIAS_VACACIONES); // equivalente corrido

  const feriado: DesgloseFeriado = {
    diasHabilesAnio: diasVacAnuales,
    diasProgresivos,
    diasAcumPeriodo: Math.round(diasHabilesAcum * 100) / 100,
    diasPendientes,
    totalDiasHabiles: Math.round(totalDiasHabiles * 100) / 100,
    valorDiario: valorDiarioFeriado,
    montoFeriado,
  };

  // 5) GRATIFICACIÓN PROPORCIONAL
  // Si la empresa no ha pagado gratificación en el año en curso
  const mesesSinGratif = n(form.gratifPropPendiente);
  let gratifProporcional = 0;
  if (mesesSinGratif > 0 && form.tipoRemuneracion === "fija") {
    // Art.50: 25% del sueldo base (sin otras asignaciones), tope mensual
    const gratifMesProp = Math.min(n(form.sueldoBase) * 0.25, GRATIF_TOPE_MES);
    gratifProporcional = gratifMesProp * mesesSinGratif;
  }

  // 6) HORAS EXTRA ADEUDADAS
  // Valor hora extra = (sueldo base / jornada horas) × 1.5
  // Usamos divisor 168 (jornada 42h × 4 semanas) vigente desde 26/04/2026
  const divisorHoras = 168;
  const valorHoraExtra = (n(form.sueldoBase) / divisorHoras) * 1.5;
  const horasExtraMonto = valorHoraExtra * n(form.horasExtra);

  // 7) OTROS CONCEPTOS
  const otrosConceptos = n(form.otrosConceptos);

  // 8) INDEMNIZACIONES (no imponibles)
  let indemAnios = 0;
  let avisoPrevioMonto = 0;

  if (["161", "mutuoAcuerdo"].includes(form.causal)) {
    indemAnios = Math.min(aniosEfectivos, TOPE_ANIOS) * baseCapada;
  }

  // Obra/Faena: 2.5 días por mes trabajado (contratos post 31/12/2021)
  if (form.causal === "obraFaena") {
    indemAnios = (baseCapada / 30) * 2.5 * totalMeses;
  }

  if (form.causal === "161" && form.avisoPrevio === false) {
    avisoPrevioMonto = baseCapada;
  }

  // 9) DESCUENTO CIC
  let descCIC = 0;
  if (form.causal === "161" && form.descontarCIC === true && indemAnios > 0) {
    if (n(form.saldoCIC) > 0) {
      descCIC = Math.min(n(form.saldoCIC), indemAnios);
    } else {
      // Estimación: 1.6% × sueldo × min(años, 11)
      const aniosParaCIC = Math.min(aniosEfectivos, TOPE_ANIOS);
      descCIC = Math.min(n(form.sueldoBase) * AFC_EMPLEADOR_INDEF * aniosParaCIC, indemAnios);
    }
  }

  // 10) CONCEPTOS IMPONIBLES (AFP + Salud + AFC trabajador)
  // AFP y salud aplican sobre: rem. período + feriado + gratif. proporcional + horas extra
  const baseImponible = remPeriodo + montoFeriado + gratifProporcional + horasExtraMonto + otrosConceptos;
  const descAfpSalud    = baseImponible * (AFP_RATE + SALUD_RATE);
  const descAfcTrabajador = baseImponible * AFC_TRABAJADOR;

  // 11) TOTALES
  const totalHaberes    = remPeriodo + montoFeriado + gratifProporcional + horasExtraMonto + otrosConceptos + indemAnios + avisoPrevioMonto;
  const totalDescuentos = descAfpSalud + descAfcTrabajador + descCIC;
  const totalLiquido    = totalHaberes - totalDescuentos;

  return {
    baseCalculo,
    baseCalculoFeriado,
    remPeriodo,
    diasTrabajadosMes,
    feriado,
    gratifProporcional,
    horasExtraMonto,
    otrosConceptos,
    indemAnios,
    avisoPrevioMonto,
    aniosEfectivos: Math.min(aniosEfectivos, TOPE_ANIOS),
    descAfpSalud,
    descAfcTrabajador,
    descCIC,
    totalHaberes,
    totalDescuentos,
    totalLiquido,
  };
}

// ─── Utilidades de formato ────────────────────────────────────────────────────
function clp(n: number): string {
  return Math.round(n).toLocaleString("es-CL", { style:"currency", currency:"CLP", maximumFractionDigits:0 });
}
function pct(n: number): string { return `${(n * 100).toFixed(2)}%`; }

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const G = "#3ddc84", BG = "#0a1f12", C1 = "#0f2b1a", B = "#1e3d29";
const T1 = "#e8f5e9", T2 = "#8aab96", T3 = "#5a8070", DK = "#07160d";

function Pregunta({ numero, titulo, desc, children }: { numero:string; titulo:string; desc:string; children:ReactNode }) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.12em", color:G, marginBottom:16 }}>{numero}</div>
      <h2 style={{ fontSize:"clamp(20px,3.5vw,28px)", fontWeight:800, color:T1, lineHeight:1.2, letterSpacing:"-0.02em", marginBottom:10 }}>{titulo}</h2>
      <p style={{ fontSize:14, color:T2, lineHeight:1.7, marginBottom:24 }}>{desc}</p>
      {children}
    </div>
  );
}

function Fila({ label, sub, monto, negativo, highlight }: { label:string; sub?:string; monto:number; negativo?:boolean; highlight?:boolean }) {
  if (Math.abs(monto) < 1) return null;
  return (
    <div style={{ padding:"12px 20px", borderBottom:`1px solid ${B}`, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:negativo?"#ff6b6b":highlight?G:T1, marginBottom:sub?3:0 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:T3, lineHeight:1.4 }}>{sub}</div>}
      </div>
      <div style={{ fontSize:14, fontWeight:700, color:negativo?"#ff6b6b":highlight?G:T1, whiteSpace:"nowrap" }}>
        {negativo?"−":"+"}{Math.round(Math.abs(monto)).toLocaleString("es-CL")}
      </div>
    </div>
  );
}

function Campo({ label, hint, children }: { label:string; hint?:string; children:ReactNode }) {
  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:T2, marginBottom:8 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize:11, color:T3, marginTop:5, lineHeight:1.5 }}>{hint}</p>}
    </div>
  );
}

function Nota({ children, tipo = "info" }: { children:ReactNode; tipo?:"info"|"warn"|"ok" }) {
  const col = tipo === "warn" ? "#c8a84b" : tipo === "ok" ? G : T2;
  const bg  = tipo === "warn" ? "#1a1200" : tipo === "ok" ? "#0d2a1a" : "#0d1a10";
  const brd = tipo === "warn" ? "#3d2d00" : tipo === "ok" ? "#1e5a35" : B;
  return (
    <div style={{ padding:"12px 16px", background:bg, border:`1.5px solid ${brd}`, borderRadius:10, fontSize:13, color:col, lineHeight:1.65, marginBottom:14 }}>
      {children}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CalculadoraFiniquito() {
  const [uf,        setUf]        = useState<number>(UF_FALLBACK);
  const [paso,      setPaso]      = useState<number>(0);
  const [animDir,   setAnimDir]   = useState<"forward"|"back">("forward");
  const [visible,   setVisible]   = useState<boolean>(true);
  const [resultado, setResultado] = useState<CalcResult | null>(null);
  const [lead,      setLead]      = useState<{nombre:string; email:string}>({ nombre:"", email:"" });
  const [leadOk,    setLeadOk]    = useState<boolean>(false);
  const [leadLoad,  setLeadLoad]  = useState<boolean>(false);
  const [err,       setErr]       = useState<string>("");
  const [motivos,   setMotivos]   = useState<string[]>([]);
  const [showRes,   setShowRes]   = useState<boolean>(false);
  const [copiado,   setCopiado]   = useState<boolean>(false);

  const [form, setForm] = useState<FormState>({
    tipoRemuneracion:"fija",
    sueldoBase:"", gratificacion:"", colacion:"", movilizacion:"", otrosHaberes:"",
    mes1:"", mes2:"", mes3:"",
    fechaIngreso:"", fechaTermino:"", aniosTotales:"0",
    causal:"161", avisoPrevio:null,
    diasVacPendientes:"0", diasVacTomados:"0",
    horasExtra:"0",
    gratifPropPendiente:"0",
    descontarCIC:null, saldoCIC:"",
    otrosConceptos:"",
  });

  useEffect(() => { fetchUF().then(setUf); }, []);

  const sf = useCallback((k: keyof FormState, v: string | boolean | null) => {
    setForm(p => ({ ...p, [k]: v }));
  }, []);

  const irA = useCallback((destino: number) => {
    setAnimDir(destino > paso ? "forward" : "back");
    setVisible(false);
    setTimeout(() => { setPaso(destino); setVisible(true); setErr(""); }, 200);
  }, [paso]);

  const validarPaso = useCallback((): string => {
    if (paso === 0) {
      if (form.tipoRemuneracion === "fija" && !form.sueldoBase) return "Ingresa tu sueldo base.";
      if (form.tipoRemuneracion === "variable" && (!form.mes1 || !form.mes2 || !form.mes3)) return "Ingresa los 3 meses para el promedio.";
      if (form.tipoRemuneracion === "mixta" && !form.sueldoBase) return "Ingresa el sueldo base.";
    }
    if (paso === 1 && (!form.fechaIngreso || !form.fechaTermino)) return "Ingresa ambas fechas.";
    if (paso === 2 && !form.causal) return "Selecciona la causal.";
    if (paso === 3 && form.causal === "161" && form.avisoPrevio === null) return "Indica si recibiste aviso previo.";
    if (paso === 4 && form.causal === "161" && form.descontarCIC === null) return "Indica si el empleador descontará la CIC.";
    return "";
  }, [paso, form]);

  const TOTAL_PASOS = form.causal === "161" ? 5 : 4;

  const siguiente = useCallback(() => {
    const e = validarPaso();
    if (e) { setErr(e); return; }
    setErr("");
    if (paso === 2 && form.causal !== "161") {
      setResultado(calcular(form, uf));
      irA(5); return;
    }
    if (paso === 3 && form.causal === "161") { irA(4); return; }
    if (paso === 4 && form.causal === "161") {
      setResultado(calcular(form, uf));
      irA(5); return;
    }
    irA(paso + 1);
  }, [paso, form, uf, validarPaso, irA]);

  const anterior = useCallback(() => {
    if (paso === 5) { irA(form.causal === "161" ? 4 : 2); return; }
    irA(paso - 1);
  }, [paso, form, irA]);

  const recalcular = useCallback(() => {
    if (resultado) setResultado(calcular(form, uf));
  }, [form, uf, resultado]);

  const enviarLead = useCallback(async () => {
    if (!lead.nombre || !lead.email) return;
    setLeadLoad(true);
    try {
      await fetch("/api/leads", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ nombre:lead.nombre, email:lead.email, source:"calculadora-finiquito" }),
      });
    } catch { /* silencioso */ }
    setLeadLoad(false);
    setLeadOk(true);
  }, [lead]);

  const resetear = useCallback(() => {
    setResultado(null); setLeadOk(false); setMotivos([]); setShowRes(false);
    setForm({ tipoRemuneracion:"fija", sueldoBase:"", gratificacion:"", colacion:"", movilizacion:"", otrosHaberes:"", mes1:"", mes2:"", mes3:"", fechaIngreso:"", fechaTermino:"", aniosTotales:"0", causal:"161", avisoPrevio:null, diasVacPendientes:"0", diasVacTomados:"0", horasExtra:"0", gratifPropPendiente:"0", descontarCIC:null, saldoCIC:"", otrosConceptos:"" });
    irA(0);
  }, [irA]);

  const toggleMotivo = (id: string) =>
    setMotivos(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const textoReserva = motivos.length > 0
    ? `"Me reservo el derecho de demandar por ${MOTIVOS_RESERVA.filter(m => motivos.includes(m.id)).map(m => m.texto).join(", ")}."`
    : "";

  const copiarTexto = () => {
    if (textoReserva) navigator.clipboard.writeText(textoReserva).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500); });
  };

  const progreso  = paso >= 5 ? 100 : Math.round((paso / TOTAL_PASOS) * 100);
  const causalObj = CAUSALES.find(c => c.value === form.causal);
  const antig     = calcularAntiguedad(form.fechaIngreso, form.fechaTermino);
  const animClass = visible ? (animDir === "forward" ? "anim-fw" : "anim-bk") : "";

  const inBase: React.CSSProperties = { width:"100%", padding:"12px 16px", background:DK, border:`1.5px solid ${B}`, borderRadius:8, color:T1, fontSize:16, fontFamily:"inherit", outline:"none", transition:"border-color .15s" };
  const inSm:   React.CSSProperties = { ...inBase, padding:"10px 14px", fontSize:14 };
  const btnP:   React.CSSProperties = { width:"100%", padding:"14px", background:G, color:"#0a1f12", border:"none", borderRadius:10, fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"inherit" };
  const btnS:   React.CSSProperties = { background:"transparent", border:`1.5px solid ${B}`, color:T2, borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit" };
  const tab:    React.CSSProperties = { flex:1, padding:"9px 0", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all .15s" };

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background:BG, minHeight:"100vh", padding:"0 0 80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .fq-in:focus{border-color:#3ddc84!important;outline:none}
        .fq-bp:hover{opacity:.85}.fq-bp:active{transform:scale(.98)}
        .fq-bs:hover{border-color:#3ddc84;color:#3ddc84}
        .fq-causal:hover{border-color:#3ddc84!important}
        .fq-causal.sel{border-color:#3ddc84!important;background:#0d2a1a!important}
        .fq-mot{cursor:pointer;background:#07160d;border:1.5px solid #1e3d29;border-radius:8px;padding:10px 14px;font-size:13px;color:#8aab96;font-family:inherit;text-align:left;transition:all .15s;width:100%}
        .fq-mot.sel{border-color:#3ddc84;color:#3ddc84;background:#0d2a1a}
        .fq-mot:hover{border-color:#3ddc84}
        @keyframes fwIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
        @keyframes bkIn{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .anim-fw{animation:fwIn .22s ease}.anim-bk{animation:bkIn .22s ease}.anim-fade{animation:fadeIn .3s ease}
        select option{background:#0f2b1a}
        input[type=date]{color-scheme:dark}
        input[type=number]::-webkit-inner-spin-button{opacity:.3}
      `}</style>

      {/* Barra de progreso */}
      <div style={{ position:"sticky", top:0, zIndex:10, background:BG, borderBottom:`1px solid ${B}`, padding:"14px 24px" }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.12em", color:G }}>● CALCULADORA FINIQUITO · DOTACIONES.CL</span>
            <span style={{ fontSize:12, color:T3 }}>{paso < 5 ? `Paso ${paso + 1} de ${TOTAL_PASOS}` : "Resultado"}</span>
          </div>
          <div style={{ height:3, background:B, borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progreso}%`, background:G, borderRadius:99, transition:"width .4s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"44px 24px 0" }}>

        {/* ── PASOS ── */}
        {paso < 5 && (
          <div className={animClass}>

            {/* PASO 0 — Remuneración */}
            {paso === 0 && (
              <Pregunta numero="01" titulo="¿Cómo es tu remuneración?" desc="El tipo de remuneración determina la base de cálculo para indemnizaciones y feriado (art. 172 CT).">
                {/* Selector tipo */}
                <div style={{ display:"flex", border:`1.5px solid ${B}`, borderRadius:8, overflow:"hidden", marginBottom:24 }}>
                  {(["fija","variable","mixta"] as TipoRemuneracion[]).map(t => (
                    <button key={t} type="button" onClick={() => sf("tipoRemuneracion", t)}
                      style={{ ...tab, background:form.tipoRemuneracion === t ? G : "transparent", color:form.tipoRemuneracion === t ? "#0a1f12" : T3 }}>
                      {t === "fija" ? "Sueldo fijo" : t === "variable" ? "Variable / Comisiones" : "Mixta"}
                    </button>
                  ))}
                </div>

                {/* Fija */}
                {(form.tipoRemuneracion === "fija" || form.tipoRemuneracion === "mixta") && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    <Campo label="Sueldo base bruto *" hint="El del contrato, antes de descuentos">
                      <input className="fq-in" type="number" placeholder="800.000" value={form.sueldoBase}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("sueldoBase", e.target.value)} style={inSm} />
                    </Campo>
                    <Campo label="Gratificación mensual" hint={`Art. 50: tope $${GRATIF_TOPE_MES.toLocaleString("es-CL")}/mes`}>
                      <input className="fq-in" type="number" placeholder="213.354" value={form.gratificacion}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("gratificacion", e.target.value)} style={inSm} />
                    </Campo>
                    <Campo label="Colación mensual">
                      <input className="fq-in" type="number" placeholder="0" value={form.colacion}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("colacion", e.target.value)} style={inSm} />
                    </Campo>
                    <Campo label="Movilización mensual">
                      <input className="fq-in" type="number" placeholder="0" value={form.movilizacion}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("movilizacion", e.target.value)} style={inSm} />
                    </Campo>
                    <Campo label="Otros haberes fijos" hint="Bonos permanentes, asignaciones fijas">
                      <input className="fq-in" type="number" placeholder="0" value={form.otrosHaberes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("otrosHaberes", e.target.value)} style={inSm} />
                    </Campo>
                  </div>
                )}

                {/* Variable / Mixta — promedio 3 meses */}
                {(form.tipoRemuneracion === "variable" || form.tipoRemuneracion === "mixta") && (
                  <div>
                    <p style={{ fontSize:13, color:T2, marginBottom:14 }}>
                      Ingresa el total bruto de los últimos 3 meses trabajados completos (art. 172). No incluyas el mes del despido si fue parcial.
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                      {([["mes1","Mes más antiguo"],["mes2","Mes intermedio"],["mes3","Mes más reciente"]] as [keyof FormState, string][]).map(([k, label]) => (
                        <Campo key={k} label={label}>
                          <input className="fq-in" type="number" placeholder="0" value={form[k] as string}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf(k, e.target.value)} style={inSm} />
                        </Campo>
                      ))}
                    </div>
                    {form.mes1 && form.mes2 && form.mes3 && (
                      <Nota tipo="ok">
                        Promedio 3 meses: <strong>{clp((Number(form.mes1)+Number(form.mes2)+Number(form.mes3))/3)}</strong>
                      </Nota>
                    )}
                  </div>
                )}
              </Pregunta>
            )}

            {/* PASO 1 — Fechas y antigüedad */}
            {paso === 1 && (
              <Pregunta numero="02" titulo="¿Cuánto tiempo llevas en la empresa?" desc="Las fechas exactas permiten calcular la antigüedad con el redondeo correcto: fracciones sobre 6 meses se cuentan como 1 año (art. 163).">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
                  <Campo label="Fecha de ingreso">
                    <input className="fq-in" type="date" value={form.fechaIngreso}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("fechaIngreso", e.target.value)} style={inSm} />
                  </Campo>
                  <Campo label="Fecha de término">
                    <input className="fq-in" type="date" value={form.fechaTermino}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("fechaTermino", e.target.value)} style={inSm} />
                  </Campo>
                </div>

                {form.fechaIngreso && form.fechaTermino && (
                  <Nota tipo="ok">
                    Antigüedad: <strong>{antig.anios} año(s) y {antig.meses} mes(es)</strong>
                    {antig.meses >= 6 && <> — redondea a <strong>{antig.aniosEfectivos} años</strong> para efectos de indemnización</>}
                  </Nota>
                )}

                <Campo label="Años trabajados para otros empleadores anteriores (opcional)" hint="Necesario para calcular vacaciones progresivas (art. 68). Si llevas >10 años en total, corresponden días adicionales.">
                  <input className="fq-in" type="number" placeholder="0" min="0" value={form.aniosTotales}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("aniosTotales", e.target.value)} style={inSm} />
                </Campo>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <Campo label="Días vacaciones pendientes" hint="Períodos anteriores sin tomar">
                    <input className="fq-in" type="number" placeholder="0" min="0" value={form.diasVacPendientes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("diasVacPendientes", e.target.value)} style={inSm} />
                  </Campo>
                  <Campo label="Días vacaciones tomados" hint="Del período en curso (último año)">
                    <input className="fq-in" type="number" placeholder="0" min="0" value={form.diasVacTomados}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("diasVacTomados", e.target.value)} style={inSm} />
                  </Campo>
                  <Campo label="Meses sin gratificación" hint="Si la empresa no pagó gratificación mensual en el año en curso">
                    <input className="fq-in" type="number" placeholder="0" min="0" max="12" value={form.gratifPropPendiente}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("gratifPropPendiente", e.target.value)} style={inSm} />
                  </Campo>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <Campo label="Horas extra adeudadas" hint="Horas no pagadas durante el contrato">
                    <input className="fq-in" type="number" placeholder="0" min="0" value={form.horasExtra}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("horasExtra", e.target.value)} style={inSm} />
                  </Campo>
                  <Campo label="Otros conceptos adeudados ($)" hint="Bonos, asignaciones u otros pendientes">
                    <input className="fq-in" type="number" placeholder="0" min="0" value={form.otrosConceptos}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("otrosConceptos", e.target.value)} style={inSm} />
                  </Campo>
                </div>
              </Pregunta>
            )}

            {/* PASO 2 — Causal */}
            {paso === 2 && (
              <Pregunta numero="03" titulo="¿Por qué termina el contrato?" desc="La causal determina si tienes derecho a indemnización por años de servicio. Debe coincidir con la carta de aviso.">
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {CAUSALES.map(c => (
                    <button key={c.value} type="button"
                      className={`fq-causal${form.causal === c.value ? " sel" : ""}`}
                      onClick={() => sf("causal", c.value)}
                      style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px", background:form.causal === c.value ? "#0d2a1a" : DK, border:`1.5px solid ${form.causal === c.value ? G : B}`, borderRadius:10, cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}>
                      <div style={{ minWidth:44, height:44, borderRadius:8, background:form.causal === c.value ? "#1a4a2a" : "#0f2216", border:`1px solid ${form.causal === c.value ? G : B}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, letterSpacing:"0.06em", color:form.causal === c.value ? G : T3, flexShrink:0 }}>
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

            {/* PASO 3 — Aviso previo (solo art.161) */}
            {paso === 3 && form.causal === "161" && (
              <Pregunta numero="04" titulo="¿La empresa te avisó con 30 días de anticipación?" desc="El aviso debe ser escrito y con al menos 30 días de anticipación. Si no lo hicieron, corresponde indemnización sustitutiva equivalente a 1 mes de remuneración (art. 162).">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {([{ val:false, label:"No me avisaron", sub:"Corresponde 1 mes adicional" }, { val:true, label:"Sí, me avisaron", sub:"Con 30+ días de anticipación" }] as Array<{ val:boolean; label:string; sub:string }>).map(({ val, label, sub }) => (
                    <button key={String(val)} type="button" onClick={() => sf("avisoPrevio", val)}
                      style={{ padding:"20px 16px", background:form.avisoPrevio === val ? "#0d2a1a" : DK, border:`2px solid ${form.avisoPrevio === val ? G : B}`, borderRadius:12, cursor:"pointer", fontFamily:"inherit", textAlign:"center", transition:"all .15s" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:form.avisoPrevio === val ? G : T1, marginBottom:6 }}>{label}</div>
                      <div style={{ fontSize:12, color:T3 }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </Pregunta>
            )}

            {/* PASO 4 — CIC (solo art.161) */}
            {paso === 4 && form.causal === "161" && (
              <Pregunta numero="05" titulo="¿El empleador descontará el seguro de cesantía (CIC)?" desc="En despidos art. 161, el empleador puede descontar de la indemnización el saldo que él aportó a tu Cuenta Individual de Cesantía (1,6% mensual).">
                <Nota>
                  Este descuento es legal solo en art. 161. Si la causal fuera incorrecta o el monto mal calculado, puedes impugnar con reserva de derechos.
                </Nota>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                  {([{ val:true, label:"Sí, lo descontarán", sub:"Indicaré el monto o estimo" }, { val:false, label:"No aplicará", sub:"No harán imputación CIC" }] as Array<{ val:boolean; label:string; sub:string }>).map(({ val, label, sub }) => (
                    <button key={String(val)} type="button" onClick={() => sf("descontarCIC", val)}
                      style={{ padding:"18px 16px", background:form.descontarCIC === val ? "#0d2a1a" : DK, border:`2px solid ${form.descontarCIC === val ? G : B}`, borderRadius:12, cursor:"pointer", fontFamily:"inherit", textAlign:"center", transition:"all .15s" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:form.descontarCIC === val ? G : T1, marginBottom:5 }}>{label}</div>
                      <div style={{ fontSize:11, color:T3 }}>{sub}</div>
                    </button>
                  ))}
                </div>
                {form.descontarCIC === true && (
                  <Campo label="Saldo CIC real (opcional)" hint="Puedes consultarlo en la AFC o tu AFP. Si lo dejas en blanco, estimamos con el 1,6% × años × sueldo base.">
                    <input className="fq-in" type="number" placeholder="0" value={form.saldoCIC}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => sf("saldoCIC", e.target.value)} style={inSm} />
                  </Campo>
                )}
              </Pregunta>
            )}

            {/* Navegación */}
            <div style={{ marginTop:28, display:"flex", flexDirection:"column", gap:10 }}>
              {err && <p style={{ color:"#ff6b6b", fontSize:13, textAlign:"center" }}>{err}</p>}
              <button className="fq-bp" type="button" onClick={siguiente} style={btnP}>
                {(paso === 4) || (paso === 2 && form.causal !== "161") || (paso === 3 && form.causal === "161" && false) ? "Ver mi finiquito →" : "Siguiente →"}
              </button>
              {paso > 0 && <button className="fq-bs" type="button" onClick={anterior} style={{ ...btnS, alignSelf:"center" }}>← Volver</button>}
            </div>
          </div>
        )}

        {/* ── RESULTADO ── */}
        {paso === 5 && resultado && (
          <div className="anim-fade">

            {/* Total destacado */}
            <div style={{ textAlign:"center", marginBottom:36 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:G, marginBottom:14 }}>RESULTADO DEL CÁLCULO</div>
              <div style={{ fontSize:13, color:T3, marginBottom:6 }}>Estimación total que te corresponde</div>
              <div style={{ fontSize:"clamp(40px,8vw,60px)", fontWeight:800, color:G, letterSpacing:"-0.03em", lineHeight:1 }}>{clp(resultado.totalLiquido)}</div>
              <div style={{ fontSize:13, color:T3, marginTop:10 }}>
                {causalObj?.label}
                {form.fechaIngreso && form.fechaTermino && ` · ${antig.anios} año(s) y ${antig.meses} mes(es)`}
              </div>
            </div>

            {/* Base de cálculo */}
            <Nota tipo="info">
              <strong style={{ color:T1 }}>Base de cálculo art. 172:</strong> {clp(resultado.baseCalculo)}
              {resultado.baseCalculo > TOPE_UF * uf && <span style={{ color:"#c8a84b" }}> — aplicado tope 90 UF ({clp(TOPE_UF * uf)})</span>}
            </Nota>

            {/* Desglose */}
            <div style={{ background:C1, border:`1.5px solid ${B}`, borderRadius:14, overflow:"hidden", marginBottom:16 }}>
              <div style={{ padding:"14px 20px", borderBottom:`1px solid ${B}`, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:T3 }}>DESGLOSE ÍTEM POR ÍTEM</span>
                <span style={{ fontSize:11, color:T3 }}>UF: ${uf.toLocaleString("es-CL")}</span>
              </div>
              <div style={{ padding:"4px 0" }}>
                {/* Remuneración del período */}
                <Fila label="Remuneración del período"
                  sub={`${resultado.diasTrabajadosMes} días trabajados en el mes de despido · imponible`}
                  monto={resultado.remPeriodo} />

                {/* Feriado proporcional */}
                <Fila label="Feriado proporcional"
                  sub={`${resultado.feriado.totalDiasHabiles.toFixed(1)} días hábiles (${resultado.feriado.diasHabilesAnio} días/año${resultado.feriado.diasProgresivos > 0 ? ` + ${resultado.feriado.diasProgresivos} progresivos` : ""}) · imponible`}
                  monto={resultado.feriado.montoFeriado} />

                {/* Gratificación proporcional */}
                {resultado.gratifProporcional > 0 && (
                  <Fila label="Gratificación proporcional"
                    sub={`${form.gratifPropPendiente} mes(es) no pagados · art. 50 · imponible`}
                    monto={resultado.gratifProporcional} />
                )}

                {/* Horas extra */}
                {resultado.horasExtraMonto > 0 && (
                  <Fila label="Horas extra adeudadas"
                    sub={`${form.horasExtra} hrs × valor hora (+50% recargo art. 32) · imponible`}
                    monto={resultado.horasExtraMonto} />
                )}

                {/* Otros conceptos */}
                {resultado.otrosConceptos > 0 && (
                  <Fila label="Otros conceptos adeudados"
                    sub="Bonos, asignaciones u otros pendientes"
                    monto={resultado.otrosConceptos} />
                )}

                {/* Indemnización años */}
                {resultado.indemAnios > 0 && (
                  <Fila label="Indemnización por años de servicio"
                    sub={`${resultado.aniosEfectivos} año(s) × ${clp(Math.min(resultado.baseCalculo, TOPE_UF * uf))} · NO imponible`}
                    monto={resultado.indemAnios} highlight />
                )}

                {/* Aviso previo */}
                {resultado.avisoPrevioMonto > 0 && (
                  <Fila label="Indemnización sustitutiva aviso previo"
                    sub="Empresa no avisó con 30 días · equivale a 1 remuneración · NO imponible"
                    monto={resultado.avisoPrevioMonto} highlight />
                )}

                {/* Descuentos */}
                {resultado.descAfpSalud > 0 && (
                  <Fila label="Descuentos AFP + Salud"
                    sub={`${pct(AFP_RATE + SALUD_RATE)} sobre haberes imponibles (rem. período + feriado + gratif. + hrs extra)`}
                    monto={resultado.descAfpSalud} negativo />
                )}
                {resultado.descAfcTrabajador > 0 && (
                  <Fila label="Descuento AFC trabajador"
                    sub={`${pct(AFC_TRABAJADOR)} sobre haberes imponibles`}
                    monto={resultado.descAfcTrabajador} negativo />
                )}
                {resultado.descCIC > 0 && (
                  <Fila label="Imputación seguro cesantía empleador (CIC)"
                    sub="Descontado de indemnización por años de servicio · art. 13 Ley 19.728"
                    monto={resultado.descCIC} negativo />
                )}
              </div>

              {/* Pie del desglose */}
              <div style={{ padding:"16px 20px", borderTop:`1px solid ${B}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <div><div style={{ fontSize:11, color:T3, marginBottom:3 }}>Total haberes brutos</div><div style={{ fontSize:14, fontWeight:600, color:T2 }}>{clp(resultado.totalHaberes)}</div></div>
                {resultado.totalDescuentos > 0 && <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:"#ff6b6b", marginBottom:3 }}>Total descuentos</div><div style={{ fontSize:14, fontWeight:600, color:"#ff6b6b" }}>−{clp(resultado.totalDescuentos)}</div></div>}
                <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:T3, marginBottom:3 }}>Líquido estimado</div><div style={{ fontSize:18, fontWeight:800, color:G }}>{clp(resultado.totalLiquido)}</div></div>
              </div>
            </div>

            {/* Alertas contextuales */}
            {form.causal === "160" && (
              <Nota tipo="warn">
                <strong>Art. 160 — despido con causa grave:</strong> el empleador argumenta que no corresponde indemnización. Si crees que la causal es falsa, tienes <strong>60 días hábiles</strong> para impugnarla en el Juzgado del Trabajo. La carga de la prueba es del empleador.
              </Nota>
            )}
            {form.causal === "renuncia" && (
              <Nota tipo="warn">
                <strong>Renuncia voluntaria:</strong> no corresponde indemnización por años de servicio. Si te presionaron a renunciar, puede configurarse un despido indirecto (art. 171 CT) — consulta con un abogado laboral.
              </Nota>
            )}
            {antig.aniosEfectivos > TOPE_ANIOS && (
              <Nota tipo="warn">
                <strong>Tope de {TOPE_ANIOS} años aplicado.</strong> La ley limita la indemnización a {TOPE_ANIOS} remuneraciones mensuales, independiente de los años trabajados (art. 163 CT).
              </Nota>
            )}
            {resultado.feriado.diasProgresivos > 0 && (
              <Nota tipo="ok">
                <strong>Vacaciones progresivas incluidas:</strong> con tu antigüedad, corresponden {resultado.feriado.diasProgresivos} día(s) adicional(es) por cada 3 nuevos años sobre los 10 (art. 68 CT).
              </Nota>
            )}

            {/* Reserva de derechos */}
            <div style={{ background:"#071a10", border:"1.5px solid #1e5a35", borderRadius:14, padding:"20px", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ fontSize:13, fontWeight:800, color:G }}>Reserva de derechos</div>
                <button type="button" onClick={() => setShowRes(!showRes)}
                  style={{ background:"transparent", border:"1px solid #1e5a35", borderRadius:6, color:G, fontSize:11, fontWeight:700, padding:"5px 12px", cursor:"pointer", fontFamily:"inherit" }}>
                  {showRes ? "Cerrar" : "Generar texto →"}
                </button>
              </div>
              <p style={{ fontSize:12, color:T3, lineHeight:1.6, marginBottom: showRes ? 18 : 0 }}>
                Escrita de puño y letra en el <strong>anverso</strong> del finiquito, en las <strong>3 copias</strong>, antes de firmar ante el ministro de fe. Te permite cobrar y aún demandar por los conceptos indicados.
              </p>
              {showRes && (
                <div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:18 }}>
                    {MOTIVOS_RESERVA.map(m => (
                      <button key={m.id} type="button" className={`fq-mot${motivos.includes(m.id) ? " sel" : ""}`} onClick={() => toggleMotivo(m.id)}>
                        <span style={{ marginRight:8 }}>{motivos.includes(m.id) ? "✓" : "○"}</span>{m.label}
                      </button>
                    ))}
                  </div>
                  {textoReserva && (
                    <>
                      <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:T3, marginBottom:8 }}>TEXTO GENERADO:</p>
                      <div style={{ background:DK, border:`1.5px solid ${G}`, borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
                        <p style={{ fontSize:14, color:G, fontStyle:"italic", lineHeight:1.7 }}>{textoReserva}</p>
                      </div>
                      <button type="button" onClick={copiarTexto} style={{ ...btnP, fontSize:13, padding:"11px 0", marginBottom:14 }}>
                        {copiado ? "✓ Copiado" : "Copiar texto"}
                      </button>
                    </>
                  )}
                  <div style={{ background:"#1a1200", border:"1.5px solid #3d2d00", borderRadius:10, padding:"14px 16px" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#c8a84b", marginBottom:8 }}>Instrucciones legales</div>
                    <ul style={{ fontSize:12, color:"#c8a84b", lineHeight:1.9, paddingLeft:16 }}>
                      <li>Escríbela en el <strong>anverso</strong> del documento, cerca de la firma</li>
                      <li>Debe figurar en <strong>las 3 copias</strong> del finiquito</li>
                      <li>Hazlo <strong>antes de firmar</strong> ante el ministro de fe</li>
                      <li>Las frases genéricas como "me reservo todos mis derechos" pueden no ser válidas — sé específico/a</li>
                      <li>El empleador <strong>no puede negarse</strong> a pagar los montos no disputados aunque incluyas la reserva</li>
                    </ul>
                  </div>
                  <p style={{ fontSize:11, color:"#3a5a48", marginTop:12, lineHeight:1.6 }}>
                    Se recomienda asesorarse con un abogado laboral para redactar la reserva de derechos, especialmente en casos de despido injustificado o montos disputados. Esta calculadora es referencial.
                  </p>
                </div>
              )}
            </div>

            {/* Lead capture */}
            {!leadOk ? (
              <div style={{ background:C1, border:`1.5px solid ${B}`, borderRadius:14, padding:"20px", marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T1, marginBottom:4 }}>¿Quieres este desglose en tu correo?</div>
                <div style={{ fontSize:13, color:T3, marginBottom:14 }}>Resumen + guía de qué revisar antes de firmar. Sin spam.</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  <input className="fq-in" placeholder="Tu nombre" value={lead.nombre}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLead(p => ({ ...p, nombre:e.target.value }))}
                    style={{ padding:"11px 14px", background:DK, border:`1.5px solid ${B}`, borderRadius:8, color:T1, fontSize:14, fontFamily:"inherit" }} />
                  <input className="fq-in" type="email" placeholder="Tu correo" value={lead.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLead(p => ({ ...p, email:e.target.value }))}
                    style={{ padding:"11px 14px", background:DK, border:`1.5px solid ${B}`, borderRadius:8, color:T1, fontSize:14, fontFamily:"inherit" }} />
                </div>
                <button className="fq-bp" type="button" onClick={enviarLead} disabled={leadLoad} style={{ ...btnP, fontSize:14, opacity:leadLoad?0.7:1 }}>
                  {leadLoad ? "Enviando…" : "Enviar resumen gratis"}
                </button>
              </div>
            ) : (
              <div style={{ background:C1, border:`1.5px solid ${B}`, borderRadius:14, padding:"24px", textAlign:"center", marginBottom:16 }}>
                <div style={{ fontSize:24, color:G, marginBottom:8 }}>✓</div>
                <div style={{ fontSize:15, fontWeight:700, color:T1, marginBottom:4 }}>¡Listo, {lead.nombre}!</div>
                <div style={{ fontSize:13, color:T3 }}>Revisa tu correo en <strong style={{ color:T2 }}>{lead.email}</strong></div>
              </div>
            )}

            <button className="fq-bs" type="button" onClick={resetear} style={{ ...btnS, width:"100%", padding:"13px" }}>
              Hacer un nuevo cálculo
            </button>
          </div>
        )}

        <p style={{ textAlign:"center", fontSize:11, color:T3, marginTop:36, lineHeight:1.8 }}>
          UF: ${uf.toLocaleString("es-CL")} · Código del Trabajo Chile · Actualizado abril 2026 ·{" "}
          <a href="https://dotaciones.cl" style={{ color:G, textDecoration:"none" }}>dotaciones.cl</a><br />
          <span style={{ color:"#2a4a38" }}>Calculadora referencial. Consulta a un abogado laboral antes de firmar.</span>
        </p>
      </div>
    </div>
  );
}