// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

const NOTION_API_KEY     = process.env.NOTION_API_KEY!;
const NOTION_DATABASE_ID = process.env.NOTION_LEADS_DATABASE_ID!;
const RESEND_API_KEY     = process.env.RESEND_API_KEY!;
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY!;
const NOTIFY_EMAIL       = process.env.NOTIFY_EMAIL || "juan.alegria.delafuente@gmail.com";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Mapa de source → nombre legible ─────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  "calculadora-finiquito":      "Calculadora Finiquito",
  "calculadora-retail":         "Calculadora Retail",
  "calculadora_gate":           "Calculadora Retail (gate)",
  "calculadora_resultados":     "Calculadora Retail (resultados)",
  "calculadora-san":            "Calculadora SAN",
  "blog-san":                   "Blog SAN",
  "blog":                       "Blog",
  "contacto":                   "Formulario Contacto",
};

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source ?? "Web";
}

// ─── Notion ───────────────────────────────────────────────────────────────────

async function saveToNotion(payload: {
  nombre: string; email: string; empresa?: string;
  cargo?: string; sector?: string; calculadora?: string;
  fuente?: string; origen?: string;
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
        Fuente:               { select: { name: payload.fuente  || "Web" } },
        ...(payload.sector      && { Sector:             { select: { name: payload.sector      } } }),
        ...(payload.calculadora && { "Calculadora usada": { select: { name: payload.calculadora } } }),
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    // Lanzar el error para que sea visible en logs y respuesta de diagnóstico
    throw new Error(`Notion API error ${res.status}: ${JSON.stringify(err)}`);
  }
}

// ─── Diagnóstico (GET /api/leads) ─────────────────────────────────────────────

export async function GET() {
  const results: Record<string, unknown> = {
    notion_key_set:  !!NOTION_API_KEY,
    notion_db_set:   !!NOTION_DATABASE_ID,
    resend_key_set:  !!RESEND_API_KEY,
    anthropic_key_set: !!ANTHROPIC_API_KEY,
  };

  // Verificar acceso a la base de datos de Notion
  if (NOTION_API_KEY && NOTION_DATABASE_ID) {
    try {
      const r = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
        },
      });
      results.notion_db_accessible = r.ok;
      if (!r.ok) {
        results.notion_db_error = await r.json();
      } else {
        const db = await r.json();
        results.notion_db_title     = db.title?.[0]?.plain_text ?? "sin título";
        results.notion_db_props     = Object.keys(db.properties ?? {});
      }
    } catch (e) {
      results.notion_db_error = String(e);
    }
  }

  return NextResponse.json(results);
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function generateAnalisis(
  resultados: Record<string, unknown>, sector: string, calculadora: string,
): Promise<string> {
  const prompt = `Eres un experto en gestión de personas y legislación laboral chilena, parte del equipo de Nexwork SpA.

Un profesional de RRHH acaba de calcular su dotación en dotaciones.cl.
Sector: ${sector}
Calculadora: ${calculadora}

Estos son los datos EXACTOS del cálculo. Analiza ÚNICAMENTE lo que está aquí — no inventes datos ni situaciones que no estén en este JSON:

${JSON.stringify(resultados, null, 2)}

Escribe un análisis ejecutivo en exactamente 3 párrafos, en prosa corrida sin títulos ni bullet points:

PÁRRAFO 1 — Qué dice el resultado: Describe el mix sugerido usando solo los números del JSON.

PÁRRAFO 2 — Alertas legales: Menciona solo los riesgos del Código del Trabajo directamente aplicables. Si no hay alertas evidentes, dilo brevemente.

PÁRRAFO 3 — Cómo presentarlo: Recomendación concreta para defender esta dotación ante gerencia.

Reglas: Sin títulos, sin #, sin **, sin bullets. Máximo 120 palabras por párrafo. Español chileno formal.`;

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

// ─── Excel en memoria ─────────────────────────────────────────────────────────

async function buildExcel(mixes: Record<string, unknown>[], hasCosts: boolean, meta: {
  requiredHours: number; requiredHoursAdjusted: number;
  fte: number; fteAdjusted: number; replacementFactor: number;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "dotaciones.cl — Nexwork SpA";

  const DARK  = "FF0F172A";
  const BLUE  = "FF2563EB";
  const LIGHT = "FFEFF6FF";
  const GRAY  = "FFF1F5F9";
  const WHITE = "FFFFFFFF";

  const ws1 = wb.addWorksheet("Resumen");
  ws1.mergeCells("A1:F1");
  const t = ws1.getCell("A1");
  t.value = "dotaciones.cl — Reporte de dotación óptima";
  t.font  = { name: "Arial", bold: true, color: { argb: WHITE }, size: 14 };
  t.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  t.alignment = { horizontal: "center", vertical: "middle" };
  ws1.getRow(1).height = 32;

  ws1.mergeCells("A2:F2");
  const sub = ws1.getCell("A2");
  sub.value = `Nexwork SpA · ${new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}`;
  sub.font  = { name: "Arial", color: { argb: "FF94A3B8" }, size: 10 };
  sub.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY } };
  sub.alignment = { horizontal: "center", vertical: "middle" };
  ws1.getRow(2).height = 20;

  const kpis = [
    { label: "Horas demanda",     value: `${Number(meta.requiredHours).toFixed(1)}h` },
    { label: "Horas a contratar", value: `${Number(meta.requiredHoursAdjusted).toFixed(1)}h` },
    { label: "FTE bruto",         value: Number(meta.fte).toFixed(2) },
    { label: "FTE a contratar",   value: Number(meta.fteAdjusted).toFixed(2) },
    { label: "Factor reemplazo",  value: `${Math.round((meta.replacementFactor - 1) * 100)}%` },
    { label: "Mixes válidos",     value: String(mixes.length) },
  ];

  kpis.forEach((kpi, i) => {
    const col = i + 1;
    const lc = ws1.getCell(4, col);
    const vc = ws1.getCell(5, col);
    lc.value = kpi.label;
    lc.font  = { name: "Arial", color: { argb: "FF64748B" }, size: 10 };
    lc.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY } };
    lc.alignment = { horizontal: "center" };
    vc.value = kpi.value;
    vc.font  = { name: "Courier New", bold: true, color: { argb: DARK }, size: 12 };
    vc.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
    vc.alignment = { horizontal: "center" };
  });
  ws1.getRow(4).height = 22;
  ws1.getRow(5).height = 28;
  for (let c = 1; c <= 6; c++) ws1.getColumn(c).width = 22;

  const ws2 = wb.addWorksheet("Todas las combinaciones");
  const headers = [
    "N°", "Personas", "Composición del mix", "Domingo",
    "Total horas", "Holgura (h)", "Holgura (%)", "% PT",
    ...(hasCosts ? ["Costo semanal ($)", "$/hora efectivo"] : []),
    "Destacado",
  ];

  const hr = ws2.addRow(headers);
  hr.eachCell(cell => {
    cell.font      = { name: "Arial", bold: true, color: { argb: WHITE }, size: 10 };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border    = { bottom: { style: "medium", color: { argb: "FF334155" } } };
  });
  ws2.getRow(1).height = 26;
  ws2.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

  mixes.forEach((mix: Record<string, unknown>, i: number) => {
    const items = (mix.items as Record<string, unknown>[] ?? []);
    const composicion = items
      .map((it: Record<string, unknown>) => `${it.count}× ${it.contractName} (${it.jornadaName})`)
      .join("  |  ");
    const destacado = mix.isOptimal ? "Óptimo" : mix.isCheapest ? "Más barato" : "";
    const rowData = [
      i + 1, mix.headcount, composicion,
      mix.sundayOk ? "OK" : "Ajustado",
      mix.hoursTotal, mix.slackHours,
      `${Math.round(((mix.slackPct as number) ?? 0) * 100)}%`,
      `${Math.round(((mix.ptShare  as number) ?? 0) * 100)}%`,
      ...(hasCosts ? [mix.weeklyCost ?? "—", mix.costPerHourEffective ?? "—"] : []),
      destacado,
    ];

    const row = ws2.addRow(rowData);
    const bg  = mix.isOptimal ? "FFDBEAFE" : mix.isCheapest ? "FFD1FAE5" : i % 2 === 0 ? WHITE : "FFF8FAFC";

    row.eachCell((cell, col) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font      = { name: "Arial", size: 10 };
      cell.alignment = { vertical: "middle", horizontal: col === 3 ? "left" : "center" };
      cell.border    = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
    });
    ws2.getRow(i + 2).height = 22;
  });

  [18, 50, 14, 12, 14, 14, 14, 12, 18, 18, 14].forEach((w, i) => {
    ws2.getColumn(i + 1).width = w;
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

// ─── Email dotación (retail/SAN) ──────────────────────────────────────────────

async function sendEmailDotacion(payload: {
  to: string; nombre: string; analisis: string;
  calculadora: string; excelBuffer: Buffer; totalMixes: number;
}) {
  const fecha    = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
  const excelB64 = payload.excelBuffer.toString("base64");
  const filename = `dotaciones_mixes_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="padding:24px 32px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <p style="margin:0;font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">dotaciones<span style="color:#2563eb;">.cl</span></p>
        <p style="margin:3px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;">Nexwork SpA</p>
      </div>
      <p style="margin:0;font-size:11px;color:#94a3b8;">${fecha}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#0f172a;">Hola${payload.nombre ? ` ${payload.nombre}` : ""},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
        Adjunto encontrarás el Excel con las <strong>${payload.totalMixes} combinaciones válidas</strong> de dotación calculadas para tu operación, ordenadas por eficiencia.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#15803d;">${filename}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#16a34a;">${payload.totalMixes} combinaciones · 3 hojas · Resumen + Tabla completa + Mixes destacados</p>
      </div>
      <div style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;border-left:3px solid #2563eb;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Análisis ejecutivo</p>
        <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.75;white-space:pre-wrap;">${payload.analisis}</p>
      </div>
      <a href="https://dotaciones.cl/calculadora" style="display:inline-block;padding:11px 22px;background:#0f172a;color:#fff;font-size:13px;font-weight:600;border-radius:6px;text-decoration:none;">Volver a la calculadora →</a>
    </div>
    <div style="padding:18px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
        © ${new Date().getFullYear()} dotaciones.cl · Nexwork SpA · Chile<br>
        Recibiste este correo porque solicitaste un análisis IA en dotaciones.cl.
      </p>
    </div>
  </div>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Dotaciones <no-reply@dotaciones.cl>",
      to: [payload.to],
      subject: `Tu análisis de dotación — ${payload.totalMixes} combinaciones calculadas`,
      html,
      attachments: [{ filename, content: excelB64 }],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Resend error (dotación):", err);
    throw new Error("Error enviando email dotación");
  }
}

// ─── Email finiquito ──────────────────────────────────────────────────────────

async function sendEmailFiniquito(payload: {
  to: string;
  nombre: string;
  origenLabel: string;
}) {
  const fecha = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

  // Email al usuario — confirmación + guía
  const htmlUsuario = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">

    <div style="background:#0d1f14;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;">
      <p style="margin:0;font-size:17px;font-weight:700;color:#fff;letter-spacing:-0.01em;">dotaciones<span style="color:#52B788;">.cl</span></p>
      <p style="margin:0;font-size:11px;color:#5a8070;">${fecha}</p>
    </div>

    <div style="padding:32px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0f172a;">Hola${payload.nombre ? ` ${payload.nombre}` : ""},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.65;">
        Aquí tienes tu resumen del finiquito y la guía de qué revisar antes de firmar.
      </p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:18px 20px;margin-bottom:20px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#16a34a;">Qué revisar antes de firmar</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#1e293b;line-height:2;">
          <li>Confirma que los <strong>montos coincidan</strong> con lo que te ofrecen. Si hay diferencia, no firmes.</li>
          <li>Revisa que el empleador acredite el pago de <strong>todas las cotizaciones</strong> hasta el mes anterior al despido.</li>
          <li>Si no estás de acuerdo con algo, escribe la <strong>reserva de derechos</strong> en el anverso del finiquito, en las 3 copias, antes de firmar.</li>
          <li>La firma ante ministro de fe tiene <strong>carácter de pago total</strong> — una vez firmado sin reserva, pierdes el derecho a reclamar.</li>
          <li>Tienes derecho a pedir tiempo para revisarlo. El empleador <strong>no puede obligarte a firmar en el acto</strong>.</li>
        </ul>
      </div>

      <div style="background:#fff8e1;border:1px solid #fcd34d;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.07em;">Sobre los descuentos</p>
        <p style="margin:0;font-size:13px;color:#78350f;line-height:1.65;">
          <strong>AFP y salud solo se descuentan sobre el feriado proporcional</strong> y los días trabajados del mes (montos que constituyen remuneración). Las indemnizaciones por años de servicio y el aviso previo <strong>no están sujetas a descuentos previsionales</strong>.<br><br>
          Si el despido es por art. 161, el empleador puede descontar su aporte al seguro de cesantía (AFC/CIC, 1,6%) de la indemnización — esto es legal. Si crees que el cálculo es incorrecto, inclúyelo en tu reserva de derechos.
        </p>
      </div>

      <a href="https://dotaciones.cl/calculadora/finiquito"
         style="display:inline-block;padding:11px 22px;background:#0d1f14;color:#fff;font-size:13px;font-weight:600;border-radius:6px;text-decoration:none;margin-bottom:8px;">
        Recalcular mi finiquito →
      </a>
    </div>

    <div style="padding:18px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
        © ${new Date().getFullYear()} dotaciones.cl · Nexwork SpA · Chile<br>
        Esta información es referencial. Se recomienda consultar con un abogado laboral antes de firmar.
      </p>
    </div>
  </div>
</body></html>`;

  // Email interno de notificación
  const htmlNotif = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:32px auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0;padding:24px;">
    <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#0f172a;">Nuevo lead — ${payload.origenLabel}</p>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#64748b;width:100px;">Nombre</td><td style="padding:6px 0;color:#0f172a;font-weight:600;">${payload.nombre || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;color:#0f172a;">${payload.to}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Origen</td><td style="padding:6px 0;color:#0f172a;">${payload.origenLabel}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Fecha</td><td style="padding:6px 0;color:#0f172a;">${fecha}</td></tr>
    </table>
  </div>
</body></html>`;

  // Enviar al usuario
  const r1 = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Dotaciones <no-reply@dotaciones.cl>",
      to: [payload.to],
      subject: "Tu resumen de finiquito — qué revisar antes de firmar",
      html: htmlUsuario,
    }),
  });
  if (!r1.ok) {
    const err = await r1.json();
    console.error("Resend error (finiquito usuario):", err);
    throw new Error("Error enviando email finiquito al usuario");
  }

  // Notificación interna
  const r2 = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Dotaciones <no-reply@dotaciones.cl>",
      to: [NOTIFY_EMAIL],
      subject: `Nuevo lead: ${payload.origenLabel} — ${payload.nombre || payload.to}`,
      html: htmlNotif,
    }),
  });
  if (!r2.ok) {
    const err = await r2.json();
    console.error("Resend error (notif interna):", err);
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nombre, email, empresa, cargo,
      sector, calculadora, fuente, source,
      resultados,
      mixes,
      hasCosts,
    } = body;

    // Normalizar: la calculadora de finiquito envía "source", las otras "fuente"
    const origenRaw   = source || fuente || "web";
    const origenLabel = sourceLabel(origenRaw);
    const esFiniquito = origenRaw === "calculadora-finiquito";

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // 1. Guardar en Notion con origen legible
    let notionError: string | null = null;
    try {
      await saveToNotion({
        nombre, email, empresa, cargo, sector,
        calculadora: calculadora || (esFiniquito ? "Finiquito" : undefined),
        fuente: origenRaw,
        origen: origenLabel,
      });
    } catch (e) {
      notionError = String(e);
      console.error("Notion save failed:", notionError);
    }

    // 2a. Flujo finiquito — email directo, sin análisis IA ni Excel
    if (esFiniquito) {
      try {
        await sendEmailFiniquito({ to: email, nombre: nombre || "", origenLabel });
      } catch (e) {
        console.error("Email finiquito failed (non-fatal):", e);
      }
      return NextResponse.json({ ok: true });
    }

    // 2b. Flujo dotación (retail / SAN) — análisis IA + Excel + email
    // Siempre notificar internamente (nuevo lead)
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Dotaciones <no-reply@dotaciones.cl>",
          to: [NOTIFY_EMAIL],
          subject: `Nuevo lead: ${origenLabel} — ${nombre || email}`,
          html: `<p style="font-family:Arial;font-size:14px;color:#0f172a;">
            <strong>${nombre || "Sin nombre"}</strong> (${email})<br>
            Empresa: ${empresa || "—"}<br>
            Origen: ${origenLabel}<br>
            Fecha: ${new Date().toLocaleDateString("es-CL")}
          </p>`,
        }),
      });
    } catch (e) {
      console.error("Internal notification failed (non-fatal):", e);
    }

    // Solo enviar email al usuario si hay resultados + mixes (flujo completo)
    let analisis: string | null = null;
    if (resultados) {
      try {
        analisis = await generateAnalisis(
          resultados,
          sector       || "Retail / Servicios",
          calculadora  || "Retail / Servicios",
        );
      } catch (e) {
        console.error("Análisis IA failed (non-fatal):", e);
      }
    }

    if (mixes?.length) {
      try {
        const excelBuffer = await buildExcel(
          mixes,
          hasCosts ?? false,
          {
            requiredHours:         resultados?.requiredHours         ?? 0,
            requiredHoursAdjusted: resultados?.requiredHoursAdjusted ?? 0,
            fte:                   resultados?.fte                   ?? 0,
            fteAdjusted:           resultados?.fteAdjusted           ?? 0,
            replacementFactor:     resultados?.replacementFactor     ?? 1,
          },
        );
        await sendEmailDotacion({
          to: email,
          nombre: nombre || "",
          analisis: analisis || "Análisis no disponible en este momento.",
          calculadora: calculadora || "Retail / Servicios",
          excelBuffer,
          totalMixes: mixes.length,
        });
      } catch (e) {
        console.error("Email/Excel dotación failed (non-fatal):", e);
      }
    }

    return NextResponse.json({ ok: true, analisis, notionError });
  } catch (e) {
    console.error("leads route error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}