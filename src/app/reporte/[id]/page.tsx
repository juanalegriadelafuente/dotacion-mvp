// src/app/reporte/[id]/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function fmtNum(n: any, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "-";
  return x.toLocaleString("es-CL", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export default async function ReportePage({
  params,
}: {
  // Next 16 (Turbopack): params puede venir como Promise
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Reporte no encontrado</h1>
        <p>
          Es posible que el link sea inválido, haya expirado, o el reporte no
          exista.
        </p>
        <Link href="/calculadora">Volver a la calculadora</Link>
      </div>
    );
  }

  const calc_input = data.calc_input ?? {};
  const calc_result = data.calc_result ?? {};

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Reporte</h1>
        <div style={{ fontSize: 12, color: "#666" }}>
          ID: <code>{id}</code>
        </div>
      </div>

      <p style={{ color: "#666", marginTop: 8 }}>
        Este reporte fue generado desde Dotaciones.cl (MVP). Guarda este link si
        quieres volver después.
      </p>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Resumen</h2>

        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <b>FTE estimado:</b> {fmtNum(calc_result.fte, 2)}
          </div>
          <div>
            <b>Horas requeridas:</b> {fmtNum(calc_result.requiredHours, 2)}
          </div>
          <div>
            <b>Brecha colación vs traslape:</b>{" "}
            {fmtNum(calc_result.gapHours, 2)}
          </div>
          <div>
            <b>Domingo requerido:</b> {fmtNum(calc_result.sundayReq, 2)}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Mixes sugeridos</h2>

        {Array.isArray(calc_result.mixes) && calc_result.mixes.length > 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            {calc_result.mixes.map((m: any, idx: number) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 900 }}>
                  {m.title ?? `Mix ${idx + 1}`}
                </div>
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  <div>
                    <b>Personas:</b> {fmtNum(m.headcount)}
                  </div>
                  <div>
                    <b>Horas totales:</b> {fmtNum(m.hoursTotal, 2)}{" "}
                    <span style={{ color: "#666" }}>
                      (holgura {fmtNum(m.slackHours, 2)} /{" "}
                      {fmtNum((m.slackPct ?? 0) * 100, 0)}%)
                    </span>
                  </div>
                  <div>
                    <b>Domingo:</b> {fmtNum(m.sundayCap, 2)} /{" "}
                    {fmtNum(m.sundayReq, 2)}{" "}
                    <span style={{ fontWeight: 900 }}>
                      {m.sundayOk ? "✅" : "❌"}
                    </span>
                  </div>
                </div>

                {Array.isArray(m.items) && m.items.length > 0 && (
                  <>
                    <div style={{ marginTop: 10, fontWeight: 900 }}>
                      Composición
                    </div>
                    <ul style={{ marginTop: 6 }}>
                      {m.items.map((it: any, j: number) => (
                        <li key={j}>
                          {it.count} × {it.contractName}{" "}
                          <span style={{ color: "#666" }}>
                            (h/sem {it.hoursPerWeek}, factor domingo{" "}
                            {it.sundayFactor})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#666" }}>
            No hay mixes guardados en este reporte.
          </p>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
            Ver input guardado (debug)
          </summary>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              marginTop: 10,
              fontSize: 12,
              color: "#333",
            }}
          >
            {JSON.stringify(calc_input, null, 2)}
          </pre>
        </details>
      </div>

      <div style={{ marginTop: 18 }}>
        <Link href="/calculadora">Volver a la calculadora</Link>
      </div>
    </div>
  );
}
