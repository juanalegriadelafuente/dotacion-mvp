// src/app/page.tsx

import Image from "next/image";
import Link from "next/link";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="cardPad">
        <div className="cardHead">
          <h2 className="h2">{title}</h2>
        </div>
        <div className="p">{children}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="container">
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
            Herramienta gratuita para dimensionar dotación por tramos (cada 30
            minutos).
          </div>
        </div>

        <div className="actions">
          <Link className="btn" href="/contacto">
            Sugerencias
          </Link>
          <Link className="btn btnPrimary" href="/calculadora">
            Ir a la calculadora →
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 18 }} className="grid2">
        <div className="card">
          <div className="cardPad">
            <h1 className="h1">
              Calculadora de Dotación por Tramos (30 min) — Chile
            </h1>
            <p className="p">
              Si tu operación <b>sube y baja por hora</b> (retail, alimentación,
              bodegas, clínicas…), aquí puedes cargar tu
              <b> necesidad operativa</b> como una grilla:{" "}
              <b>cuántas personas necesitas cada 30 minutos</b>. Luego te
              devolvemos <b>horas-persona</b>, <b>FTE</b> y{" "}
              <b>mix de contratos sugerido</b>.
            </p>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link className="btn btnPrimary" href="/calculadora">
                Empezar cálculo
              </Link>
              <Link className="btn" href="/calculadora?example=1">
                Cargar ejemplo típico
              </Link>
              <a className="btn btnGhost" href="#como">
                Cómo funciona
              </a>
            </div>

            <div style={{ marginTop: 10 }} className="small">
              Palabras clave: <b>calculadora de dotación</b>,{" "}
              <b>dimensionamiento de personal</b>, <b>dotación por tramos</b>.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardPad">
            <div className="h2">Ejemplo rápido (un día)</div>
            <div className="hr" />
            <div style={{ display: "grid", gap: 10 }}>
              <div className="alert">
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>08:00–12:00</span>
                  <b>2 pers.</b>
                </div>
              </div>
              <div className="alert">
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>12:00–16:00</span>
                  <b>3 pers.</b>
                </div>
              </div>
              <div className="alert">
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>16:00–20:00</span>
                  <b>2 pers.</b>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10 }} className="small">
              Tú cargas los tramos. La herramienta te devuelve <b>FTE</b> y{" "}
              <b>alternativas de mix</b>.
            </div>
          </div>
        </div>
      </div>

      <div id="como" style={{ marginTop: 14 }} className="grid2">
        <Card title="Qué entrega">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Horas-persona/semana + FTE estimado</li>
            <li>Demanda por día (para detectar cuellos)</li>
            <li>Mix de contratos sugerido (alternativas)</li>
            <li>Warnings (holguras raras / exceso de PT)</li>
          </ul>
        </Card>

        <Card title="Qué cambió (y por qué es mejor)">
          <div>
            Antes era “semana simple”. Ahora es{" "}
            <b>necesidad operativa por tramos de 30 min</b>. Eso permite modelar
            picos (almuerzo, salida, cierre), días distintos (sábado/domingo) y
            operaciones que cruzan medianoche.
          </div>
        </Card>

        <Card title="Cómo funciona (en 4 pasos)">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>Defines tu base: horas full para FTE y umbral FT/PT.</li>
            <li>Ingresas tus contratos reales (42h, 36h, 30h, 20h…).</li>
            <li>Completas la semana en tramos de 30 min.</li>
            <li>Presionas Calcular y revisas mixes sugeridos.</li>
          </ol>
        </Card>

        <Card title="Para quién es">
          Operaciones, RRHH, jefaturas de local y cualquiera que necesite
          responder rápido:{" "}
          <b>
            “Con esta demanda por hora… ¿cuántas personas contrato y con qué
            mix?”
          </b>
        </Card>
      </div>

      <div style={{ marginTop: 16 }} className="small">
        © {year} Dotaciones.cl
      </div>
    </main>
  );
}
