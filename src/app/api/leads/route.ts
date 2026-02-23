// src/app/api/leads/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function json(data: any, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { "Cache-Control": "no-store" },
  });
}

function isValidEmail(email: string) {
  // simple + efectivo para API
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function normalizeToField(raw: string) {
  // acepta:
  // 1) email@dominio.com
  // 2) Nombre <email@dominio.com>
  const s = String(raw ?? "").trim();
  if (!s) return "";

  // Si viene como "Nombre <email@dominio>"
  const m = s.match(/<([^>]+)>/);
  const email = (m?.[1] ?? s).trim();

  if (!isValidEmail(email)) return "";

  // Resend acepta string o array de strings. Usamos string simple.
  return email;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env SUPABASE_URL");
  if (!key) throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const emailRaw = String(body?.email ?? "");
    const email = normalizeToField(emailRaw);

    const role = body?.role ? String(body.role).slice(0, 120) : null;
    const company_size = body?.company_size ? String(body.company_size).slice(0, 120) : null;
    const city = body?.city ? String(body.city).slice(0, 120) : null;
    const source = body?.source ? String(body.source).slice(0, 120) : "dotaciones.cl";

    const calc_input = body?.calc_input ?? null;
    const calc_result = body?.calc_result ?? null;

    if (!email) {
      return json({ ok: false, error: "Email inválido. Usa formato email@dominio.com" }, { status: 400 });
    }

    // Seguridad mínima: evitar payload gigante
    const inputSize = calc_input ? JSON.stringify(calc_input).length : 0;
    const resultSize = calc_result ? JSON.stringify(calc_result).length : 0;
    if (inputSize > 200_000 || resultSize > 200_000) {
      return json({ ok: false, error: "Payload demasiado grande." }, { status: 413 });
    }

    // 1) Guardar lead en Supabase (ADMIN)
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        email,
        role,
        company_size,
        city,
        source,
        calc_input,
        calc_result,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return json({ ok: false, error: error?.message ?? "Error guardando lead." }, { status: 500 });
    }

    const id = data.id as string;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dotaciones.cl";
    const reportUrl = `${siteUrl.replace(/\/$/, "")}/reporte/${id}`;

    // 2) Enviar email por Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      // No frenamos el flujo: guardamos lead igual y devolvemos link
      return json({
        ok: true,
        id,
        reportUrl,
        emailSent: false,
        warning: "RESEND_API_KEY no configurada. Lead guardado igual.",
      });
    }

    const resend = new Resend(resendKey);

    // IMPORTANTE: usa un FROM que esté verificado en Resend.
    // Si verificaste subdominio "send.dotaciones.cl", usa no-reply@send.dotaciones.cl
    const from = process.env.RESEND_FROM || "Dotaciones <no-reply@dotaciones.cl>";

    const subject = "Tu reporte de dotación (Dotaciones.cl)";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin: 0 0 12px 0;">Tu reporte está listo</h2>
        <p style="margin: 0 0 14px 0;">
          Aquí tienes tu link:
        </p>
        <p style="margin: 0 0 18px 0;">
          <a href="${reportUrl}" target="_blank" rel="noopener noreferrer">${reportUrl}</a>
        </p>
        <p style="margin: 0; color:#555; font-size: 12px;">
          Dotaciones.cl — herramienta gratuita para estimar dotación y mixes.
        </p>
      </div>
    `;

    const sendResp = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    });

    // Si Resend responde error, lo mostramos claro
    if ((sendResp as any)?.error) {
      return json({
        ok: true,
        id,
        reportUrl,
        emailSent: false,
        resendError: (sendResp as any).error,
      });
    }

    return json({
      ok: true,
      id,
      reportUrl,
      emailSent: true,
      resendId: (sendResp as any)?.data?.id ?? null,
    });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "Error" }, { status: 500 });
  }
}