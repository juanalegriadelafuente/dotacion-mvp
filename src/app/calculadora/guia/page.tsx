// src/app/calculadora/guia/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guía de uso — Calculadora Retail | Dotaciones.cl",
  description:
    "Aprende a usar la calculadora de dotación retail paso a paso: días, demanda, contratos, jornadas y exportación a Excel. Incluye ejemplos reales.",
  alternates: { canonical: "https://dotaciones.cl/calculadora/guia" },
};

const steps = [
  {
    n: "01",
    title: "Escenario de jornada máxima",
    body: "Selecciona la jornada contractual máxima de tu empresa: 44h (antes de abril 2026), 42h (vigente desde abril 2026) o 40h. Esto define el FTE base y los tipos de jornada disponibles (6×1, 5×2, 4×3).",
    tip: "Si tu empresa aún no ha reducido a 42h, usa 44h para que el cálculo sea consistente con tus contratos actuales.",
  },
  {
    n: "02",
    title: "Días y horario de operación",
    body: "Marca los días que opera tu local y define cuántas horas está abierto cada día. Puedes tener horarios distintos entre semana y fin de semana — por ejemplo 10h de lunes a viernes y 8h el sábado.",
    tip: "Si el domingo está cerrado, márcalo como cerrado. El sistema no generará demanda para ese día y ajustará el mix.",
  },
  {
    n: "03",
    title: "Personas simultáneas requeridas",
    body: "Define cuántas personas necesitas trabajando al mismo tiempo en cada día. Este es el dato más importante: no es el total de personas del equipo, sino el mínimo simultáneo para operar correctamente.",
    tip: "Ejemplo: si necesitas 1 cajera + 1 reponedor + 1 supervisor, el mínimo simultáneo es 3.",
  },
  {
    n: "04",
    title: "Colación y traslape",
    body: "La colación (30 min típicamente) es tiempo no imputable — el trabajador descansa y no cubre el puesto. El traslape es el solapamiento entre turnos entrante y saliente. Si el turno entrante llega 15 min antes, hay 15 min de traslape que compensa parte de la colación.",
    tip: "Si no hay traslape y hay colación, el sistema agrega esa brecha a las horas requeridas. Para evitar holgura excesiva, sube el traslape o baja la colación.",
  },
  {
    n: "05",
    title: "Factor de reemplazo",
    body: "Multiplica las horas requeridas para cubrir el ausentismo real del equipo (licencias, vacaciones, permisos). Un factor de 1.15 significa que necesitas un 15% más de horas contratadas que las horas operativas requeridas.",
    tip: "Retail típico: 1.10–1.15. Food service: 1.12–1.18. Si no sabes el dato, parte con 1.12 y ajusta según la experiencia.",
  },
  {
    n: "06",
    title: "Contratos disponibles",
    body: "Selecciona qué tipos de contrato puedes usar: 44h, 42h, 40h, 30h o 20h (PT). Puedes marcar varios. El sistema combinará solo los que hayas seleccionado.",
    tip: "Para cubrir fines de semana sin sobredotar entre semana, activa el contrato de 20h PT fin de semana.",
  },
  {
    n: "07",
    title: "Jornadas permitidas",
    body: "Define qué esquemas de días trabajo/descanso se pueden usar: 6×1 (6 días trabajo, 1 descanso), 5×2 (lunes a viernes) o 4×3 (solo disponible con contrato de 40h). El PT fin de semana cubre sábado y domingo fijo.",
    tip: "4×3 es útil para operaciones 7 días que quieren evitar horas extras en el fin de semana.",
  },
  {
    n: "08",
    title: "Máximo PT permitido",
    body: "Limita qué porcentaje del total de horas puede cubrirse con contratos parciales (≤20h). El default es 25%. Si tu operación requiere más estabilidad, baja este límite.",
    tip: "En servicios donde la continuidad importa (salud, seguridad), se recomienda no superar 30% de PT.",
  },
  {
    n: "09",
    title: "Genera el mix",
    body: "Haz clic en 'Calcular mix'. El sistema propone hasta 3 combinaciones ordenadas por eficiencia: mix recomendado (balance general), alternativa con menos personas y alternativa con mejor cobertura de domingo.",
    tip: "Revisa la sección 'Cobertura por día' dentro de cada mix para verificar que no haya brechas los días críticos.",
  },
  {
    n: "10",
    title: "Descarga el Excel",
    body: "El botón 'Descargar Excel' genera un archivo con el mix de contratos, cobertura por día, horas planificadas y estructura lista para valorización. Es el documento que puedes presentar a gerencia o dirección.",
    tip: "El Excel incluye la memoria de cálculo para que puedas auditar o ajustar los números manualmente.",
  },
];

const faqs = [
  {
    q: "¿Qué diferencia hay entre 'personas simultáneas' y 'dotación total'?",
    a: "Las personas simultáneas son las que trabajan al mismo tiempo (el mínimo para operar). La dotación total es cuántas personas necesitas contratar para cubrir esos puestos todos los días, considerando días libres, vacaciones y ausentismo. La calculadora convierte las primeras en las segundas.",
  },
  {
    q: "¿Por qué el mix recomienda 4×3 si no lo activé?",
    a: "Solo aparecen las jornadas que activaste. Si ves 4×3 es porque lo marcaste como permitido. Si no quieres esa jornada, desmárcala y vuelve a calcular.",
  },
  {
    q: "El resultado muestra 'brecha' en algunos días. ¿Qué significa?",
    a: "Significa que ese día la oferta de horas del mix no alcanza a cubrir la demanda. Puede pasar cuando hay restricciones de jornada muy estrictas. Solución: agrega un contrato PT o sube el límite de holgura.",
  },
  {
    q: "¿Puedo usar esta calculadora para un hospital o clínica?",
    a: "Para establecimientos de salud que siguen la normativa MINSAL, usa la Calculadora SAN. La calculadora retail está diseñada para operaciones comerciales y de servicios.",
  },
  {
    q: "¿Los resultados son legalmente válidos?",
    a: "La calculadora aplica la normativa chilena vigente (Código del Trabajo, Ley 21.561). El resultado es una propuesta técnica — la validación legal final debe hacerla un profesional de RRHH o abogado laboral.",
  },
];

export default function GuiaRetail() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-slate-900">
            dotaciones<span className="text-blue-600">.cl</span>
          </Link>
          <Link
            href="/calculadora"
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir a la calculadora →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">
            Guía de uso
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
            Calculadora de dotación retail
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            10 pasos para convertir tu horario y demanda de personas en un mix de contratos
            listo para valorización. Con ejemplos reales y tips por cada paso.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-14">

        {/* Pasos */}
        <h2 className="text-xl font-bold text-slate-900 mb-8">Paso a paso</h2>
        <div className="space-y-6">
          {steps.map((s) => (
            <div key={s.n} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <span className="shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                  {s.n}
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">{s.body}</p>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
                    <p className="text-blue-700 text-xs leading-relaxed">
                      <span className="font-bold">💡 Tip: </span>{s.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA calculadora */}
        <div className="mt-12 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">¿Listo para calcular?</h2>
          <p className="text-blue-100 text-sm mb-5">
            Abre la calculadora e ingresa los datos de tu operación. El resultado en menos de un minuto.
          </p>
          <Link
            href="/calculadora"
            className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Abrir calculadora →
          </Link>
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-bold text-slate-900 mt-14 mb-6">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">{f.q}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        {/* Nav footer */}
        <div className="border-t border-gray-200 pt-10 mt-10 flex flex-col sm:flex-row justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
          <Link href="/san" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700">
            Calculadora SAN hospitalaria
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-8 px-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} dotaciones.cl — Todos los derechos reservados
      </footer>
    </main>
  );
}
