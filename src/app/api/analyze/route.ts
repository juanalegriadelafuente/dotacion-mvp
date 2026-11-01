import { type NextRequest, NextResponse } from "next/server";
import { origenValido } from "@/lib/proteccion";
import { resumenSan } from "@/lib/resumen-dotacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** El cálculo de una calculadora cabe de sobra en 8 KB. */
const MAX_CUERPO = 8_000;

export async function POST(req: NextRequest) {
  try {
    if (!origenValido(req)) {
      return NextResponse.json(
        { error: "Origen no permitido" },
        { status: 403 },
      );
    }

    const crudo = await req.text();
    if (crudo.length > MAX_CUERPO) {
      return NextResponse.json(
        { error: "Datos demasiado grandes" },
        { status: 413 },
      );
    }
    const { resultados } = JSON.parse(crudo);

    if (!resultados || typeof resultados !== "object") {
      return NextResponse.json({ error: "Sin datos" }, { status: 400 });
    }

    return NextResponse.json({ analisis: resumenSan(resultados) });
  } catch (e) {
    console.error("analyze:", String(e));
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
