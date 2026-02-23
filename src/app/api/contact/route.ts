// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email ?? "").trim());
}

function safeStr(x: any, max = 2000) {
  const s = String(x ?? "").trim();
  return s ? s.slice(0, max) : null;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing env SUPABASE_URL");
  if (!key) throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = safeStr(body?.name, 120);
    const email = safeStr(body?.email, 200);
    const message = safeStr(body?.message, 2000);
    const page = safeStr(body?.page, 200);

    if (!message) return json({ ok: false, error: "Mensaje obligatorio." }, 400);
    if (email && !isValidEmail(email)) return json({ ok: false, error: "Email inválido." }, 400);

    const ua = safeStr(req.headers.get("user-agent"), 300);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({ name, email, message, page, user_agent: ua })
      .select("id")
      .single();

    if (error || !data?.id) {
      return json({ ok: false, error: error?.message ?? "Error guardando mensaje." }, 500);
    }

    // Opcional: mandar correo al admin si está configurado
    const to = process.env.CONTACT_TO_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;

    if (to && resendKey) {
      const resend = new Resend(resendKey);
      const from = process.env.RESEND_FROM || "Dotaciones <no-reply@dotaciones.cl>";

      const subject = `Contacto Dotaciones.cl — ${name ?? "Sin nombre"}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height:1.5;">
          <h3 style="margin:0 0 10px 0;">Nuevo mensaje de contacto</h3>
          <p style="margin:0 0 8px 0;"><b>Nombre:</b> ${name ?? "-"}</p>
          <p style="margin:0 0 8px 0;"><b>Email:</b> ${email ?? "-"}</p>
          <p style="margin:0 0 8px 0;"><b>Página:</b> ${page ?? "-"}</p>
          <p style="margin:12px 0 0 0;"><b>Mensaje:</b></p>
          <div style="padding:12px;border:1px solid #ddd;border-radius:10px;margin-top:8px;">
            ${String(message).replace(/\n/g, "<br/>")}
          </div>
        </div>
      `;

      const sendResp = await resend.emails.send({ from, to, subject, html });
      if ((sendResp as any)?.error) {
        return json({ ok: true, id: data.id, emailSent: false, warning: (sendResp as any).error });
      }
    }

    return json({ ok: true, id: data.id });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "Error" }, 500);
  }
}