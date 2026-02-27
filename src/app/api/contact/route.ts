import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function emailLooksOk(email: string) {
  if (!email) return true; // email opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: Request) {
  try {
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

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error" },
      { status: 500 },
    );
  }
}
