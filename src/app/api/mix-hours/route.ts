// src/app/api/mix-hours/route.ts
import { NextResponse } from "next/server";
import { computeMixHours } from "@/lib/mix/mixHours";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const requiredHours = Number(body?.requiredHours ?? 0);
    const maxWeekHours = Number(body?.maxWeekHours ?? 42);

    // contractsHours opcional (si después quieres que el usuario elija)
    const contractsHours = Array.isArray(body?.contractsHours)
      ? body.contractsHours.map((x: any) => Number(x))
      : undefined;

    const result = computeMixHours({
      requiredHours,
      maxWeekHours,
      minContractHours: 20,
      contractsHours,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.note ?? "No se pudo calcular mix" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Error inesperado" },
      { status: 400 }
    );
  }
}