// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";

const NOTION_API_KEY        = process.env.NOTION_API_KEY!;
const NOTION_DATABASE_ID    = process.env.NOTION_LEADS_DATABASE_ID!;
const RESEND_API_KEY        = process.env.RESEND_API_KEY!;
const ANTHROPIC_API_KEY     = process.env.ANTHROPIC_API_KEY!;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function saveToNotion(payload: {
  nombre: string;
  email: string;
  empresa?: string;
  cargo?: string;
  sector?: string;
  calculadora?: string;
  fuente?: string;
}) {
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        Nombre:               { title: [{ text: { content: payload.nombre || payload.email } }] },
        Email:                { email: payload.email },
        Empresa:              { rich_text: [{ text: { content: payload.empresa || "" } }] },
        Cargo:                { rich_text: [{ text: { content: payload.cargo    || "" } }] },
        Estado:               { select: { name: "Nuevo" } },
        Fuente:               { select: { name: payload.fuente      || "Calculadora" } },
        ...(payload.sector      && { Sector:             { select: { name: payload.sector      } } }),
        ...(payload.calculadora && { "Calculadora usada": { select: { name: payload.calculadora } } }),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Notion error:", err);
    throw new Error("Error guardando en Notion");
  }
}

async function generateAnalisis(resultados: any, sector: string, calculadora: string): Promise<string> {
  const prompt = `Eres un experto en gestión de personas y legislación laboral chilena, parte del equipo de Nexwork SpA.

Un profesional de RRHH acaba de calcular su dotación en dotaciones.cl.
Sector: ${sector}
Calculadora: ${calculadora}

Estos son los datos EXACTOS del cálculo. Analiza ÚNICAMENTE lo que está aquí — no inventes datos, ratios ni situaciones que no estén en este JSON:

${JSON.stringify(resultados, null, 2)}

Escribe un análisis ejecutivo en exactamente 3 párrafos, en prosa corrida sin títulos ni bullet points:

PÁRRAFO 1 — Qué dice el resultado: Describe el mix sugerido usando solo los números del JSON. Menciona headcount, tipo de contratos, horas totales y holgura tal como aparecen.

PÁRRAFO 2 — Alertas legales: Menciona solo los riesgos del Código del Trabajo que sean directamente aplicables al tipo de contrato y jornada que aparece en el mix. Si no hay alertas evidentes, dilo brevemente.

PÁRRAFO 3 — Cómo presentarlo: Una recomendación concreta de cómo defender esta dotación ante gerencia o directorio, basada en los números reales.

Reglas: Sin títulos, sin #, sin **, sin bullets. Máximo 120 palabras por párrafo. Tono profesional, español chileno formal.`;

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
    throw new Error("Error generando análisis");
  }

  const data = await res.json();
  return data.content[0].text as string;
}

async function sendEmail(payload: {
  to: string;
  nombre: string;
  analisis: string;
  calculadora: string;
}) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu análisis de dotación</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto 40px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">

    <!-- Header -->
    <div style="padding:24px 32px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <p style="margin:0;font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">
          dotaciones<span style="color:#2563eb;">.cl</span>
        </p>
        <p style="margin:3px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;">
          Nexwork SpA
        </p>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:4px 10px;">
        <p style="margin:0;font-size:11px;font-weight:600;color:#1d4ed8;">${payload.calculadora}</p>
      </div>
    </div>

    <!-- Cuerpo -->
    <div style="padding:32px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#0f172a;">
        Hola${payload.nombre ? ` ${payload.nombre}` : ""},
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
        Aquí está el análisis de tu dotación generado por nuestro equipo. Lo encontrarás también disponible en la calculadora.
      </p>

      <!-- Análisis -->
      <div style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;border-left:3px solid #2563eb;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">
          Análisis ejecutivo
        </p>
        <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.75;white-space:pre-wrap;">${payload.analisis}</p>
      </div>

      <!-- CTA -->
      <p style="margin:0 0 20px;font-size:13px;color:#64748b;line-height:1.6;">
        ¿Quieres ajustar tu dotación o calcular un escenario distinto? Vuelve a la calculadora cuando quieras.
      </p>
      <a href="https://dotaciones.cl/calculadora"
         style="display:inline-block;padding:11px 22px;background:#0f172a;color:#ffffff;font-size:13px;font-weight:600;border-radius:6px;text-decoration:none;letter-spacing:0.01em;">
        Volver a la calculadora →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:18px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
        © ${new Date().getFullYear()} dotaciones.cl · Nexwork SpA · Chile<br>
        Recibiste este correo porque solicitaste un análisis IA en dotaciones.cl.
      </p>
    </div>

  </div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Dotaciones <no-reply@dotaciones.cl>",
      to: [payload.to],
      subject: "Tu análisis de dotación — Nexwork SpA",
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Resend error:", err);
    throw new Error("Error enviando email");
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nombre,
      email,
      empresa,
      cargo,
      sector,
      calculadora,
      fuente,
      resultados,   // datos del cálculo para generar el análisis IA
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // 1. Guardar en Notion (no bloquea si falla)
    try {
      await saveToNotion({ nombre, email, empresa, cargo, sector, calculadora, fuente });
    } catch (e) {
      console.error("Notion save failed (non-fatal):", e);
    }

    // 2. Generar análisis IA (solo si vienen datos del cálculo)
    let analisis: string | null = null;
    if (resultados) {
      try {
        analisis = await generateAnalisis(
          resultados,
          sector || "Retail / Servicios",
          calculadora || "Retail / Servicios",
        );
      } catch (e) {
        console.error("Análisis IA failed (non-fatal):", e);
      }
    }

    // 3. Enviar email con el análisis (solo si hay análisis)
    if (analisis && email) {
      try {
        await sendEmail({
          to: email,
          nombre: nombre || "",
          analisis,
          calculadora: calculadora || "Retail / Servicios",
        });
      } catch (e) {
        console.error("Email send failed (non-fatal):", e);
      }
    }

    return NextResponse.json({ ok: true, analisis });
  } catch (e) {
    console.error("leads route error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
