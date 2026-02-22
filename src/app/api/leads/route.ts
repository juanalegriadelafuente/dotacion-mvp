// src/app/api/leads/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function isValidEmail(email: string) {
  // simple y suficiente para MVP
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = body?.role ?? null;
    const company_size = body?.company_size ?? null;
    const city = body?.city ?? null;
    const source = body?.source ?? "dotaciones.cl";

    const calc_input = body?.calc_input ?? null;
    const calc_result = body?.calc_result ?? null;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido." }, { status: 400 });
    }

    // Seguridad mínima: evitamos guardar basura gigante
    const inputSize = calc_input ? JSON.stringify(calc_input).length : 0;
    const resultSize = calc_result ? JSON.stringify(calc_result).length : 0;

    // 200 KB cada uno, ajustable
    if (inputSize > 200_000 || resultSize > 200_000) {
      return NextResponse.json({ ok: false, error: "Payload demasiado grande." }, { status: 413 });
    }

    const { data, error } = await supabaseAdmin
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

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error inesperado." },
      { status: 500 }
    );
  }
}