import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { resultados, sector, calculadora } = await req.json();

    if (!resultados) {
      return NextResponse.json({ error: "Sin datos" }, { status: 400 });
    }

    const prompt = `Eres un experto en gestión de personas y legislación laboral chilena, parte del equipo de Nexwork SpA.

Un profesional de RRHH acaba de calcular su dotación en dotaciones.cl.
Sector: ${sector || "no especificado"}
Calculadora: ${calculadora || "Retail / Servicios"}

Estos son los datos EXACTOS del cálculo. Analiza ÚNICAMENTE lo que está aquí — no inventes datos, ratios, porcentajes ni situaciones que no estén en este JSON:

${JSON.stringify(resultados, null, 2)}

Escribe un análisis ejecutivo en exactamente 3 párrafos, en prosa corrida sin títulos ni bullet points:

PÁRRAFO 1 — Qué dice el resultado: Describe el mix sugerido usando solo los números del JSON. Menciona headcount, tipo de contratos, horas totales y holgura tal como aparecen. Nada más.

PÁRRAFO 2 — Alertas legales: Menciona solo los riesgos del Código del Trabajo que sean directamente aplicables al tipo de contrato y jornada que aparece en el mix. Si el mix es correcto y no hay alertas evidentes, dilo brevemente. No inventes riesgos hipotéticos.

PÁRRAFO 3 — Cómo presentarlo: Una recomendación concreta y breve de cómo defender esta dotación ante gerencia o directorio, basada en los números reales del cálculo.

Reglas de formato:
- Sin títulos, sin #, sin **, sin bullet points
- Máximo 120 palabras por párrafo
- Tono profesional y directo, español chileno formal
- Si un dato no está en el JSON, no lo menciones`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
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