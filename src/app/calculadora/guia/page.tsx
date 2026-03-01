// src/app/calculadora/guia/page.tsx
import Link from "next/link";

export default function GuiaRetailPage() {
  return (
    <main className="container" style={{ paddingTop: 18 }}>
      <div className="topbar">
        <div className="brand">
          <Link href="/" className="brandMark">
            <span className="brandName">Dotaciones.cl</span>
          </Link>
          <div className="brandSub">Guía de uso — Calculadora Retail</div>
        </div>
        <div className="actions">
          <Link className="btn" href="/calculadora">
            Ir a la calculadora →
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardPad">
          <h1 className="h2">Cómo usar la Calculadora Retail</h1>

          <div className="small" style={{ marginTop: 8 }}>
            Objetivo: convertir tu horario real y la demanda de personas en un{" "}
            <b>mix de contratos</b> (6x1, 5x2, 4x3, PT fin de semana) con un Excel para valorización.
          </div>

          <div className="hr" style={{ marginTop: 14 }} />

          <h2 className="h3">Paso a paso</h2>
          <ol className="small" style={{ marginTop: 8, paddingLeft: 18 }}>
            <li>
              <b>Días y horario:</b> marca los días abiertos y define horas de funcionamiento.
            </li>
            <li>
              <b>Demanda:</b> define personas simultáneas (cuántas necesitas “al mismo tiempo”).
            </li>
            <li>
              <b>Colación y traslape:</b> ajusta colación (no imputable) y traslape (minutos que se pisan).
            </li>
            <li>
              <b>Contratos y jornadas:</b> elige qué contratos (20/30/40/42/44) y qué jornadas permites.
            </li>
            <li>
              <b>Resultado:</b> revisa mix recomendado + alternativas y descarga el Excel.
            </li>
          </ol>

          <div className="hr" style={{ marginTop: 14 }} />

          <h2 className="h3">Buenas prácticas</h2>
          <ul className="small" style={{ marginTop: 8, paddingLeft: 18 }}>
            <li>Si hay mucha holgura, agrega un contrato intermedio (ej 30h).</li>
            <li>Si el fin de semana es distinto, asegúrate de setear demanda por día.</li>
            <li>Valida el resultado mirando brechas por día antes de valorizar.</li>
          </ul>

          <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Link className="btn" href="/">
              Volver al inicio
            </Link>
            <Link className="btn btnPrimary" href="/calculadora">
              Abrir calculadora →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}