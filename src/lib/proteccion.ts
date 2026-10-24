// src/lib/proteccion.ts
//
// Frenos para las rutas públicas que gastan plata o reputación: llamadas a
// Claude (Anthropic) y correos que salen desde dotaciones.cl (Resend).
//
// Dos capas, porque en Vercel cada instancia tiene su propia memoria:
// 1. Memoria de la instancia: corta ráfagas al tiro y sin red.
// 2. Contador diario en Supabase (función `incrementar_uso`, ver
//    supabase/uso_diario.sql): el tope que de verdad manda, compartido por todas
//    las instancias.
//
// Si el contador de Supabase no responde, se CIERRA (fail-closed): el análisis
// con IA o el correo no salen, pero la calculadora sigue funcionando. Preferimos
// perder un análisis a pagar un bucle de otro.
//
// Ni la IP ni el correo se guardan en claro: se guarda un hash con sal
// (Ley 21.719, minimización).
import "server-only";
import { createHash } from "node:crypto";

const ORIGENES_PERMITIDOS = new Set([
  "https://dotaciones.cl",
  "https://www.dotaciones.cl",
]);

/** Previews de Vercel de este proyecto y desarrollo local. */
function origenDePrueba(origen: string): boolean {
  return (
    /^https:\/\/dotacion-mvp-[a-z0-9-]+\.vercel\.app$/.test(origen) ||
    /^http:\/\/localhost:\d+$/.test(origen)
  );
}

/**
 * El navegador manda `Origin` en todo POST. No detiene a un script (puede
 * falsificarlo), pero sí a que otra página use nuestras rutas desde el
 * navegador de sus visitas.
 */
export function origenValido(req: Request): boolean {
  const origen = req.headers.get("origin");
  if (!origen) return false;
  return ORIGENES_PERMITIDOS.has(origen) || origenDePrueba(origen);
}

export function ipDe(req: Request): string {
  // En Vercel, el primer valor de x-forwarded-for lo pone la plataforma.
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "sin-ip";
}

export function huella(valor: string): string {
  const sal = process.env.PROTECCION_SAL ?? "dotaciones";
  return createHash("sha256")
    .update(`${sal}:${valor.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 32);
}

// ─── Capa 1: memoria de la instancia ─────────────────────────────────────────

const ventanas = new Map<string, number[]>();

function superaEnMemoria(clave: string, maximo: number, ventanaMs: number) {
  const ahora = Date.now();
  const recientes = (ventanas.get(clave) ?? []).filter(
    (t) => ahora - t < ventanaMs,
  );
  if (recientes.length >= maximo) {
    ventanas.set(clave, recientes);
    return true;
  }
  recientes.push(ahora);
  ventanas.set(clave, recientes);
  if (ventanas.size > 5000) ventanas.clear(); // tope de memoria
  return false;
}

// ─── Capa 2: contador diario compartido (Supabase) ───────────────────────────

async function dentroDelTopeDiario(clave: string, tope: number) {
  try {
    // Import diferido: supabaseServer lanza error al importarse si faltan las
    // variables, y eso no debe botar la ruta entera.
    const { supabaseAdmin } = await import("@/lib/supabaseServer");
    const { data, error } = await supabaseAdmin.rpc("incrementar_uso", {
      p_clave: clave,
      p_tope: tope,
    });
    if (error) {
      console.error("proteccion: contador diario no disponible", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("proteccion: contador diario no disponible", String(e));
    return false;
  }
}

// ─── API ─────────────────────────────────────────────────────────────────────

/** Topes por día, configurables por variable de entorno. */
function tope(nombre: string, porDefecto: number): number {
  const v = Number(process.env[nombre]);
  return Number.isFinite(v) && v > 0 ? v : porDefecto;
}

/**
 * ¿Se puede gastar en una llamada a Claude ahora? Por IP: 5 por hora y 10 al día.
 * Global: 200 al día (con Haiku y 800 tokens de salida, del orden de USD 1 al día
 * en el peor caso). Ajustable con IA_TOPE_IP_DIA e IA_TOPE_GLOBAL_DIA.
 */
export async function permiteIA(req: Request): Promise<boolean> {
  const ip = huella(ipDe(req));
  if (superaEnMemoria(`ia:${ip}`, 5, 60 * 60 * 1000)) return false;
  if (!(await dentroDelTopeDiario(`ia:ip:${ip}`, tope("IA_TOPE_IP_DIA", 10))))
    return false;
  return dentroDelTopeDiario("ia:global", tope("IA_TOPE_GLOBAL_DIA", 200));
}

/**
 * ¿Se puede mandar un correo a esta dirección? Máximo 3 al día por dirección
 * (nadie pide más de tres resultados al día) y 300 al día en total, para que
 * nadie use dotaciones.cl para llenar la casilla de otro.
 */
export async function permiteCorreo(
  req: Request,
  destino: string,
): Promise<boolean> {
  const ip = huella(ipDe(req));
  if (superaEnMemoria(`correo:${ip}`, 10, 60 * 60 * 1000)) return false;
  if (
    !(await dentroDelTopeDiario(
      `correo:dest:${huella(destino)}`,
      tope("CORREO_TOPE_DESTINO_DIA", 3),
    ))
  )
    return false;
  return dentroDelTopeDiario(
    "correo:global",
    tope("CORREO_TOPE_GLOBAL_DIA", 300),
  );
}

export function correoValido(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.length <= 180 &&
    /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(email.trim())
  );
}

/** Para interpolar texto del usuario en el HTML de un correo. */
export function escaparHtml(texto: unknown, maximo = 300): string {
  return String(texto ?? "")
    .slice(0, maximo)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Deja en `resultados` solo números, booleanos, textos cortos y estructuras
 * chicas. Lo que llega a Claude no puede ser un párrafo arbitrario: sería una
 * puerta para usarnos de proxy gratis («ignora lo anterior y escribe…»).
 */
export function limpiarResultados(valor: unknown, profundidad = 0): unknown {
  if (profundidad > 4) return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor === "boolean" || valor === null) return valor;
  if (typeof valor === "string") return valor.slice(0, 80);
  if (Array.isArray(valor))
    return valor.slice(0, 20).map((v) => limpiarResultados(v, profundidad + 1));
  if (typeof valor === "object") {
    const salida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>).slice(
      0,
      40,
    )) {
      salida[k.slice(0, 40)] = limpiarResultados(v, profundidad + 1);
    }
    return salida;
  }
  return null;
}

/** Opciones fijas para los textos que van al prompt. */
export function unoDe<T extends string>(
  valor: unknown,
  opciones: readonly T[],
  porDefecto: T,
): T {
  return opciones.includes(valor as T) ? (valor as T) : porDefecto;
}
