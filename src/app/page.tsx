// src/app/page.tsx
import Link from "next/link";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--panel)",
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
      <div style={{ marginTop: 10, color: "var(--muted)", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid var(--border)",
    fontWeight: 900,
    textDecoration: "none",
    gap: 10,
    cursor: "pointer",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--primary)",
      color: "white",
      border: "1px solid rgba(0,0,0,0.08)",
    },
    secondary: {
      background: "var(--btn)",
      color: "var(--text)",
    },
  };

  return (
    <Link href={href} style={{ ...base, ...variants[variant] }}>
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 60px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Dotaciones.cl</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Herramienta gratuita para dimensionar dotación y tomar decisiones operativas.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ButtonLink href="/calculadora" variant="secondary">
            Ir a la calculadora →
          </ButtonLink>
        </div>
      </div>

      {/* Hero */}
      <section style={{ marginTop: 22 }}>
        <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1, fontWeight: 1000 }}>
          Calculadora de Dotación Retail en Chile
        </h1>
        <p style={{ marginTop: 12, marginBottom: 0, fontSize: 16, color: "var(--muted)", maxWidth: 820 }}>
          Estima cuántas personas necesitas para cubrir tu semana considerando <b>horas abiertas</b>, <b>personas simultáneas</b>,
          <b>cambios de turno</b>, <b>colación no imputable</b>, <b>traslapes</b> y el <b>efecto domingo</b>.
        </p>

        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <ButtonLink href="/calculadora" variant="primary">
            Empezar cálculo
          </ButtonLink>
          <ButtonLink href="/calculadora" variant="secondary">
            Cargar ejemplo típico
          </ButtonLink>
          <ButtonLink href="#faq" variant="secondary">
            Ver preguntas frecuentes
          </ButtonLink>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
          Búsquedas objetivo: <b>“calculadora dotación retail chile”</b>, <b>“cuántas personas necesito para mi tienda”</b>,
          <b>“dotación mínima retail domingo”</b>.
        </div>
      </section>

      {/* Grid info */}
      <section style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Qué entrega">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Horas-persona/semana + FTE estimado</li>
            <li>Chequeo colación vs traslape (brecha)</li>
            <li>Chequeo dominical (cuello de botella retail)</li>
            <li>Propuestas de mix de contratos (alternativas)</li>
          </ul>
        </Card>

        <Card title="Para quién es">
          Operaciones, RRHH, jefaturas de tienda y cualquier persona que necesite dimensionar dotación sin pagar software.
          <div style={{ marginTop: 10 }}>
            Ideal cuando la pregunta es: <b>“necesito 2 personas durante todo el día… ¿cuántas contrato?”</b>
          </div>
        </Card>

        <Card title="Cómo funciona (en 60 segundos)">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>Define parámetros base: horas full, umbral full-time y disponibilidad dominical.</li>
            <li>Define tu set real de contratos (42h, 36h, 30h, 20h, etc.).</li>
            <li>Completa la semana: horas abiertas, personas simultáneas, cambios de turno, traslape y colación.</li>
            <li>Presiona <b>CALCULAR</b> y revisa FTE + mixes sugeridos.</li>
          </ol>
        </Card>

        <Card title="Nota de calidad (MVP)">
          Esto es un MVP pero está pensado para crecer a una calculadora más robusta (presets por rubro, reportes descargables,
          y estimación de costo empresa). La idea es que sea <b>la mejor calculadora gratuita de dotación</b>.
        </Card>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ marginTop: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 1000, marginBottom: 10 }}>
          Preguntas frecuentes sobre dotación retail en Chile
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <Card title="¿Qué es dotación mínima en retail?">
            Es la dotación necesaria para mantener la operación funcionando durante el horario de apertura,
            asegurando cobertura continua (por ejemplo: “2 personas todo el día”). En la práctica se traduce
            a horas-persona/semana y un FTE estimado.
          </Card>

          <Card title="¿Por qué el domingo cambia tanto el resultado?">
            Porque en retail el domingo suele ser el cuello de botella: parte del personal full-time no está disponible
            o “rinde menos” por reglas de descanso/rotación. Por eso la calculadora aplica un factor de disponibilidad dominical.
          </Card>

          <Card title="¿Personas simultáneas vs cambios de turno/día no es lo mismo?">
            No. “Personas simultáneas” es cuántas necesitas al mismo tiempo. “Cambios de turno/día” es cuántos equipos se alternan.
            Ejemplo: 2 personas simultáneas con 2 cambios de turno significa que operas con equipos AM/PM manteniendo 2 al mismo tiempo.
          </Card>

          <Card title="¿Cómo uso traslape y colación no imputable?">
            Traslape es el cruce entre turnos (sirve para cubrir colación/cambio). Colación no imputable es presencia adicional.
            Si hay brecha, normalmente se resuelve subiendo traslape o ajustando cambios de turno.
          </Card>
        </div>

        <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 12 }}>
          © {new Date().getFullYear()} Dotaciones.cl
        </div>
      </section>
    </main>
  );
}