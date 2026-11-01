import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  escaparHtml,
  ipDe,
  origenValido,
  permiteCorreo,
} from "@/lib/proteccion";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emailLooksOk(email: string) {
  if (!email) return true; // email opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Avisa a Juan que llegó un mensaje. El mensaje ya quedó guardado: si el aviso
 * falla o supera el freno, la persona igual ve que se envió, y el error queda en
 * los registros sin datos personales.
 */
async function avisar(
  req: Request,
  datos: { name: string; email: string; message: string },
) {
  try {
    if (!(await permiteCorreo(req, datos.email || ipDe(req)))) {
      console.error("contacto: aviso frenado");
      return;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: "Dotaciones <no-reply@kaden.cl>",
        to: [process.env.NOTIFY_EMAIL || "juan.alegria.delafuente@gmail.com"],
        ...(datos.email ? { reply_to: datos.email } : {}),
        subject: "Nuevo mensaje en dotaciones.cl",
        html: `<p style="font-family:Arial;font-size:14px;color:#0f172a"><strong>${escaparHtml(datos.name || "Sin nombre", 120)}</strong> (${escaparHtml(datos.email || "sin correo", 180)})</p><p style="font-family:Arial;font-size:14px;color:#0f172a;white-space:pre-wrap">${escaparHtml(datos.message, 4000)}</p>`,
      }),
    });
    if (!res.ok) console.error("contacto: Resend respondió", res.status);
  } catch {
    console.error("contacto: no se pudo enviar el aviso");
  }
}

export async function POST(req: Request) {
  try {
    if (!origenValido(req)) {
      return NextResponse.json(
        { ok: false, error: "Origen no permitido." },
        { status: 403 },
      );
    }
    const body = await req.json();

    const name = String(body?.name ?? "")
      .trim()
      .slice(0, 120);
    const email = String(body?.email ?? "")
      .trim()
      .slice(0, 180);
    const message = String(body?.message ?? "")
      .trim()
      .slice(0, 4000);
    const page = String(body?.page ?? "")
      .trim()
      .slice(0, 200);

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Mensaje vacío." },
        { status: 400 },
      );
    }
    if (!emailLooksOk(email)) {
      return NextResponse.json(
        { ok: false, error: "Email inválido." },
        { status: 422 },
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 },
      );
    }

    // IMPORTANTE: service role bypass RLS
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.from("contact_messages").insert({
      name: name || null,
      email: email || null,
      message,
      page: page || "/contacto",
      source: "dotaciones",
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    await avisar(req, { name, email, message });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error" },
      { status: 500 },
    );
  }
}
