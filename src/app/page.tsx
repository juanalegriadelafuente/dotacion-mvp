// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container" style={{ paddingTop: 18 }}>
      <div className="topbar">
        <div className="brand">
          <Link href="/" className="brandMark" aria-label="Ir al inicio">
            <Image
              src="/logo.svg"
              alt="Dotaciones.cl"
              width={34}
              height={34}
              className="logo"
              priority
            />
            <span className="brandName">Dotaciones.cl</span>
          </Link>
          <div className="brandSub">
            Calculadoras gratuitas para dotación y mix de contratos.
          </div>
        </div>

        <div className="actions">
          <Link className="btn" href="/contacto">
            Contacto
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardPad">
          <h1 className="h2" style={{ margin: 0 }}>
            Elige tu calculadora
          </h1>
          <div className="small" style={{ marginTop: 6 }}>
            Dos caminos según tu tipo de operación. Ambas te entregan un resultado
            defendible y exportable a Excel.
          </div>

          <div className="grid2" style={{ marginTop: 14, gridTemplateColumns: "1fr 1fr" }}>
            {/* Retail */}
            <div className="card">
              <div className="cardPad">
                <div className="h3" style={{ margin: 0 }}>
                  🛒 Calculadora Retail / Servicios similares
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  Para operaciones con horario de funcionamiento y demanda por día
                  (turnos), donde necesitas un mix de contratos/jornadas.
                </div>

                <div className="hr" style={{ marginTop: 12 }} />

                <div className="h3" style={{ marginTop: 0 }}>
                  Paso a paso (rápido)
                </div>
                <ol className="small" style={{ marginTop: 6, paddingLeft: 18 }}>
                  <li>Define días abiertos y horas de funcionamiento.</li>
                  <li>Indica personas simultáneas + colación/traslape.</li>
                  <li>Elige contratos y jornadas permitidas.</li>
                  <li>Genera mix recomendado y descarga Excel.</li>
                </ol>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <Link className="btn btnPrimary" href="/calculadora">
                    Ir a Retail →
                  </Link>
                  <Link className="btn" href="/calculadora/guia">
                    Ver guía
                  </Link>
                </div>
              </div>
            </div>

            {/* SAN */}
            <div className="card">
              <div className="cardPad">
                <div className="h3" style={{ margin: 0 }}>
                  🏥 Calculadora SAN Hospitalaria
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  Para servicios de alimentación hospitalaria. Primero calcula normativa,
                  luego operación real (horario) y finalmente mix PRO (FT primero).
                </div>

                <div className="hr" style={{ marginTop: 12 }} />

                <div className="h3" style={{ marginTop: 0 }}>
                  Paso a paso (PRO)
                </div>
                <ol className="small" style={{ marginTop: 6, paddingLeft: 18 }}>
                  <li>Completa RTD/RCD (o modo avanzado) + camas.</li>
                  <li>Calcula normativa SAN.</li>
                  <li>Define horario por día (operación real).</li>
                  <li>Elige contratos/jornadas permitidas + % máximo PT.</li>
                  <li>Genera mix PRO y descarga Excel (incluye Operación y MixPro).</li>
                </ol>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <Link className="btn btnPrimary" href="/san">
                    Ir a SAN →
                  </Link>
                  <Link className="btn" href="/san/guia">
                    Ver guía
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="hr" style={{ marginTop: 16 }} />

          <div className="small">
            Tip: si estás licitando, usa siempre el Excel exportado para valorización
            (costo empresa) y respaldo.
          </div>
        </div>
      </div>
    </main>
  );
}