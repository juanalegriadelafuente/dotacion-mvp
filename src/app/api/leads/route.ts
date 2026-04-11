// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

const NOTION_API_KEY     = process.env.NOTION_API_KEY!;
const NOTION_DATABASE_ID = process.env.NOTION_LEADS_DATABASE_ID!;
const RESEND_API_KEY     = process.env.RESEND_API_KEY!;
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY!;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Notion ───────────────────────────────────────────────────────────────────

async function saveToNotion(payload: {
  nombre: string; email: string; empresa?: string;
  cargo?: string; sector?: string; calculadora?: string; fuente?: string;
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
  }
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function generateAnalisis(
  resultados: any, sector: string, calculadora: string,
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

async function buildExcel(mixes: any[], hasCosts: boolean, meta: {
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
  const GREEN = "FF16A34A";
  const AMBER = "FFD97706";

  // ── Hoja 1: Resumen ────────────────────────────────────────────────────────
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

  // ── Hoja 2: Todas las combinaciones ───────────────────────────────────────
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

  mixes.forEach((mix: any, i: number) => {
    const composicion = (mix.items ?? [])
      .map((it: any) => `${it.count}× ${it.contractName} (${it.jornadaName})`)
      .join("  |  ");
    const destacado = mix.isOptimal ? "Óptimo" : mix.isCheapest ? "Más barato" : "";
    const rowData = [
      i + 1, mix.headcount, composicion,
      mix.sundayOk ? "OK" : "Ajustado",
      mix.hoursTotal, mix.slackHours,
      `${Math.round((mix.slackPct ?? 0) * 100)}%`,
      `${Math.round((mix.ptShare  ?? 0) * 100)}%`,
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
      if (col === 4) cell.font = { name: "Arial", size: 10, bold: true, color: { argb: mix.sundayOk ? GREEN : AMBER } };
      if (col === 7 && (mix.slackPct ?? 0) > 0.25) cell.font = { name: "Arial", size: 10, color: { argb: AMBER } };
    });
    row.height = 20;
  });

  ws2.getColumn(1).width = 6;
  ws2.getColumn(2).width = 11;
  ws2.getColumn(3).width = 55;
  ws2.getColumn(4).width = 14;
  ws2.getColumn(5).width = 14;
  ws2.getColumn(6).width = 13;
  ws2.getColumn(7).width = 13;
  ws2.getColumn(8).width = 10;
  if (hasCosts) {
    ws2.getColumn(9).width  = 18;
    ws2.getColumn(10).width = 16;
    ws2.getColumn(11).width = 16;
  } else {
    ws2.getColumn(9).width = 16;
  }
  ws2.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

  // ── Hoja 3: Mixes destacados ──────────────────────────────────────────────
  const ws3 = wb.addWorksheet("Mixes destacados");
  const featured = mixes.filter((m: any) => m.isOptimal || m.isCheapest);
  if (featured.length === 0 && mixes.length > 0) featured.push(mixes[0]);

  let rowNum = 1;
  for (const mix of featured) {
    const label = mix.isOptimal
      ? "Mix óptimo (menor headcount con domingo cubierto)"
      : "Mix más económico (menor costo semanal)";

    ws3.mergeCells(rowNum, 1, rowNum, 5);
    const tc = ws3.getCell(rowNum, 1);
    tc.value = label;
    tc.font  = { name: "Arial", bold: true, color: { argb: WHITE }, size: 11 };
    tc.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
    tc.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    ws3.getRow(rowNum).height = 24;
    rowNum++;

    const kpiList: [string, string | number][] = [
      ["Personas",    mix.headcount],
      ["Total horas", `${mix.hoursTotal}h`],
      ["Holgura",     `${mix.slackHours}h (${Math.round((mix.slackPct ?? 0) * 100)}%)`],
      ["% PT",        `${Math.round((mix.ptShare ?? 0) * 100)}%`],
      ["Domingo",     mix.sundayOk ? "Cubierto" : "Ajustado"],
    ];
    if (hasCosts && mix.weeklyCost != null) {
      kpiList.push(["Costo/sem", `$${Number(mix.weeklyCost).toLocaleString("es-CL")}`]);
    }

    kpiList.forEach(([k, v], i) => {
      const col = i + 1;
      const lc  = ws3.getCell(rowNum, col);
      const vc  = ws3.getCell(rowNum + 1, col);
      lc.value = k; lc.font = { name: "Arial", color: { argb: "FF64748B" }, size: 10 };
      lc.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY } };
      lc.alignment = { horizontal: "center" };
      vc.value = v; vc.font = { name: "Arial", bold: true, size: 11 };
      vc.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
      vc.alignment = { horizontal: "center" };
    });
    ws3.getRow(rowNum).height     = 20;
    ws3.getRow(rowNum + 1).height = 26;
    rowNum += 3;

    const ch = ws3.addRow(["Tipo contrato", "Jornada", "Cantidad", "Horas/sem c/u", "Horas total"]);
    ch.eachCell(cell => {
      cell.font      = { name: "Arial", bold: true, color: { argb: WHITE }, size: 10 };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
      cell.alignment = { horizontal: "center" };
    });
    ws3.getRow(rowNum).height = 22;
    rowNum++;

    (mix.items ?? []).forEach((it: any, j: number) => {
      const ir = ws3.addRow([
        it.contractName, it.jornadaName, it.count,
        `${it.hoursPerWeek}h`, `${it.count * it.hoursPerWeek}h`,
      ]);
      ir.eachCell(cell => {
        cell.font      = { name: "Arial", size: 10 };
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: j % 2 === 0 ? WHITE : "FFF8FAFC" } };
        cell.alignment = { horizontal: "center" };
        cell.border    = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
      });
      ir.height = 20;
      rowNum++;
    });
    rowNum += 2;
  }

  ws3.getColumn(1).width = 20;
  ws3.getColumn(2).width = 28;
  ws3.getColumn(3).width = 12;
  ws3.getColumn(4).width = 16;
  ws3.getColumn(5).width = 14;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

// ─── Email con Resend ─────────────────────────────────────────────────────────

async function sendEmail(payload: {
  to: string; nombre: string; analisis: string;
  calculadora: string; excelBuffer: Buffer; totalMixes: number;
}) {
  const fecha = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
  const excelB64 = payload.excelBuffer.toString("base64");
  const filename = `dotaciones_mixes_${new Date().toISOString().slice(0,10)}.xlsx`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">

    <div style="padding:24px 32px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <p style="margin:0;font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">
          dotaciones<span style="color:#2563eb;">.cl</span>
        </p>
        <p style="margin:3px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;">Nexwork SpA</p>
      </div>
      <p style="margin:0;font-size:11px;color:#94a3b8;">${fecha}</p>
    </div>

    <div style="padding:32px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#0f172a;">
        Hola${payload.nombre ? ` ${payload.nombre}` : ""},
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
        Adjunto encontrarás el Excel con las <strong>${payload.totalMixes} combinaciones válidas</strong> de dotación calculadas para tu operación, ordenadas por eficiencia. Más abajo está el análisis ejecutivo.
      </p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;background:#16a34a;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#fff;font-size:16px;">📊</span>
        </div>
        <div>
          <p style="margin:0;font-size:13px;font-weight:600;color:#15803d;">${filename}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#16a34a;">${payload.totalMixes} combinaciones · 3 hojas · Resumen + Tabla completa + Mixes destacados</p>
        </div>
      </div>

      <div style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;border-left:3px solid #2563eb;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Análisis ejecutivo</p>
        <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.75;white-space:pre-wrap;">${payload.analisis}</p>
      </div>

      <a href="https://dotaciones.cl/calculadora"
         style="display:inline-block;padding:11px 22px;background:#0f172a;color:#fff;font-size:13px;font-weight:600;border-radius:6px;text-decoration:none;">
        Volver a la calculadora →
      </a>
    </div>

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
      subject: `Tu análisis de dotación — ${payload.totalMixes} combinaciones calculadas`,
      html,
      attachments: [
        {
          filename,
          content: excelB64,
        },
      ],
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
      nombre, email, empresa, cargo,
      sector, calculadora, fuente,
      resultados,
      mixes,        // array de mixes del engine
      hasCosts,
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

    // 2. Generar análisis IA
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

    // 3. Generar Excel en memoria + enviar email con adjunto
    if (analisis && email && mixes?.length) {
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

        await sendEmail({
          to: email,
          nombre: nombre || "",
          analisis,
          calculadora: calculadora || "Retail / Servicios",
          excelBuffer,
          totalMixes: mixes.length,
        });
      } catch (e) {
        console.error("Email/Excel failed (non-fatal):", e);
      }
    }

    return NextResponse.json({ ok: true, analisis });
  } catch (e) {
    console.error("leads route error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}