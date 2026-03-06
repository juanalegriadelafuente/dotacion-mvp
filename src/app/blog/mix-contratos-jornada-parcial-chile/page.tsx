// src/app/blog/mix-contratos-jornada-parcial/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mix de contratos y jornada parcial: cómo cubrir turnos sin sobredotar — Dotaciones.cl",
  description:
    "Cómo combinar contratos de 42, 30 y 20 horas para cubrir turnos de lunes a domingo sin pagar horas extras. Ejemplos prácticos para retail, restaurantes y salud en Chile.",
  alternates: {
    canonical: "https://dotaciones.cl/blog/mix-contratos-jornada-parcial",
  },
  openGraph: {
    title: "Mix de contratos y jornada parcial: cómo cubrir turnos sin sobredotar",
    description:
      "Combina contratos de 42, 30 y 20 horas para optimizar dotación. Ejemplos para retail, restaurantes y salud.",
    url: "https://dotaciones.cl/blog/mix-contratos-jornada-parcial",
    type: "article",
    publishedTime: "2026-01-18T00:00:00-03:00",
    modifiedTime: "2026-01-18T00:00:00-03:00",
    authors: ["https://dotaciones.cl"],
    tags: ["dotación", "turnos", "jornada parcial", "mix contratos", "Chile", "Ley 21.561"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Mix de contratos y jornada parcial: cómo cubrir turnos sin sobredotar",
  description:
    "Cómo combinar contratos de 42, 30 y 20 horas para cubrir turnos de lunes a domingo sin pagar horas extras.",
  datePublished: "2026-01-18T00:00:00-03:00",
  dateModified: "2026-01-18T00:00:00-03:00",
  author: {
    "@type": "Organization",
    name: "Dotaciones.cl",
    url: "https://dotaciones.cl",
  },
  publisher: {
    "@type": "Organization",
    name: "Dotaciones.cl",
    url: "https://dotaciones.cl",
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://dotaciones.cl/blog/mix-contratos-jornada-parcial",
  },
};

export default function ArticuloMixContratos() {
  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              dotaciones<span className="text-blue-600">.cl</span>
            </span>
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al blog
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Planificación
          </span>
          <span className="text-slate-400 text-sm">18 de enero, 2026</span>
          <span className="text-slate-400 text-sm">·</span>
          <span className="text-slate-400 text-sm">6 min de lectura</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
          Mix de contratos y jornada parcial: cómo cubrir todos los turnos sin sobredotar
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed mb-10 border-b border-gray-200 pb-10">
          Contratos de 42, 30 y 20 horas mezclados estratégicamente. Cómo armar una dotación que cubra
          lunes a domingo sin pagar horas extras ni inflar la planilla.
        </p>

        {/* CTA arriba */}
        <div className="bg-emerald-600 text-white rounded-xl p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">¿Quieres que el sistema proponga el mix?</p>
            <p className="text-emerald-100 text-xs mt-0.5">Ingresa tus parámetros y la calculadora genera las combinaciones óptimas.</p>
          </div>
          <Link
            href="/calculadora"
            className="shrink-0 bg-white text-emerald-700 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Generar mix →
          </Link>
        </div>

        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600">

          <h2>El problema de "todos a 42 horas"</h2>
          <p>
            Muchos negocios operan con una lógica por defecto: todo el mundo a jornada completa.
            Es más simple de administrar, pero no siempre es lo más eficiente. Un local con picos
            de demanda en ciertas horas o días puede estar pagando horas de baja productividad que
            encarecen el costo total sin mejorar el servicio.
          </p>
          <p>
            El mix de contratos permite ajustar la oferta de horas a la curva real de demanda.
            Bien diseñado, puede <strong>reducir el costo por hora cubierta</strong> sin reducir
            calidad ni cobertura.
          </p>

          <h2>Las jornadas disponibles en Chile (post Ley 21.561)</h2>
          <p>
            Con la reducción gradual de la jornada máxima a <strong>42 horas semanales</strong> desde
            abril 2026, el mapa de contratos disponibles es:
          </p>

          <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
            {[
              {
                horas: "42 hrs",
                label: "Jornada completa",
                desc: "El nuevo estándar desde abril 2026. Jornadas 5×2 o 6×1.",
                color: "border-blue-200 bg-blue-50",
                badge: "bg-blue-100 text-blue-700",
              },
              {
                horas: "30 hrs",
                label: "Jornada reducida",
                desc: "Ideal para refuerzo de fines de semana y puntas de demanda entre semana.",
                color: "border-emerald-200 bg-emerald-50",
                badge: "bg-emerald-100 text-emerald-700",
              },
              {
                horas: "20 hrs",
                label: "Media jornada",
                desc: "Para turnos cortos, mañanas de alta demanda o sábado-domingo específicamente.",
                color: "border-amber-200 bg-amber-50",
                badge: "bg-amber-100 text-amber-700",
              },
            ].map((j) => (
              <div key={j.horas} className={`rounded-xl border p-5 ${j.color}`}>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${j.badge}`}>
                  {j.horas}
                </span>
                <p className="font-bold text-slate-800 mt-3 mb-1">{j.label}</p>
                <p className="text-sm text-slate-600">{j.desc}</p>
              </div>
            ))}
          </div>

          <h2>¿Cuándo conviene usar jornadas parciales?</h2>

          <h3>1. Fin de semana con demanda diferente al resto de la semana</h3>
          <p>
            Un restaurant que opera de martes a domingo tiene un problema clásico: el sábado y domingo
            necesita más gente, pero no puede pedirle a los contratos de lunes a viernes que trabajen
            el fin de semana sistemáticamente. La solución es contratar 1-2 personas específicamente
            para sábado y domingo con jornada de 20 horas.
          </p>

          <h3>2. Puntas horarias claras</h3>
          <p>
            Una tienda retail con el 70% de las ventas entre las 12 y las 18 hrs no necesita la misma
            dotación todo el día. Incorporar personas con contrato de 20-30 horas en el tramo de mayor
            demanda reduce el costo sin afectar la atención en punta.
          </p>

          <h3>3. Cobertura 7 días sin horas extras</h3>
          <p>
            Para cubrir un puesto los 7 días de la semana con jornadas de 42h (6×1), necesitas
            exactamente 7 personas — una por día. Pero si el domingo tiene menor demanda, una persona
            con contrato de 20h PT fin de semana es más eficiente que usar un contrato full para
            cubrir solo ese día.
          </p>

          <h2>Ejemplo práctico — Local de comida rápida, 7 días</h2>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 not-prose">
            <p className="text-sm font-bold text-slate-600 mb-3">Parámetros del local</p>
            <div className="text-sm text-slate-700 space-y-1 mb-4">
              <p>Operación: L-D, 12 horas/día</p>
              <p>Mínimo simultáneo: 3 personas (L-V) / 4 personas (S-D)</p>
              <p>Horas a cubrir L-V: 3 × 12 × 5 = 180h | S-D: 4 × 12 × 2 = 96h</p>
              <p className="font-semibold">Total semanal: 276 horas</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 font-semibold">Contrato</th>
                  <th className="pb-2 font-semibold">Jornada</th>
                  <th className="pb-2 font-semibold">Cantidad</th>
                  <th className="pb-2 font-semibold">Horas/sem</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {[
                  ["42h", "6×1", "5", "210h"],
                  ["30h", "5×2 (L-V)", "1", "30h"],
                  ["20h", "PT fin de semana", "2", "40h"],
                ].map(([c, j, n, h]) => (
                  <tr key={c + j} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-semibold text-blue-700">{c}</td>
                    <td className="py-2">{j}</td>
                    <td className="py-2">{n}</td>
                    <td className="py-2 font-mono">{h}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="pt-3" colSpan={2}>Total</td>
                  <td className="pt-3">8 personas</td>
                  <td className="pt-3 font-mono">280h</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-3">
              Holgura de 4h (1.4%) — prácticamente ajustado. La calculadora genera este mix automáticamente.
            </p>
          </div>

          <h2>Riesgos a considerar</h2>
          <ul>
            <li><strong>No más de 3-4 tipos de contrato</strong> en un mismo equipo — más que eso complejiza la coordinación y las liquidaciones</li>
            <li><strong>Los traspasos de turno son momentos críticos</strong> — con más contratos hay más traspasos</li>
            <li><strong>Máximo 30-40% de contratos parciales</strong> en servicios donde la continuidad importa (salud, seguridad)</li>
          </ul>

          {/* CTA final */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-8 my-10 not-prose">
            <h3 className="text-lg font-bold mb-2">Genera el mix óptimo para tu equipo</h3>
            <p className="text-emerald-100 text-sm mb-5">
              Ingresa las horas que necesitas cubrir por día y la calculadora propone 2-3 combinaciones
              de contratos ordenadas por eficiencia. Gratis, sin registro.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/calculadora"
                className="bg-white text-emerald-700 font-bold px-6 py-3 rounded-lg text-sm hover:bg-emerald-50 transition-colors text-center"
              >
                Calculadora retail / food service →
              </Link>
              <Link
                href="/san"
                className="bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg text-sm hover:bg-emerald-400 transition-colors text-center border border-emerald-400"
              >
                Calculadora hospitalaria SAN →
              </Link>
            </div>
          </div>

          <h2>Conclusión</h2>
          <p>
            Un mix bien diseñado permite cubrir todos los turnos con menos costo y sin horas extras
            sistemáticas. La clave es tener claridad sobre la demanda real por día y franja horaria,
            y dejar que los números guíen la decisión — no la costumbre.
            Si quieres saltarte los cálculos manuales, la <Link href="/calculadora">calculadora de dotaciones.cl</Link> hace
            todo esto en segundos.
          </p>
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-200 pt-10 mt-10 flex flex-col sm:flex-row justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Ver todos los artículos
          </Link>
          <Link
            href="/blog/dotacion-hospitalaria-san"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
          >
            Siguiente: Dotación hospitalaria SAN
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </article>

      <footer className="border-t border-gray-200 py-8 px-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} dotaciones.cl — Todos los derechos reservados
      </footer>
    </main>
  );
}
