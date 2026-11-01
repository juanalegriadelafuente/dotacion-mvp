// src/app/api/cron/lista-revision/route.ts
//
// Una vez al día (vercel.json) manda los correos que tocan. Vercel se identifica
// con CRON_SECRET; sin esa variable, la ruta no responde a nadie.
//
// El correo del Kit espera mientras el Kit no se pueda comprar: no se ofrece lo
// que no se vende. Al enviarlo, la fila se borra.
import { NextResponse } from "next/server";
import {
  correoKit,
  correoSaliente,
  proximoEnvio,
  URL_SITIO,
} from "@/lib/correos-lista";
import { enviarCorreoLista } from "@/lib/enviar-lista";

const API_TIENDA =
  process.env.NEXT_PUBLIC_TIENDA_URL ?? "https://api.kaden.cl/api/v1/tienda";
const KIT_TURNOS = "kit_turnos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resend admite 2 correos por segundo; 50 por corrida caben con holgura. */
const POR_CORRIDA = 50;
const PAUSA_MS = 600;

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** El precio del Kit si hoy se puede comprar; si no, `null`. */
async function precioDelKit(): Promise<number | null> {
  try {
    const [tienda, pagina] = await Promise.all([
      fetch(`${API_TIENDA}/productos/${KIT_TURNOS}`, { cache: "no-store" }),
      fetch(`${URL_SITIO}/kit-turnos`, { cache: "no-store" }),
    ]);
    if (!tienda.ok || !pagina.ok) return null;
    const producto = await tienda.json();
    return producto.disponible === true ? Number(producto.precio) : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return new NextResponse(null, { status: 401 });
  }
  // Import diferido: supabaseServer lanza error si faltan las variables.
  const { supabaseAdmin } = await import("@/lib/supabaseServer");

  const ahora = new Date();
  const precio = await precioDelKit();

  let consulta = supabaseAdmin
    .from("lista_revision")
    .select("correo, token_baja, ultimo_correo")
    .lte("proximo_envio", ahora.toISOString())
    .order("proximo_envio")
    .limit(POR_CORRIDA);
  // Sin Kit a la venta, quienes esperan ese correo no ocupan cupo de la corrida.
  if (precio === null) consulta = consulta.eq("ultimo_correo", 1);

  const { data, error } = await consulta;
  if (error) {
    console.error("lista-revision: no se pudo leer", error.code);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  let enviados = 0;
  let fallidos = 0;
  for (const fila of data ?? []) {
    const { correo, token_baja: token, ultimo_correo: ultimo } = fila;
    const mensaje =
      ultimo === 1 ? correoSaliente(token) : correoKit(token, precio as number);
    if (await enviarCorreoLista(correo, token, mensaje)) {
      enviados += 1;
      const cambio =
        ultimo === 1
          ? supabaseAdmin
              .from("lista_revision")
              .update({
                ultimo_correo: 2,
                proximo_envio: proximoEnvio(2, ahora).toISOString(),
              })
              .eq("token_baja", token)
          : supabaseAdmin
              .from("lista_revision")
              .delete()
              .eq("token_baja", token);
      const { error: errorCambio } = await cambio;
      if (errorCambio) {
        console.error("lista-revision: no se pudo avanzar", errorCambio.code);
      }
    } else {
      // Queda como está y se reintenta mañana.
      fallidos += 1;
    }
    await pausa(PAUSA_MS);
  }

  return NextResponse.json({ ok: true, enviados, fallidos });
}
