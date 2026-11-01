// src/lib/proteccion.ts
//
// Frenos para las rutas públicas que gastan plata o reputación: los correos que
// salen del sitio (Resend).
//
// Dos capas, porque en Vercel cada instancia tiene su propia memoria:
// 1. Memoria de la instancia: corta ráfagas al tiro y sin red.
// 2. Contador diario en Supabase (función `incrementar_uso`, ver
//    supabase/uso_diario.sql): el tope que de verdad manda, compartido por todas
//    las instancias.
//
// Si el contador de Supabase no responde, el correo sigue saliendo, frenado solo
// por la memoria de la instancia: el interesado que dejó su correo tiene que
// recibir su resultado.
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

/** `true`/`false` según el tope; `null` si el contador no está disponible. */
async function dentroDelTopeDiario(
  clave: string,
  tope: number,
): Promise<boolean | null> {
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
      return null;
    }
    return data === true;
  } catch (e) {
    console.error("proteccion: contador diario no disponible", String(e));
    return null;
  }
}

// ─── API ─────────────────────────────────────────────────────────────────────

/** Topes por día, configurables por variable de entorno. */
function tope(nombre: string, porDefecto: number): number {
  const v = Number(process.env[nombre]);
  return Number.isFinite(v) && v > 0 ? v : porDefecto;
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
  const porDestino = await dentroDelTopeDiario(
    `correo:dest:${huella(destino)}`,
    tope("CORREO_TOPE_DESTINO_DIA", 3),
  );
  if (porDestino === false) return false;
  const global = await dentroDelTopeDiario(
    "correo:global",
    tope("CORREO_TOPE_GLOBAL_DIA", 300),
  );
  return global !== false;
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
