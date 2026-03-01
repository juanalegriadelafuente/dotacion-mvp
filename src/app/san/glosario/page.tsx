import Link from "next/link";

type Term = { sigla: string; nombre: string; definicion: string; nota?: string };

const TERMS: Term[] = [
  {
    sigla: "SAN",
    nombre: "Servicio de Alimentación y Nutrición",
    definicion:
      "Unidad responsable de la producción y distribución de alimentación y de procesos asociados en el establecimiento de salud.",
  },
  {
    sigla: "UCP",
    nombre: "Unidad Central de Producción",
    definicion:
      "Área donde se concentran procesos productivos: recepción, almacenamiento, producción, lavado y coordinación de distribución.",
  },
  {
    sigla: "RTD",
    nombre: "Raciones Totales Día",
    definicion:
      "Total de raciones producidas al día (sumatoria según tiempos de comida y coeficientes).",
  },
  {
    sigla: "RCD",
    nombre: "Ración Completa Día",
    definicion:
      "RTD ajustada por factores de complejidad (multiplicadores) que reflejan exigencias adicionales del proceso productivo.",
  },
  {
    sigla: "CR",
    nombre: "Coeficiente de ración",
    definicion:
      "Factor aplicado a una ración según tiempo de comida para estandarizar el volumen de trabajo en una medida comparable.",
  },
  {
    sigla: "FC",
    nombre: "Factor de complejidad",
    definicion:
      "Multiplicador que incrementa la RTD para representar mayor complejidad operacional (equipamiento, materias primas, líneas adicionales, etc.).",
  },
];

export const metadata = {
  title: "Glosario SAN | Dotaciones.cl",
  description:
    "Glosario de siglas y conceptos usados en la Calculadora SAN (Hospitalaria): RTD, RCD, FC, CR, UCP, y más.",
};

export default function GlosarioSanPage() {
  return (
    <main className="container" style={{ paddingTop: 18 }}>
      <div className="topbar">
        <div className="brand">
          <div className="brandName">Dotaciones.cl</div>
          <div className="brandSub">Glosario SAN (según manual)</div>
        </div>
        <div className="actions">
          <Link className="btn" href="/san">
            Volver a la calculadora SAN
          </Link>
          <Link className="btn" href="/">
            Inicio
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardPad">
          <h1 className="h2">Glosario</h1>
          <div className="small" style={{ marginTop: 6 }}>
            Definiciones operativas para completar bien los inputs. Si una sigla no está, la agregamos.
          </div>

          <div className="hr" style={{ marginTop: 12 }} />

          <div style={{ display: "grid", gap: 10 }}>
            {TERMS.map((t) => (
              <div key={t.sigla} className="card">
                <div className="cardPad">
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <div className="h3" style={{ margin: 0 }}>
                      {t.sigla}
                    </div>
                    <div className="small">{t.nombre}</div>
                  </div>
                  <div style={{ marginTop: 8 }}>{t.definicion}</div>
                  {t.nota ? <div className="small" style={{ marginTop: 8 }}>{t.nota}</div> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="hr" style={{ marginTop: 14 }} />
          <div className="small">
            ¿Te falta una sigla? Escríbenos por{" "}
            <Link href="/contacto">Contacto</Link> y la agregamos.
          </div>
        </div>
      </div>
    </main>
  );
}