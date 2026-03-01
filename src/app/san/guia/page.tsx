// src/app/san/guia/page.tsx
import Link from "next/link";

export default function GuiaSanPage() {
  return (
    <main className="container" style={{ paddingTop: 18 }}>
      <div className="topbar">
        <div className="brand">
          <Link href="/" className="brandMark">
            <span className="brandName">Dotaciones.cl</span>
          </Link>
          <div className="brandSub">Guía de uso — Calculadora SAN Hospitalaria</div>
        </div>
        <div className="actions">
          <Link className="btn" href="/san">
            Ir a SAN →
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardPad">
          <h1 className="h2">Cómo usar la Calculadora SAN</h1>

          <div className="small" style={{ marginTop: 8 }}>
            Objetivo: calcular <b>normativa</b> (SAN), luego <b>operación real</b> (horario por día),
            y finalmente un <b>mix PRO</b> (Full Time primero, PT solo para cerrar brechas), con Excel
            exportable para valorización.
          </div>

          <div className="hr" style={{ marginTop: 14 }} />

          <h2 className="h3">Paso a paso (PRO)</h2>
          <ol className="small" style={{ marginTop: 8, paddingLeft: 18 }}>
            <li>
              <b>Completa normativa:</b> RTD/RCD (o modo avanzado) + camas (básico/medio/crítico).
            </li>
            <li>
              <b>Calcula normativa SAN</b> y revisa horas/semana + FTE.
            </li>
            <li>
              <b>Define horario real por día:</b> horas abiertas + personas simultáneas, colación y traslape.
            </li>
            <li>
              <b>Selecciona contratos y jornadas permitidas:</b> 20/30/40/42/44 y 6x1/5x2/4x3/PT fin de semana.
            </li>
            <li>
              <b>Política hospital:</b> define % máximo PT (recomendado 25%).
            </li>
            <li>
              <b>Genera mix PRO</b> y revisa “Cobertura por día” (demanda vs cubre vs brecha).
            </li>
            <li>
              <b>Descarga Excel PRO</b> (incluye Operación y MixPro) para valorización.
            </li>
          </ol>

          <div className="hr" style={{ marginTop: 14 }} />

          <h2 className="h3">Reglas de oro (especial si estas licitando)</h2>
          <ul className="small" style={{ marginTop: 8, paddingLeft: 18 }}>
            <li><b>Brecha por día = riesgo.</b> Si brecha &gt; 0 en algún día, no lo presentes así.</li>
            <li><b>FT primero.</b> PT solo para cerrar brechas (rotación y continuidad).</li>
            <li><b>Exporta Excel.</b> Es el formato real para valorización (costo empresa).</li>
          </ul>

          <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Link className="btn" href="/">
              Volver al inicio
            </Link>
            <Link className="btn btnPrimary" href="/san">
              Abrir SAN →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}