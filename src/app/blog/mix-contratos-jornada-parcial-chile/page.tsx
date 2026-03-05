import Link from "next/link";

export const metadata = {
  title: "Mix de contratos y jornada parcial en salud — Dotaciones.cl",
  description:
    "Cómo combinar contratos de 22, 33 y 44 horas con turnantes para optimizar dotación, reducir costo por hora y mantener cobertura 24/7.",
};

export default function ArticuloMixContratos() {
  return (
    <main className="min-h-screen bg-gray-50">
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
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Planificación
          </span>
          <span className="text-slate-400 text-sm">18 de junio, 2025</span>
          <span className="text-slate-400 text-sm">·</span>
          <span className="text-slate-400 text-sm">6 min de lectura</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
          Mix de contratos y jornada parcial: cómo optimizar tu dotación sin perder cobertura
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed mb-10 border-b border-gray-200 pb-10">
          Contratos de 22, 33 y 44 horas mezclados con turnantes. Cómo armar una dotación flexible que cumpla la normativa y reduzca el costo por hora trabajada.
        </p>

        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600">

          <h2>El problema del "todos a 44 horas"</h2>
          <p>
            Muchos servicios de salud operan con una lógica por defecto: todo el mundo a jornada completa, 44 horas semanales. Es más simple de administrar, pero no siempre es lo más eficiente. Una unidad con picos de demanda en ciertas horas o días puede estar pagando horas de baja productividad que encarecen el costo total.
          </p>
          <p>
            El mix de contratos permite ajustar la oferta de horas a la curva real de demanda. Bien diseñado, puede <strong>reducir el costo por atención</strong> sin reducir calidad ni cobertura.
          </p>

          <h2>Las tres jornadas disponibles en Chile</h2>
          <p>
            El Código del Trabajo y el estatuto de salud permiten contratar con distintas jornadas semanales. Las más usadas en el sector son:
          </p>

          <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
            {[
              {
                horas: "44 hrs",
                label: "Jornada completa",
                desc: "Estándar histórico. Buena para roles de presencia continua con demanda pareja.",
                color: "border-blue-200 bg-blue-50",
                badge: "bg-blue-100 text-blue-700",
              },
              {
                horas: "33 hrs",
                label: "Jornada reducida",
                desc: "Muy usada en turnos nocturnos y en servicios donde se requiere flexibilidad sin llegar a media jornada.",
                color: "border-emerald-200 bg-emerald-50",
                badge: "bg-emerald-100 text-emerald-700",
              },
              {
                horas: "22 hrs",
                label: "Media jornada",
                desc: "Ideal para puntas de demanda: mañanas en APS, refuerzo en urgencias los fines de semana.",
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
          <p>Hay tres escenarios típicos donde el mix es especialmente útil:</p>

          <h3>1. Demanda con picos horarios claros</h3>
          <p>
            Una APS tiene el 60% de sus consultas entre las 8 y las 13 hrs. Tener todo el equipo a 44 horas significa pagar horas de la tarde con muy poca demanda. Incorporar TENS o administrativos con jornada de 22 hrs en el turno mañana reduce el costo sin afectar la atención de la punta.
          </p>

          <h3>2. Cobertura de fines de semana y festivos</h3>
          <p>
            Los turnos de fin de semana son difíciles de cubrir con personal a 44 hrs que ya completó su semana. Contratar personal específicamente para fines de semana con jornadas reducidas es más económico que pagar horas extras sistemáticas.
          </p>

          <h3>3. Retención de profesionales con otras responsabilidades</h3>
          <p>
            Enfermeros/as con hijos pequeños, profesionales que trabajan en más de un establecimiento, o personas que priorizan trabajo–vida. Una jornada de 22 o 33 hrs puede ser el diferencial para retener talento que de otro modo se iría al sector privado.
          </p>

          <h2>Cómo calcular el mix óptimo</h2>
          <p>El proceso es iterativo, pero parte de tres datos:</p>
          <ol>
            <li><strong>Curva de demanda horaria y semanal</strong>: número de pacientes o procedimientos por franja horaria</li>
            <li><strong>Costo por hora de cada jornada</strong>: incluye proporcional de beneficios, cotizaciones y bonos</li>
            <li><strong>Restricciones operativas</strong>: continuidad de turno mínima, ratio mínimo de personal de planta vs. suplencias</li>
          </ol>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 not-prose">
            <p className="text-sm font-bold text-slate-600 mb-3">Ejemplo simplificado — Urgencia pediátrica</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 font-semibold">Franja</th>
                  <th className="pb-2 font-semibold">Demanda</th>
                  <th className="pb-2 font-semibold">Personal requerido</th>
                  <th className="pb-2 font-semibold">Jornada sugerida</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 space-y-1">
                {[
                  ["08:00–14:00", "Alta (40%)", "4 TENS + 2 enf.", "44 hrs o 33 hrs"],
                  ["14:00–20:00", "Media (35%)", "3 TENS + 2 enf.", "44 hrs"],
                  ["20:00–08:00", "Baja (25%)", "2 TENS + 1 enf.", "33 hrs o nocturnos 22 hrs"],
                ].map(([f, d, p, j]) => (
                  <tr key={f} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-mono text-xs">{f}</td>
                    <td className="py-2">{d}</td>
                    <td className="py-2">{p}</td>
                    <td className="py-2 text-blue-600 font-medium">{j}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Riesgos a tener en cuenta</h2>
          <p>El mix de contratos no es una solución perfecta. Los principales riesgos son:</p>
          <ul>
            <li>
              <strong>Fragmentación del equipo</strong>: si hay demasiados contratos distintos, la coordinación se vuelve compleja. Conviene no superar 3–4 tipos de jornada en un mismo servicio.
            </li>
            <li>
              <strong>Brechas de continuidad</strong>: los traspasos de turno son momentos críticos. Con más contratos, hay más traspasos y más riesgo de información perdida.
            </li>
            <li>
              <strong>Inequidad percibida</strong>: el personal de media jornada puede sentir que accede a menos beneficios o desarrollo. Importante comunicar bien las políticas de equidad.
            </li>
            <li>
              <strong>Complejidad de liquidaciones</strong>: más tipos de contrato = más carga administrativa en RRHH. Asegúrate de que tu sistema de liquidaciones lo soporta.
            </li>
          </ul>

          <h2>Buenas prácticas para implementar el mix</h2>
          <ul>
            <li>Empieza con un análisis de 3 meses de registros de demanda antes de rediseñar la dotación</li>
            <li>Define un ratio máximo de contratos parciales sobre el total (en servicios críticos, no más del 30–40%)</li>
            <li>Involucra a los equipos clínicos: ellos conocen los picos reales mejor que cualquier planilla</li>
            <li>Revisa el mix cada 6 meses o cuando cambie significativamente la carga asistencial</li>
          </ul>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-8 my-10 not-prose">
            <h3 className="text-lg font-bold mb-2">¿Necesitas revisar el mix de tu servicio?</h3>
            <p className="text-emerald-100 text-sm mb-4">
              Estamos desarrollando un simulador de mix de contratos para dotaciones.cl.
              Déjanos tu correo y te notificamos cuando esté disponible.
            </p>
            <form
              action="https://formspree.io/f/TU_FORM_ID"
              method="POST"
              className="flex flex-col sm:flex-row gap-3 max-w-sm"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="tu@correo.cl"
                className="flex-1 px-4 py-2.5 rounded-lg text-slate-900 text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="bg-white text-emerald-700 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-emerald-50 transition-colors"
              >
                Notificarme
              </button>
            </form>
          </div>

          <h2>Conclusión</h2>
          <p>
            Un mix bien diseñado de jornadas contractuales puede ser una de las herramientas de eficiencia más poderosas que tiene un gestor de RRHH en salud. No se trata de precarizar el empleo, sino de hacer coincidir la oferta de horas con la demanda real del servicio. Con buena información y criterio clínico, es posible reducir costos y mejorar las condiciones del equipo al mismo tiempo.
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
