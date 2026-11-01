// src/app/api/lista-revision/route.ts
//
// Recibe el correo y manda la lista. Responde lo mismo si la dirección ya estaba
// inscrita: esta ruta no sirve para averiguar quién está en la lista.
import { NextResponse } from "next/server";
import { correoLista, proximoEnvio } from "@/lib/correos-lista";
import { enviarCorreoLista } from "@/lib/enviar-lista";
import { correoValido, origenValido, permiteCorreo } from "@/lib/proteccion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!origenValido(req)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let cuerpo: { correo?: unknown; acepta?: unknown; sitio?: unknown };
  try {
    const texto = await req.text();
    if (texto.length > 1000) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }
    cuerpo = JSON.parse(texto);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // `sitio` es un campo que una persona no ve: si viene lleno, es un bot.
  if (cuerpo.sitio) return NextResponse.json({ ok: true });
  if (!correoValido(cuerpo.correo) || cuerpo.acepta !== true) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const correo = cuerpo.correo.trim().toLowerCase();

  if (!(await permiteCorreo(req, correo))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  // Import diferido: supabaseServer lanza error si faltan las variables.
  const { supabaseAdmin } = await import("@/lib/supabaseServer");
  const ahora = new Date();
  const { data, error } = await supabaseAdmin
    .from("lista_revision")
    .upsert(
      { correo, proximo_envio: proximoEnvio(1, ahora).toISOString() },
      { onConflict: "correo", ignoreDuplicates: true },
    )
    .select("token_baja");
  if (error) {
    console.error("lista-revision: no se pudo guardar", error.code);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  const token = data?.[0]?.token_baja as string | undefined;
  if (!token) return NextResponse.json({ ok: true }); // ya estaba inscrita

  if (!(await enviarCorreoLista(correo, token, correoLista(token)))) {
    // Sin la lista no hay inscripción: que pueda volver a intentarlo.
    await supabaseAdmin.from("lista_revision").delete().eq("token_baja", token);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
