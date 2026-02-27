// src/app/api/leads/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function normalizeEmail(raw: string) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const m = s.match(/<([^>]+)>/); // "Nombre <email@dominio>"
  const email = (m?.[1] ?? s).trim();
  return isValidEmail(email) ? email : "";
}

function safeStr(x: any, max = 120) {
  const s = String(x ?? "").trim();
  return s ? s.slice(0, max) : null;
}

function safeInt(x: any) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
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

    const email = normalizeEmail(body?.email ?? "");
    if (!email) return json({ ok: false, error: "Email inválido." }, 400);

    // ✅ nuevos campos
    const full_name = safeStr(body?.full_name ?? body?.name, 120);
    const role = safeStr(body?.role, 120);
    const industry = safeStr(body?.industry, 120);
    const employees = safeInt(body?.employees);

    // ✅ campos antiguos (compatibilidad)
    const company_size = safeStr(body?.company_size, 120);
    const city = safeStr(body?.city, 120);
    const source = safeStr(body?.source, 120) ?? "dotaciones.cl";

    const calc_input = body?.calc_input ?? null;
    const calc_result = body?.calc_result ?? null;

    // Seguridad mínima: evitar payload gigante
    const inputSize = calc_input ? JSON.stringify(calc_input).length : 0;
    const resultSize = calc_result ? JSON.stringify(calc_result).length : 0;
    if (inputSize > 200_000 || resultSize > 200_000) {
      return json({ ok: false, error: "Payload demasiado grande." }, 413);
    }

    // 1) Guardar lead
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        email,
        full_name,
        role,
        industry,
        employees,
        company_size,
        city,
        source,
        calc_input,
        calc_result,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return json(
        { ok: false, error: error?.message ?? "Error guardando lead." },
        500,
      );
    }

    const id = String(data.id);
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://dotaciones.cl"
    ).replace(/\/$/, "");
    const reportUrl = `${siteUrl}/reporte/${id}`;

    // 2) Enviar email
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return json({
        ok: true,
        id,
        reportUrl,
        emailSent: false,
        warning: "RESEND_API_KEY no configurada en este ambiente.",
      });
    }

    const from =
      process.env.RESEND_FROM || "Dotaciones <no-reply@dotaciones.cl>";
    const resend = new Resend(resendKey);

    const subject = "Tu reporte de dotación (Dotaciones.cl)";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.5;">
        <h2 style="margin:0 0 12px 0;">Tu reporte está listo</h2>
        <p style="margin:0 0 14px 0;">Aquí tienes tu link:</p>
        <p style="margin:0 0 18px 0;">
          <a href="${reportUrl}" target="_blank" rel="noopener noreferrer">${reportUrl}</a>
        </p>
        <p style="margin:0;color:#555;font-size:12px;">
          Dotaciones.cl — herramienta gratuita.
        </p>
      </div>
    `;

    const sendResp = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    });

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
    return json({ ok: false, error: e?.message ?? "Error" }, 500);
  }
}
