// src/app/api/san/route.ts
import { NextResponse } from "next/server";
import { computeSAN2025 } from "@/lib/san/v2025/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = computeSAN2025(body);
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Error inesperado" },
      { status: 400 }
    );
  }
}