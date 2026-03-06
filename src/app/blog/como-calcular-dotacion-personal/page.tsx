// src/app/blog/como-calcular-dotacion-personal/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo calcular cuánta gente necesito para cubrir mis turnos — Dotaciones.cl",
  description:
    "Guía paso a paso para calcular la dotación de personal según horas requeridas, turnos y factor de reemplazo. Con calculadora gratuita incluida. Para retail, restaurantes y salud en Chile.",
  alternates: {
    canonical: "https://dotaciones.cl/blog/como-calcular-dotacion-personal",
  },
  openGraph: {
    title: "Cómo calcular cuánta gente necesito para cubrir mis turnos",
    description:
      "Metodología práctica para dimensionar dotación según horas, turnos y ausentismo. Con calculadora gratuita.",
    url: "https://dotaciones.cl/blog/como-calcular-dotacion-personal",
    type: "article",
    publishedTime: "2026-01-10T00:00:00-03:00",
    modifiedTime: "2026-01-10T00:00:00-03:00",
    authors: ["https://dotaciones.cl"],
    tags: ["dotación", "turnos", "planificación", "RRHH", "Chile"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Cómo calcular cuánta gente necesito para cubrir mis turnos",
  description:
    "Guía paso a paso para calcular la dotación de personal según horas requeridas, turnos y factor de reemplazo.",
  datePublished: "2026-01-10T00:00:00-03:00",
  dateModified: "2026-01-10T00:00:00-03:00",
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
    "@id": "https://dotaciones.cl/blog/como-calcular-dotacion-personal",
  },
};

export default function ArticuloCalcularDotacion() {
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
        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Metodología
          </span>
          <span className="text-slate-400 text-sm">10 de enero, 2026</span>
          <span className="text-slate-400 text-sm">·</span>
          <span className="text-slate-400 text-sm">8 min de lectura</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
          Cómo calcular cuánta gente necesito para cubrir mis turnos
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed mb-10 border-b border-gray-200 pb-10">
          Si te has preguntado cuántas personas necesitas para cubrir x horas semanales, esta guía es para ti.
          Metodología práctica con factor de reemplazo, mix de contratos y calculadora gratuita.
        </p>

        {/* CTA calculadora — arriba del fold */}
        <div className="bg-blue-600 text-white rounded-xl p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">¿Prefieres calcularlo directo?</p>
            <p className="text-blue-100 text-xs mt-0.5">Ingresa tus horas y turnos — el sistema calcula la dotación automáticamente.</p>
          </div>
          <Link
            href="/calculadora"
            className="shrink-0 bg-white text-blue-700 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Ir a la calculadora →
          </Link>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600">

          <h2>¿Por qué el cálculo de dotación importa tanto?</h2>
          <p>
            Una dotación mal calculada genera dos problemas igualmente costosos: la <strong>subdotación</strong> — que aumenta la carga del equipo, sube el ausentismo y pone en riesgo la operación — y la <strong>sobredotación</strong>, que infla el gasto sin mejorar resultados. En Chile, con la reducción de jornada a 42 horas (Ley 21.561), calcular bien la dotación es más importante que nunca.
          </p>

          <h2>Paso 1: Define cuántas horas necesitas cubrir</h2>
          <p>
            Antes de cualquier número, tienes que saber cuántas horas de operación requiere tu negocio o servicio por semana. Por ejemplo:
          </p>
          <ul>
            <li>Un local de comida rápida que opera <strong>lunes a domingo, 12 horas al día</strong> necesita cubrir <strong>84 horas semanales</strong></li>
            <li>Un servicio de hospitalización que funciona <strong>24/7</strong> necesita cubrir <strong>168 horas semanales</strong></li>
            <li>Una tienda retail <strong>lunes a sábado, 10 horas</strong> necesita cubrir <strong>60 horas semanales</strong></li>
          </ul>
          <p>
            Ese número — las horas totales a cubrir — es tu punto de partida.
          </p>

          <h2>Paso 2: Calcula las horas disponibles por persona</h2>
          <p>
            Cada contrato tiene una jornada semanal, pero no todas las horas son productivas. Con la jornada reduciéndose a <strong>42 horas semanales</strong> desde abril 2026, los cálculos cambian. Considera:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 not-prose">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Horas netas disponibles</p>
            <div className="space-y-2 text-sm text-slate-700 font-mono">
              <p>Horas brutas = jornada semanal × 52 semanas</p>
              <p>Horas netas = Horas brutas − Ausentismo estimado</p>
              <div className="border-t border-slate-200 pt-3 mt-3 space-y-1 text-slate-500">
                <p>Ausentismo típico incluye:</p>
                <p className="pl-4">– Vacaciones (15 días hábiles mínimo)</p>
                <p className="pl-4">– Licencias médicas (5–12% según rubro)</p>
                <p className="pl-4">– Permisos y capacitaciones</p>
              </div>
            </div>
          </div>

          <p>
            Una persona con contrato de 42 horas tiene aproximadamente <strong>2.184 horas brutas al año</strong>.
            Descontando ausentismo promedio del 15%, quedan cerca de <strong>1.856 horas netas disponibles</strong>.
          </p>

          <h2>Paso 3: El factor de reemplazo — el paso que más se omite</h2>
          <p>
            Para cubrir <strong>1 puesto de forma continua</strong> necesitas más de 1 persona, porque cada persona falta. El factor de reemplazo (FR) cuantifica eso:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 not-prose font-mono text-sm">
            <p className="text-slate-500 mb-2">FR = 1 / (1 − tasa de ausentismo)</p>
            <div className="mt-4 space-y-1 text-slate-700">
              <p>Retail / comida rápida: ausentismo ~10% → FR = <strong>1.11</strong></p>
              <p>Salud privada: ausentismo ~12% → FR = <strong>1.14</strong></p>
              <p>Salud pública: ausentismo ~18% → FR = <strong>1.22</strong></p>
            </div>
          </div>

          <p>
            Si necesitas <strong>5 personas simultáneas</strong> y tu FR es 1.15, la dotación real es
            <strong> 5 × 1.15 = 5.75 → 6 personas</strong>.
          </p>

          <h2>Paso 4: Divide por jornada y considera los días de la semana</h2>
          <p>
            El tipo de jornada define cuántos días trabaja cada persona. Las más comunes en Chile:
          </p>
          <ul>
            <li><strong>5×2</strong>: 5 días trabajo, 2 descanso — el estándar para L-V</li>
            <li><strong>6×1</strong>: 6 días trabajo, 1 descanso — común en retail y food service</li>
            <li><strong>4×3</strong>: 4 días trabajo, 3 descanso — solo disponible con contrato de 40h</li>
          </ul>
          <p>
            Un servicio 7 días requiere un mix de jornadas para garantizar cobertura los fines de semana sin
            pagar horas extras sistemáticas.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6 not-prose">
            <p className="text-sm font-bold text-blue-700 mb-2">Ejemplo práctico — Local de comida rápida</p>
            <p className="text-sm text-slate-700">
              Opera <strong>7 días, 12 horas/día</strong> con un mínimo de <strong>3 personas simultáneas</strong>.
              Horas a cubrir: 3 × 12 × 7 = <strong>252 horas/semana</strong>.
              Con contratos de 42h y FR de 1.11: necesitas <strong>252 / 42 × 1.11 = 6.7 → 7 personas</strong>.
              La calculadora de dotaciones.cl hace este cálculo automáticamente y además propone el mix óptimo de contratos.
            </p>
          </div>

          <h2>Paso 5: Propón el mix de contratos</h2>
          <p>
            Tener toda la dotación a 42 horas no siempre es lo más eficiente. Mezclar contratos de 42h, 30h y 20h
            permite ajustar la cobertura a los días de mayor demanda sin sobredotar los días tranquilos.
            <Link href="/blog/mix-contratos-jornada-parcial"> Lee más sobre mix de contratos aquí.</Link>
          </p>

          {/* CTA captura correo */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 my-10 not-prose">
            <h3 className="text-lg font-bold mb-2">Calcula tu dotación ahora — es gratis</h3>
            <p className="text-blue-100 text-sm mb-5">
              Ingresa tus horas, días de operación y personas requeridas. El sistema propone el mix
              de contratos óptimo según la normativa chilena vigente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/calculadora"
                className="bg-white text-blue-700 font-bold px-6 py-3 rounded-lg text-sm hover:bg-blue-50 transition-colors text-center"
              >
                Ir a calculadora retail / comida rápida →
              </Link>
              <Link
                href="/san"
                className="bg-blue-500 text-white font-bold px-6 py-3 rounded-lg text-sm hover:bg-blue-400 transition-colors text-center border border-blue-400"
              >
                Calculadora hospitalaria SAN →
              </Link>
            </div>
          </div>

          <h2>Resumen: fórmula rápida</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 not-prose font-mono text-sm">
            <p className="text-slate-700">Dotación mínima = (Horas a cubrir / Jornada contrato) × Factor de reemplazo</p>
            <p className="text-slate-500 mt-3 text-xs">
              Ejemplo: (252h / 42h) × 1.11 = 6.7 → 7 personas con contrato de 42h
            </p>
          </div>

          <p className="mt-6">
            Este cálculo es el punto de partida. La dotación final depende también del tipo de jornada,
            la distribución semanal de la demanda y las restricciones presupuestarias.
            La <Link href="/calculadora">calculadora de dotaciones.cl</Link> automatiza todo esto en segundos.
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
            href="/blog/mix-contratos-jornada-parcial"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
          >
            Siguiente: Mix de contratos
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
