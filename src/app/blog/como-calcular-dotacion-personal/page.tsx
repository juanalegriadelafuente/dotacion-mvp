import Link from "next/link";

export const metadata = {
  title: "Cómo calcular la dotación de personal en salud — Dotaciones.cl",
  description:
    "Metodología paso a paso para calcular cuántos profesionales necesitas según carga asistencial, turnos y normativa vigente. Para jefes de RRHH y supervisores clínicos.",
};

export default function ArticuloCalcularDotacion() {
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
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Metodología
          </span>
          <span className="text-slate-400 text-sm">10 de junio, 2025</span>
          <span className="text-slate-400 text-sm">·</span>
          <span className="text-slate-400 text-sm">8 min de lectura</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
          Cómo calcular la dotación de personal en salud: guía paso a paso
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed mb-10 border-b border-gray-200 pb-10">
          Aprende a calcular cuántos profesionales necesitas según carga asistencial, turnos y normativa vigente. Metodología práctica para jefes de RRHH y supervisores clínicos.
        </p>

        {/* Content */}
        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600">

          <h2>¿Por qué el cálculo de dotación importa tanto?</h2>
          <p>
            Una dotación mal calculada genera dos problemas igualmente costosos: el <strong>subdotación</strong> — que aumenta la carga del equipo, sube el ausentismo y pone en riesgo la seguridad del paciente — y la <strong>sobredotación</strong>, que infla el gasto sin mejorar resultados. En Chile, donde los presupuestos de salud son ajustados y la rotación es alta, calcular bien la dotación es una ventaja estratégica real.
          </p>

          <h2>Paso 1: Define el "puesto tipo" que vas a dimensionar</h2>
          <p>
            Antes de cualquier número, tienes que ser preciso sobre <em>qué rol</em> estás dimensionando. Un enfermero/a de UCI no tiene la misma carga que uno de hospitalización general. Define:
          </p>
          <ul>
            <li><strong>Nombre del cargo</strong> y su jornada contractual base (22, 33 o 44 horas)</li>
            <li><strong>Turno tipo</strong>: diurno, nocturno, rotativo 4×4, 7×7, etc.</li>
            <li><strong>Unidad o servicio</strong>: urgencia, pabellón, UCIM, APS, etc.</li>
            <li><strong>Normativa aplicable</strong>: Código del Trabajo, estatuto de salud (Ley 19.664 / DFL N°1) o contrato colectivo</li>
          </ul>

          <h2>Paso 2: Calcula las horas contratadas disponibles</h2>
          <p>
            Cada trabajador/a tiene una jornada contratada, pero no todas esas horas son productivas. Debes restar:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 not-prose">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Fórmula base</p>
            <div className="space-y-2 text-sm text-slate-700 font-mono">
              <p>Horas disponibles anuales = Horas contractuales − Ausencias estimadas</p>
              <div className="border-t border-slate-200 pt-3 mt-3 space-y-1 text-slate-500">
                <p>Ausencias típicas incluyen:</p>
                <p className="pl-4">– Vacaciones legales (15 días hábiles mínimo)</p>
                <p className="pl-4">– Licencias médicas (histórico del servicio, típico 5–12%)</p>
                <p className="pl-4">– Permisos administrativos y sindicales</p>
                <p className="pl-4">– Capacitaciones obligatorias</p>
              </div>
            </div>
          </div>

          <p>
            Por ejemplo, un técnico paramédico con jornada de 44 hrs semanales tiene aproximadamente <strong>2.288 horas brutas al año</strong> (44 × 52). Descontando vacaciones, licencias promedio (8%) y permisos, quedan cerca de <strong>1.980 horas netas disponibles</strong>.
          </p>

          <h2>Paso 3: Determina la carga asistencial requerida</h2>
          <p>
            Aquí entra la demanda real. Necesitas saber cuántas horas de trabajo <em>requiere</em> el servicio en un período dado. Las fuentes principales son:
          </p>
          <ul>
            <li><strong>Estadísticas de atenciones</strong>: número de consultas, procedimientos, egresos, o pacientes-día</li>
            <li><strong>Estándares de tiempo por prestación</strong>: cuántos minutos toma cada acto (GES, AUGE, protocolos del servicio)</li>
            <li><strong>Ocupación histórica</strong>: promedio de camas ocupadas por turno, con variabilidad estacional</li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6 not-prose">
            <p className="text-sm font-bold text-blue-700 mb-2">Ejemplo práctico</p>
            <p className="text-sm text-slate-700">
              Una unidad de hospitalización médica tiene un promedio de <strong>28 camas ocupadas/día</strong> y un estándar de <strong>4 hrs de cuidado de enfermería por paciente-día</strong>. Eso genera una demanda de <strong>112 hrs diarias</strong> de enfermería. En turno de 12 hrs, necesitas 9,3 enfermeros/as cubriendo simultáneamente (= 112 / 12).
            </p>
          </div>

          <h2>Paso 4: Calcula el "factor de reemplazo"</h2>
          <p>
            Este es el paso que más se omite y que más errores genera. Para cubrir <strong>1 puesto</strong> de forma continua (365 días, 24 horas), necesitas más de 1 persona, porque cada persona falta. El factor de reemplazo (FR) se calcula así:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 not-prose font-mono text-sm">
            <p className="text-slate-500 mb-2">FR = Días calendario / Días efectivamente trabajados por persona</p>
            <p className="text-slate-700 mt-4">Ejemplo:</p>
            <p className="pl-4 text-slate-700">Días calendario: 365</p>
            <p className="pl-4 text-slate-700">Vacaciones: 15 días hábiles ≈ 18 corridos</p>
            <p className="pl-4 text-slate-700">Licencias estimadas (8%): 29 días</p>
            <p className="pl-4 text-slate-700">Permisos: 5 días</p>
            <p className="pl-4 font-semibold text-slate-900 mt-2">Días trabajados ≈ 313</p>
            <p className="pl-4 font-bold text-blue-700 mt-1">FR = 365 / 313 = 1,17</p>
          </div>

          <p>
            Eso significa que para cubrir un puesto sin interrupción necesitas <strong>1,17 personas</strong> en promedio. Si tienes 5 puestos a cubrir simultáneamente, tu dotación base será <strong>5 × 1,17 = 5,85 → 6 personas</strong>.
          </p>

          <h2>Paso 5: Ajusta por turno y jornada</h2>
          <p>
            Según el tipo de turno, el número de personas necesarias cambia. Para un servicio 24/7 con turnos de 12 horas:
          </p>
          <ul>
            <li>Se necesitan <strong>2 turnos diarios</strong> (diurno + nocturno)</li>
            <li>Si el turno es 4×4 (4 días trabajo, 4 días descanso), cada persona cubre el 50% de los días</li>
            <li>Una jornada de 33 hrs en turno rotativo puede ser más eficiente que dos jornadas de 22 hrs para ciertos servicios</li>
          </ul>

          <h2>Paso 6: Suma y valida contra el presupuesto</h2>
          <p>
            Una vez que tienes la dotación técnica ideal, contrastarla con el presupuesto disponible. Si hay brecha, las opciones son:
          </p>
          <ul>
            <li>Ajustar el mix de jornadas (más jornadas parciales)</li>
            <li>Revisar los estándares de tiempo (¿son realistas?)</li>
            <li>Usar horas extras o turnos extraordinarios para puntas de demanda</li>
            <li>Reperfilar tareas entre categorías (enfermero/a vs. TENS)</li>
          </ul>

          <h2>Herramientas de apoyo</h2>
          <p>
            El cálculo manual es posible con una planilla Excel bien armada, pero para servicios grandes o con múltiples unidades conviene usar una herramienta especializada. En dotaciones.cl estamos desarrollando un simulador que automatiza los pasos anteriores con los parámetros del sistema público chileno.
          </p>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 my-10 not-prose">
            <h3 className="text-lg font-bold mb-2">¿Quieres la plantilla Excel de ejemplo?</h3>
            <p className="text-blue-100 text-sm mb-4">
              Estamos preparando una plantilla descargable con el modelo de cálculo de este artículo.
              Déjanos tu correo y te avisamos cuando esté lista.
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
                className="bg-white text-blue-700 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors"
              >
                Avisarme
              </button>
            </form>
          </div>

          <h2>Resumen: los 6 pasos en una mirada</h2>
          <ol>
            <li>Define el puesto tipo y su jornada base</li>
            <li>Calcula las horas netas disponibles por persona</li>
            <li>Determina la carga asistencial requerida</li>
            <li>Calcula el factor de reemplazo</li>
            <li>Ajusta por tipo de turno y mix de jornadas</li>
            <li>Valida contra presupuesto y ajusta si es necesario</li>
          </ol>

          <p>
            Este proceso no es único ni definitivo: la dotación óptima se revisa al menos una vez al año o cuando cambia significativamente la demanda del servicio.
          </p>
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-200 pt-10 mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Ver todos los artículos
          </Link>
        </div>
      </article>

      <footer className="border-t border-gray-200 py-8 px-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} dotaciones.cl — Todos los derechos reservados
      </footer>
    </main>
  );
}
