// src/app/api/leads/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

type LeadPayload = {
  email: string;
  role?: string;
  company_size?: string;
  city?: string;
  calc_input?: any;
  calc_result?: any;
};

function isEmail(x: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadPayload;

    const email = (body.email ?? "").trim().toLowerCase();
    if (!email || !isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    const role = (body.role ?? "").trim().slice(0, 80) || null;
    const company_size = (body.company_size ?? "").trim().slice(0, 80) || null;
    const city = (body.city ?? "").trim().slice(0, 80) || null;

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert([
        {
          email,
          role,
          company_size,
          city,
          source: "dotaciones.cl",
          calc_input: body.calc_input ?? null,
          calc_result: body.calc_result ?? null,
        },
      ])
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 500 });
  }
}