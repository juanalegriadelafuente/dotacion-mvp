// src/app/page.tsx
import Link from "next/link";

const FAQ = [
  {
    q: "¿Qué es la dotación mínima en retail?",
    a: "Es la cantidad mínima de personas necesarias para mantener tu operación funcionando durante el horario de apertura, asegurando cobertura continua (por ejemplo: “2 personas todo el día”). En la práctica se traduce a horas-persona/semana y un FTE estimado (full-time equivalents).",
  },
  {
    q: "¿Cómo influye el “efecto domingo” en la dotación?",
    a: "En retail, el domingo suele ser el cuello de botella: parte del personal full-time no está disponible o “rinde menos” por restricciones de descanso/rotación. Por eso la calculadora aplica un factor de disponibilidad dominical, para que no subestimes la dotación real.",
  },
  {
    q: "¿Cómo se calculan las horas-persona y el FTE?",
    a: "Horas-persona/semana = (horas abiertas del día × personas requeridas) sumado para toda la semana, ajustado por traslapes y colaciones según tu operación. FTE es ese total dividido por las horas de un contrato full semanal (por defecto 42h).",
  },
  {
    q: "¿Qué es el “mix de contratos” y por qué importa?",
    a: "Es la combinación de contratos (por ejemplo 42h + 20h + 16h) para cubrir las horas requeridas con la menor fricción operativa posible. Un mix razonable reduce horas muertas, evita brechas dominicales y mejora el ajuste entre demanda y disponibilidad.",
  },
];

function FAQSchema() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <FAQSchema />

      {/* Top bar */}
      <div className="border-b border-zinc-800/80">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-zinc-50/10 border border-zinc-700/60" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Dotaciones.cl</div>
              <div className="text-xs text-zinc-400">Herramienta gratuita para planificación de dotación</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/calculadora"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
            >
              Ir a la calculadora →
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight leading-tight">
              Calculadora de Dotación Retail en Chile
            </h1>
            <p className="mt-4 text-zinc-300 leading-relaxed">
              Estima cuántas personas necesitas para cubrir tu semana, considerando{" "}
              <span className="text-zinc-100 font-medium">horas abiertas</span>,{" "}
              <span className="text-zinc-100 font-medium">personas requeridas</span>,{" "}
              <span className="text-zinc-100 font-medium">colaciones</span>,{" "}
              <span className="text-zinc-100 font-medium">traslapes</span> y el{" "}
              <span className="text-zinc-100 font-medium">efecto domingo</span>.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/calculadora"
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 transition"
              >
                Empezar cálculo →
              </Link>
              <Link
                href="/calculadora?ejemplo=1"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700/70 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-900 transition"
              >
                Cargar ejemplo típico
              </Link>
            </div>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4">
                <div className="text-sm font-semibold">Qué entrega</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-zinc-300 space-y-1">
                  <li>Horas-persona/semana + FTE estimado</li>
                  <li>Chequeo colación vs traslape (brecha)</li>
                  <li>Chequeo dominical (cuello de botella retail)</li>
                  <li>2–3 propuestas de mix de contratos</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4">
                <div className="text-sm font-semibold">Para quién es</div>
                <p className="mt-2 text-sm text-zinc-300">
                  Operaciones, RRHH, jefaturas de tienda y cualquier persona que necesite
                  dimensionar dotación sin pagar software.
                </p>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/40 to-zinc-950 p-6">
            <div className="text-sm font-semibold">Cómo funciona (en 60 segundos)</div>
            <ol className="mt-4 space-y-3 text-sm text-zinc-300">
              <li className="flex gap-3">
                <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-zinc-50/10 border border-zinc-700/60 flex items-center justify-center text-xs font-semibold text-zinc-100">
                  1
                </div>
                <div>
                  Define parámetros base: horas full semanal, umbral full-time y disponibilidad dominical.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-zinc-50/10 border border-zinc-700/60 flex items-center justify-center text-xs font-semibold text-zinc-100">
                  2
                </div>
                <div>Configura tu set de contratos (42h, 36h, 30h, 20h, etc.).</div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-zinc-50/10 border border-zinc-700/60 flex items-center justify-center text-xs font-semibold text-zinc-100">
                  3
                </div>
                <div>
                  Completa la semana: horas abierto, personas requeridas, turnos, traslape y colación.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center text-xs font-semibold text-red-200">
                  4
                </div>
                <div>
                  Presiona <span className="font-semibold text-zinc-100">CALCULAR</span> y revisa FTE + mixes sugeridos.
                </div>
              </li>
            </ol>

            <div className="mt-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-400">
                Nota de calidad
              </div>
              <p className="mt-2 text-sm text-zinc-300">
                Esta herramienta entrega una estimación operativa (MVP) y se irá refinando con mejoras de
                modelo, presets por rubro y reportes descargables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/20 p-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Preguntas frecuentes sobre dotación retail en Chile
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Respuestas cortas y claras para que operaciones y RRHH hablen el mismo idioma.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {FAQ.map((f) => (
              <div
                key={f.q}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-5"
              >
                <div className="text-sm font-semibold text-zinc-100">{f.q}</div>
                <div className="mt-2 text-sm text-zinc-300 leading-relaxed">{f.a}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">
              Consejo: si el domingo “no te da”, ajusta mix de contratos o sube disponibilidad dominical full.
            </div>
            <Link
              href="/calculadora"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
            >
              Ir a la calculadora →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Dotaciones.cl</div>
          <div className="text-zinc-600">
            Herramienta gratuita • Enfoque Chile (escala LATAM)
          </div>
        </div>
      </footer>
    </main>
  );
}