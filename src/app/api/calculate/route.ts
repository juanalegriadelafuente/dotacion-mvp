import { NextResponse } from "next/server";
import { calculate, type CalcInput } from "@/lib/engine";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CalcInput;
    const result = calculate(body);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}