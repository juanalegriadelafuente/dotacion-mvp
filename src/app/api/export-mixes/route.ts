// src/app/api/export-mixes/route.ts
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const {
      mixes,
      hasCosts,
      requiredHours,
      requiredHoursAdjusted,
      fte,
      fteAdjusted,
      replacementFactor,
    } = await req.json();

    if (!mixes || !Array.isArray(mixes) || mixes.length === 0) {
      return NextResponse.json({ error: "Sin mixes para exportar" }, { status: 400 });
    }

    const wb = new ExcelJS.Workbook();
    wb.creator  = "dotaciones.cl — Nexwork SpA";
    wb.created  = new Date();
    wb.modified = new Date();

    // ── Colores ──────────────────────────────────────────────────────────────
    const DARK  = "FF0F172A";
    const BLUE  = "FF2563EB";
    const LIGHT = "FFEFF6FF";
    const GRAY  = "FFF1F5F9";
    const WHITE = "FFFFFFFF";
    const GREEN = "FF16A34A";
    const AMBER = "FFD97706";

    // ── Hoja 1: Resumen ───────────────────────────────────────────────────────

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
      { label: "Horas demanda",    value: `${Number(requiredHours).toFixed(1)}h` },
      { label: "Horas a contratar", value: `${Number(requiredHoursAdjusted).toFixed(1)}h` },
      { label: "FTE bruto",        value: Number(fte).toFixed(2) },
      { label: "FTE a contratar",  value: Number(fteAdjusted).toFixed(2) },
      { label: "Factor reemplazo", value: `${Math.round((replacementFactor - 1) * 100)}%` },
      { label: "Mixes válidos",    value: String(mixes.length) },
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
        i + 1,
        mix.headcount,
        composicion,
        mix.sundayOk ? "OK" : "Ajustado",
        mix.hoursTotal,
        mix.slackHours,
        `${Math.round((mix.slackPct ?? 0) * 100)}%`,
        `${Math.round((mix.ptShare ?? 0) * 100)}%`,
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

        if (col === 4) {
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: mix.sundayOk ? GREEN : AMBER } };
        }
        if (col === 7 && (mix.slackPct ?? 0) > 0.25) {
          cell.font = { name: "Arial", size: 10, color: { argb: AMBER } };
        }
      });

      row.height = 20;
    });

    ws2.getColumn(1).width  = 6;
    ws2.getColumn(2).width  = 11;
    ws2.getColumn(3).width  = 55;
    ws2.getColumn(4).width  = 14;
    ws2.getColumn(5).width  = 14;
    ws2.getColumn(6).width  = 13;
    ws2.getColumn(7).width  = 13;
    ws2.getColumn(8).width  = 10;
    if (hasCosts) {
      ws2.getColumn(9).width  = 18;
      ws2.getColumn(10).width = 16;
      ws2.getColumn(11).width = 16;
    } else {
      ws2.getColumn(9).width  = 16;
    }

    ws2.autoFilter = {
      from: { row: 1, column: 1 },
      to:   { row: 1, column: headers.length },
    };

    // ── Hoja 3: Mixes destacados ──────────────────────────────────────────────

    const ws3 = wb.addWorksheet("Mixes destacados");

    const featured = mixes.filter((m: any) => m.isOptimal || m.isCheapest);
    if (featured.length === 0 && mixes.length > 0) featured.push(mixes[0]);

    let row = 1;

    for (const mix of featured) {
      const label = mix.isOptimal
        ? "Mix óptimo (menor headcount con domingo cubierto)"
        : mix.isCheapest
        ? "Mix más económico (menor costo semanal)"
        : "Mix seleccionado";

      ws3.mergeCells(row, 1, row, 5);
      const tc = ws3.getCell(row, 1);
      tc.value = label;
      tc.font  = { name: "Arial", bold: true, color: { argb: WHITE }, size: 11 };
      tc.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
      tc.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
      ws3.getRow(row).height = 24;
      row++;

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
        const lc  = ws3.getCell(row, col);
        const vc  = ws3.getCell(row + 1, col);
        lc.value = k;
        lc.font  = { name: "Arial", color: { argb: "FF64748B" }, size: 10 };
        lc.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY } };
        lc.alignment = { horizontal: "center" };
        vc.value = v;
        vc.font  = { name: "Arial", bold: true, size: 11 };
        vc.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
        vc.alignment = { horizontal: "center" };
      });

      ws3.getRow(row).height     = 20;
      ws3.getRow(row + 1).height = 26;
      row += 3;

      const ch = ws3.addRow(["Tipo contrato", "Jornada", "Cantidad", "Horas/sem c/u", "Horas total"]);
      ch.eachCell(cell => {
        cell.font      = { name: "Arial", bold: true, color: { argb: WHITE }, size: 10 };
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
        cell.alignment = { horizontal: "center" };
      });
      ws3.getRow(row).height = 22;
      row++;

      (mix.items ?? []).forEach((it: any, j: number) => {
        const ir = ws3.addRow([
          it.contractName,
          it.jornadaName,
          it.count,
          `${it.hoursPerWeek}h`,
          `${it.count * it.hoursPerWeek}h`,
        ]);
        ir.eachCell(cell => {
          cell.font      = { name: "Arial", size: 10 };
          cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: j % 2 === 0 ? WHITE : "FFF8FAFC" } };
          cell.alignment = { horizontal: "center" };
          cell.border    = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
        });
        ir.height = 20;
        row++;
      });

      row += 2;
    }

    ws3.getColumn(1).width = 20;
    ws3.getColumn(2).width = 28;
    ws3.getColumn(3).width = 12;
    ws3.getColumn(4).width = 16;
    ws3.getColumn(5).width = 14;

    // ── Serializar ────────────────────────────────────────────────────────────

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="dotaciones_mixes_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (e: any) {
    console.error("export-mixes error:", e);
    return NextResponse.json({ error: e?.message ?? "Error interno" }, { status: 500 });
  }
}