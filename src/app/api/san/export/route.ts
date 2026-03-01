// src/app/api/san/export/route.ts
import { NextResponse } from "next/server";
import { computeSAN2025 } from "@/lib/san/v2025/index";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function isoDateForFile() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function dayLabel(d: DayKey) {
  return (
    {
      mon: "Lun",
      tue: "Mar",
      wed: "Mié",
      thu: "Jue",
      fri: "Vie",
      sat: "Sáb",
      sun: "Dom",
    }[d] ?? d
  );
}

function areaLabel(area: string) {
  switch (area) {
    case "recepcion_almacenamiento":
      return "Recepción / Almacenamiento";
    case "produccion":
      return "Producción";
    case "lavado":
      return "Lavado";
    case "distribucion_clinica_anexas":
      return "Distribución (Clínica + Anexas)";
    case "distribucion_casino":
      return "Distribución (Casino)";
    default:
      return area;
  }
}

async function callSanMix(req: Request, payload: any) {
  const url = new URL(req.url);
  const mixUrl = `${url.origin}/api/san/mix`;

  const r = await fetch(mixUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) {
    return { ok: false, error: data?.error ?? `MixPro error (HTTP ${r.status})` };
  }
  return { ok: true, result: data.result };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const san = computeSAN2025(body);

    // days + settings para MixPro (si no vienen, no hay hoja útil)
    const days = body?.days && typeof body.days === "object" ? body.days : null;

    const mixPayload = days
      ? {
          scenario: body?.scenario ?? { maxWeekHours: 42 },
          days,
          allowedContracts: body?.allowedContracts ?? [44, 42, 40, 30, 20],
          allowedJornadas: body?.allowedJornadas ?? {
            allow_6x1: true,
            allow_5x2: true,
            allow_4x3: true,
            allow_pt_weekend: true,
          },
          ptMaxShare: body?.ptMaxShare ?? 0.25,
        }
      : null;

    const mixPro = mixPayload ? await callSanMix(req, mixPayload) : { ok: false, error: "No se envió days." };

    // -------- Resumen --------
    const resumenRows: any[][] = [
      ["Dotaciones.cl - Calculadora SAN (Hospitalaria)", ""],
      ["Fecha", new Date().toISOString()],
      ["", ""],
      ["Escenario jornada máxima (h/sem)", body?.scenario?.maxWeekHours ?? ""],
      ["Modo redondeo", body?.scenario?.roundingMode ?? ""],
      ["", ""],
      ["RTD Pacientes", san.rtdPatients],
      ["RTD Casino", san.rtdCasino],
      ["RTD Total", san.rtdTotal],
      ["RCD", san.rcd],
      ["Complejidad UCP", san.ucpComplexity],
      ["", ""],
      ["UCP FTE_44 aplicado", san.ucpTotalFte44_applied],
      ["Clínica FTE_44 aplicado", san.clinicalDietitiansFte44_applied],
      [
        "Total FTE_44 aplicado (UCP+Clínica)",
        san.ucpTotalFte44_applied + san.clinicalDietitiansFte44_applied,
      ],
      ["Horas/semana requeridas (base 44h)", san.totalHoursPerWeek_required],
      ["FTE equivalente (según jornada máxima)", san.totalFte_equivalent],
      ["", ""],
      ["Operación (days) enviado", days ? "SI" : "NO"],
      ["MixPro OK", mixPro.ok ? "SI" : "NO"],
      ["MixPro horas requeridas", mixPro.ok ? mixPro.result.requiredHours : ""],
      ["MixPro FTE", mixPro.ok ? mixPro.result.fte : ""],
      ["MixPro PT max", mixPro.ok ? `${Math.round(mixPro.result.ptMaxShare * 100)}%` : ""],
      ["MixPro warning", mixPro.ok ? (mixPro.result.warnings ?? []).join(" | ") : (mixPro as any).error ?? ""],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);

    // -------- UCP --------
    const wsUcp = XLSX.utils.json_to_sheet(
      (san.ucpStaffByArea ?? []).map((a: any) => ({
        Area: areaLabel(a.area),
        Base: a.basis,
        "Rango aplicado": a.rangeLabel,
        "Ratio (1:x)": a.ratioLabel,
        "Dotación raw (1 decimal)": a.raw,
        "Dotación aplicada": a.applied,
      }))
    );

    // -------- Clínica --------
    const wsClinica = XLSX.utils.json_to_sheet([
      {
        "Camas básico": body?.bedsBasic ?? 0,
        "Camas medio": body?.bedsMedium ?? 0,
        "Camas crítico": body?.bedsCritical ?? 0,
        "Nutri FTE_44 raw": san.clinicalDietitiansFte44_raw,
        "Nutri FTE_44 aplicado": san.clinicalDietitiansFte44_applied,
      },
    ]);

    // -------- Operación --------
    const opRows = days
      ? DAY_ORDER.map((d) => {
          const di = days[d] ?? {};
          return {
            Dia: dayLabel(d),
            Abierto: di.open ? "SI" : "NO",
            "Horas abiertas": di.hoursOpen ?? "",
            "Personas simultáneas": di.requiredPeople ?? "",
            "Colación (min)": di.breakMinutes ?? "",
            "Traslape (min)": di.overlapMinutes ?? "",
          };
        })
      : [{ Nota: "No se envió days (horario). La hoja Operación no aplica." }];
    const wsOperacion = XLSX.utils.json_to_sheet(opRows);

    // -------- MixPro --------
    const mixRows: any[] = [];
    if (mixPro.ok) {
      for (const m of mixPro.result.mixes ?? []) {
        const items = Array.isArray(m.items) ? m.items : [];
        if (items.length === 0) {
          mixRows.push({
            Mix: m.title ?? "Mix",
            "PT share": m.ptShare ?? "",
            Personas: m.headcount ?? "",
            "Horas totales": m.hoursTotal ?? "",
            Holgura: m.slackHours ?? "",
            Jornada: "",
            Contrato: "",
            "Horas/sem": "",
            Cantidad: "",
          });
        } else {
          for (const it of items) {
            mixRows.push({
              Mix: m.title ?? "Mix",
              "PT share": m.ptShare ?? "",
              Personas: m.headcount ?? "",
              "Horas totales": m.hoursTotal ?? "",
              Holgura: m.slackHours ?? "",
              Jornada: it.jornadaLabel ?? it.jornada ?? "",
              Contrato: it.contractName ?? "",
              "Horas/sem": it.hoursPerWeek ?? "",
              Cantidad: it.count ?? "",
            });
          }
        }
      }
      if (!mixRows.length) mixRows.push({ Nota: "MixPro OK pero sin mixes." });
    } else {
      mixRows.push({ Nota: (mixPro as any).error ?? "No se pudo calcular MixPro." });
    }
    const wsMixPro = XLSX.utils.json_to_sheet(mixRows);

    // resumen a la derecha
    XLSX.utils.sheet_add_aoa(
      wsMixPro,
      [
        ["Resumen MixPro", ""],
        ["Horas requeridas", mixPro.ok ? mixPro.result.requiredHours : ""],
        ["FTE", mixPro.ok ? mixPro.result.fte : ""],
        ["Contratos usados", mixPro.ok ? (mixPro.result.contractsUsed ?? []).map((c: any) => c.hoursPerWeek).join(", ") : ""],
        ["Jornadas usadas", mixPro.ok ? Object.entries(mixPro.result.jornadasUsed ?? {}).filter(([,v])=>v).map(([k])=>k).join(", ") : ""],
        ["PT max", mixPro.ok ? `${Math.round(mixPro.result.ptMaxShare * 100)}%` : ""],
        ["Warnings", mixPro.ok ? (mixPro.result.warnings ?? []).join(" | ") : (mixPro as any).error ?? ""],
      ],
      { origin: "K1" }
    );

    // -------- Trace --------
    const wsTrace = XLSX.utils.json_to_sheet(
      (san.trace ?? []).map((t: any) => {
        const s = t.data ? JSON.stringify(t.data) : "";
        const safe = s.length > 5000 ? s.slice(0, 5000) + "…(truncado)" : s;
        return { key: t.key, label: t.label, data: safe };
      })
    );

    // Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
    XLSX.utils.book_append_sheet(wb, wsUcp, "UCP");
    XLSX.utils.book_append_sheet(wb, wsClinica, "Clinica");
    XLSX.utils.book_append_sheet(wb, wsOperacion, "Operacion");
    XLSX.utils.book_append_sheet(wb, wsMixPro, "MixPro");
    XLSX.utils.book_append_sheet(wb, wsTrace, "Trace");

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const buf = Buffer.from(out);

    const filename = `SAN_dotacion_${isoDateForFile()}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("SAN export error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Error exportando Excel" },
      { status: 500 }
    );
  }
}