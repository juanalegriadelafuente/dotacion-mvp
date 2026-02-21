// src/app/reporte/[id]/page.tsx
import { supabaseAdmin } from "@/lib/supabaseServer";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmtNum(n: any, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "-";
  return x.toLocaleString("es-CL", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export default async function ReportePage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Reporte no encontrado</h1>
        <p>Es posible que el link sea inválido o haya expirado.</p>
        <Link href="/calculadora">Volver a la calculadora</Link>
      </div>
    );
  }

  const r = data.calc_result ?? {};
  const mixes = r.mixes ?? [];

  return (
    <html lang="es">
      <head>
        <title>Informe de Dotación — Dotaciones.cl</title>
        <meta name="robots" content="noindex,nofollow" />
        <style>{`
          :root { color-scheme: light; }
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; background: #f5f6f8; color: #111; }
          .wrap { max-width: 920px; margin: 0 auto; padding: 28px 16px 40px; }
          .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
          .row { display: grid; gap: 12px; grid-template-columns: 1fr; }
          @media (min-width: 860px) { .row { grid-template-columns: 1.2fr 0.8fr; } }
          h1 { font-size: 26px; margin: 0; }
          h2 { font-size: 16px; margin: 0 0 8px; }
          .muted { color: #6b7280; font-size: 13px; }
          .kpi { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          @media (min-width: 860px) { .kpi { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
          .k { border: 1px solid #eef2f7; border-radius: 12px; padding: 10px; background: #fbfdff; }
          .k .lbl { font-size: 12px; color:#6b7280; }
          .k .val { font-size: 18px; font-weight: 700; margin-top: 3px; }
          .btns { display:flex; gap:10px; flex-wrap: wrap; }
          .btn { appearance:none; border:0; cursor:pointer; padding:10px 14px; border-radius:12px; font-weight:700; font-size:14px; }
          .btn.print { background:#dc2626; color:#fff; }
          .btn.back { background:#111827; color:#fff; text-decoration:none; display:inline-flex; align-items:center; }
          .mix { border:1px solid #e5e7eb; border-radius:14px; padding:12px; }
          .mix h3 { margin:0; font-size:14px; }
          ul { margin: 8px 0 0 18px; }
          li { margin: 4px 0; }

          /* Print */
          @media print {
            body { background:#fff; }
            .no-print { display:none !important; }
            .wrap { padding: 0; }
            .card { border: 0; }
          }
        `}</style>
      </head>

      <body>
        <div className="wrap">
          <div className="card no-print" style={{ marginBottom: 12 }}>
            <div className="btns">
              <button className="btn print" onClick={() => window.print()}>
                Descargar PDF
              </button>
              <Link className="btn back" href="/calculadora">
                Volver a la calculadora
              </Link>
            </div>
            <div className="muted" style={{ marginTop: 10 }}>
              Tip: al imprimir, elige “Guardar como PDF”.
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h1>Informe Ejecutivo de Dotación (Retail)</h1>
                <div className="muted">
                  Generado en Dotaciones.cl • ID {data.id} • {new Date(data.created_at).toLocaleString("es-CL")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>{data.email}</div>
                <div className="muted">
                  {(data.role ?? "—")} • {(data.company_size ?? "—")} • {(data.city ?? "—")}
                </div>
              </div>
            </div>

            <div className="row" style={{ marginTop: 16 }}>
              <div>
                <h2>Resumen</h2>
                <div className="kpi">
                  <div className="k">
                    <div className="lbl">Horas requeridas (semana)</div>
                    <div className="val">{fmtNum(r.requiredHours, 0)} h</div>
                  </div>
                  <div className="k">
                    <div className="lbl">FTE estimado</div>
                    <div className="val">{fmtNum(r.fte, 2)}</div>
                  </div>
                  <div className="k">
                    <div className="lbl">Requerimiento domingo</div>
                    <div className="val">{fmtNum(r.sundayReq, 0)}</div>
                  </div>
                  <div className="k">
                    <div className="lbl">Colación (h)</div>
                    <div className="val">{fmtNum(r.breakHours, 0)}</div>
                  </div>
                  <div className="k">
                    <div className="lbl">Traslape (h)</div>
                    <div className="val">{fmtNum(r.overlapHours, 0)}</div>
                  </div>
                  <div className="k">
                    <div className="lbl">Brecha colación-traslape (h)</div>
                    <div className="val">{fmtNum(r.gapHours, 0)}</div>
                  </div>
                </div>

                {Array.isArray(r.warnings) && r.warnings.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <h2>Alertas</h2>
                    <ul>
                      {r.warnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <h2>Mix de contratos sugeridos</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {mixes.length === 0 && <div className="muted">No hay mixes en este reporte.</div>}
                  {mixes.map((m: any, idx: number) => (
                    <div className="mix" key={idx}>
                      <h3>{m.title}</h3>
                      <div className="muted" style={{ marginTop: 6 }}>
                        Headcount: <b>{m.headcount}</b> • Horas: <b>{m.hoursTotal}</b> • Holgura:{" "}
                        <b>{m.slackHours}</b> ({Math.round((m.slackPct ?? 0) * 100)}%)
                      </div>
                      <div className="muted" style={{ marginTop: 6 }}>
                        Domingo: {fmtNum(m.sundayCap, 2)} / {fmtNum(m.sundayReq, 0)}{" "}
                        {m.sundayOk ? "✅" : "❌"}
                      </div>
                      <ul>
                        {(m.items ?? []).map((it: any, j: number) => (
                          <li key={j}>
                            {it.count}× {it.contractName} ({it.hoursPerWeek}h/sem) • factor domingo{" "}
                            {it.sundayFactor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="muted" style={{ marginTop: 14 }}>
              Nota: Este informe es una estimación operativa basada en tus parámetros. Próximamente: versión Pro con
              costo empresa y valorización de escenarios.
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}