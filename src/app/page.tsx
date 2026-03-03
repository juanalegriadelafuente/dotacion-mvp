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
            Calculadoras gratuitas para dotación y mix de contratos (con Excel).
          </div>
        </div>

        <div className="actions">
          <Link className="btn" href="/contacto">
            Contacto
          </Link>
        </div>
      </div>

      {/* CTA principal: SAN (empuje de tráfico) */}
      <div className="card" style={{ marginTop: 12 }}>
        <div
          className="cardPad"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="h3" style={{ margin: 0 }}>
              🏥 Nuevo: Calculadora SAN Hospitalaria (PRO)
            </div>
            <div className="small" style={{ marginTop: 4 }}>
              Normativa + operación por día + mix FT primero + Excel PRO (operación + mix).
            </div>
          </div>

          <Link className="btn btnPrimary" href="/san">
            Ir a SAN →
          </Link>
        </div>
      </div>

      {/* 2 caminos */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardPad">
          <h1 className="h2" style={{ margin: 0 }}>
            Elige tu calculadora
          </h1>
          <div className="small" style={{ marginTop: 6 }}>
            No necesitas miles de visitas: necesitas resultados defendibles para tomar decisiones.
          </div>

          <div
            className="grid2"
            style={{ marginTop: 14, gridTemplateColumns: "1fr 1fr" }}
          >
            {/* Retail */}
            <div className="card">
              <div className="cardPad">
                <div className="h3" style={{ margin: 0 }}>
                  🛒 Retail / Servicios
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  Horario por día + demanda → mix sugerido de jornadas/contratos + Excel.
                </div>

                <div className="hr" style={{ marginTop: 12 }} />

                <div className="h3" style={{ marginTop: 0 }}>
                  Paso a paso
                </div>
                <ol className="small" style={{ marginTop: 6, paddingLeft: 18 }}>
                  <li>Define días abiertos y demanda por tramos (30 min) o simple.</li>
                  <li>Indica colación y traslape por día.</li>
                  <li>Elige contratos y jornadas permitidas.</li>
                  <li>Genera mix y descarga Excel.</li>
                </ol>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}
                >
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
                  🏥 SAN Hospitalaria
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  Normativa + operación real por día → mix PRO FT primero + cobertura por día + Excel.
                </div>

                <div className="hr" style={{ marginTop: 12 }} />

                <div className="h3" style={{ marginTop: 0 }}>
                  Paso a paso (PRO)
                </div>
                <ol className="small" style={{ marginTop: 6, paddingLeft: 18 }}>
                  <li>Completa RTD/RCD (o modo avanzado) + camas.</li>
                  <li>Calcula normativa SAN.</li>
                  <li>Define horario por día (horas, personas, colación, traslape).</li>
                  <li>Selecciona contratos/jornadas y % máximo PT.</li>
                  <li>Genera mix PRO + descarga Excel.</li>
                </ol>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}
                >
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
            Tip: usa siempre el Excel exportado para valorización (costo empresa) y respaldo.
          </div>
        </div>
      </div>
    </main>
  );
}