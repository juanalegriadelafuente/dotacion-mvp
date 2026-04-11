// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { resultados, sector, calculadora } = await req.json();

    // resultados = el output de la calculadora (mix contratos, cobertura, etc.)
    if (!resultados) {
      return NextResponse.json({ error: "Sin datos" }, { status: 400 });
    }

    const prompt = `Eres un experto en gestión de personas y legislación laboral chilena, parte del equipo de Nexwork SpA.

Un profesional de RRHH acaba de calcular su dotación usando dotaciones.cl.
Sector: ${sector || "no especificado"}
Calculadora usada: ${calculadora || "Retail / Servicios"}

Resultados del cálculo:
${JSON.stringify(resultados, null, 2)}

Entrega un análisis ejecutivo breve (máximo 4 párrafos) que incluya:
1. Qué significa este mix de contratos en términos prácticos
2. Riesgos o alertas legales relevantes (Código del Trabajo Chile)
3. Cómo presentar y defender esta dotación ante gerencia o directorio
4. Una recomendación concreta de próximo paso

Escribe en tono profesional pero cercano, en español chileno formal. No uses listas con bullet points, escribe en prosa fluida.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // Haiku: rápido y barato (~$0.001 por análisis)
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Anthropic error:", err);
      return NextResponse.json({ error: "Error generando análisis" }, { status: 500 });
    }

    const data = await res.json();
    const analisis = data.content[0].text;

    return NextResponse.json({ analisis });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}