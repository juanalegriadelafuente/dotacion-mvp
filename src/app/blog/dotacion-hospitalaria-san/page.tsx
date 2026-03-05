import Link from "next/link";

export const metadata = {
  title: "Dotación hospitalaria según el SAN (Sistema de Análisis de Necesidades) — Dotaciones.cl",
  description:
    "El método SAN es el estándar del Ministerio de Salud para calcular dotación en hospitales públicos. Explicamos cómo aplicarlo, sus indicadores clave y sus limitaciones.",
};

export default function ArticuloSAN() {
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
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Normativa
          </span>
          <span className="text-slate-400 text-sm">25 de junio, 2025</span>
          <span className="text-slate-400 text-sm">·</span>
          <span className="text-slate-400 text-sm">10 min de lectura</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
          Dotación hospitalaria según el Sistema de Análisis de Necesidades (SAN)
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed mb-10 border-b border-gray-200 pb-10">
          El método SAN es el estándar del Ministerio de Salud para calcular dotación en hospitales públicos chilenos. Explicamos cómo aplicarlo, sus indicadores clave y sus limitaciones.
        </p>

        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600">

          <h2>¿Qué es el SAN?</h2>
          <p>
            El <strong>Sistema de Análisis de Necesidades (SAN)</strong> es la metodología oficial que el Ministerio de Salud de Chile utiliza para determinar las necesidades de dotación en hospitales públicos. Fue desarrollado con el objetivo de homologar los criterios de dimensionamiento entre los distintos servicios de salud del país y dar una base técnica objetiva a las negociaciones de dotación.
          </p>
          <p>
            A diferencia de metodologías internacionales como el <em>Nurse Staffing Ratios</em> californiano o los modelos basados en DRG europeos, el SAN está calibrado específicamente con la realidad de la red asistencial chilena: sus estadísticas, su estructura contractual y sus patrones de ausentismo.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 my-6 not-prose">
            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Importante</p>
            <p className="text-sm text-amber-700">
              El SAN aplica formalmente a hospitales de la red pública (Servicios de Salud). Clínicas privadas y centros de atención primaria tienen metodologías distintas, aunque pueden usar el SAN como referencia.
            </p>
          </div>

          <h2>Los componentes del modelo SAN</h2>
          <p>El SAN organiza la dotación hospitalaria en torno a tres grandes dimensiones:</p>

          <h3>1. Producción asistencial</h3>
          <p>
            Es la base del cálculo. Se mide en unidades de producción relevantes para cada servicio: egresos hospitalarios, días-cama, número de intervenciones quirúrgicas, consultas de urgencia, etc. El modelo utiliza datos históricos de los últimos 2–3 años con proyección a 12 meses.
          </p>

          <h3>2. Estándares de recurso humano</h3>
          <p>
            Para cada unidad productiva, el SAN define cuántas horas de cada categoría profesional se requieren. Estos estándares se expresan como <em>horas por unidad de producción</em> (por ejemplo, "horas de enfermería por egreso en medicina interna") y están diferenciados por nivel de complejidad del hospital.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 not-prose">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
              Estándares SAN de referencia — Hospitalización adultos
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 font-semibold">Categoría</th>
                  <th className="pb-2 font-semibold">Indicador</th>
                  <th className="pb-2 font-semibold text-right">Estándar</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {[
                  ["Enfermero/a", "Horas enf. / paciente-día", "2,5 – 4,0 hrs"],
                  ["TENS", "Horas TENS / paciente-día", "3,5 – 6,0 hrs"],
                  ["Médico", "Horas méd. / egreso", "4,0 – 8,0 hrs"],
                  ["Kinesiólogo/a", "Sesiones / paciente-día", "0,3 – 0,8"],
                  ["Administrativo", "% dotación clínica", "12 – 18 %"],
                ].map(([cat, ind, est]) => (
                  <tr key={cat} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium">{cat}</td>
                    <td className="py-2 text-slate-500 text-xs">{ind}</td>
                    <td className="py-2 text-right font-mono text-xs text-blue-700">{est}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-3">
              * Rangos orientativos. Los valores exactos dependen del nivel de complejidad del hospital y del servicio específico. Consultar los documentos técnicos del MINSAL.
            </p>
          </div>

          <h3>3. Dotación de mantenimiento</h3>
          <p>
            Además de la dotación asistencial, el SAN considera el personal de apoyo no clínico: servicios generales, esterilización, farmacia, nutrición, mantenimiento y otros. Estos se calculan como función del tamaño del hospital (camas) y su nivel de complejidad.
          </p>

          <h2>El proceso de aplicación paso a paso</h2>

          <h3>Paso 1: Levantamiento de producción</h3>
          <p>
            Se recopilan los datos de producción del período de referencia desde el REM (Resumen Estadístico Mensual) u otras fuentes del hospital. Se ajustan los datos atípicos (pandemias, cierres de servicio, etc.) para obtener una base representativa.
          </p>

          <h3>Paso 2: Aplicación de estándares</h3>
          <p>
            Las unidades de producción se multiplican por los estándares de horas por categoría. El resultado es el <strong>total de horas requeridas</strong> por servicio y categoría para el período proyectado.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 not-prose font-mono text-sm">
            <p className="text-slate-500 mb-3">Ejemplo — Servicio de Medicina Interna:</p>
            <p className="text-slate-700">Pacientes-día anuales proyectados: <strong>18.250</strong></p>
            <p className="text-slate-700">Estándar enfermería: <strong>3,2 hrs / paciente-día</strong></p>
            <p className="text-slate-700 mt-2">→ Horas enf. requeridas: 18.250 × 3,2 = <strong>58.400 hrs/año</strong></p>
            <p className="text-slate-500 mt-3">Horas netas por enfermero/a (jornada 44 hrs): <strong>1.950 hrs/año</strong></p>
            <p className="text-blue-700 font-bold mt-1">→ Dotación requerida: 58.400 / 1.950 = <strong>30 enfermeros/as</strong></p>
          </div>

          <h3>Paso 3: Ajuste por factor de disponibilidad</h3>
          <p>
            Las horas brutas contratadas se reducen por el <strong>factor de disponibilidad</strong>, que descuenta vacaciones, licencias médicas, capacitaciones y permisos. En el sistema público chileno este factor se sitúa típicamente entre <strong>0,82 y 0,87</strong> (es decir, solo el 82–87% de las horas contratadas están efectivamente disponibles).
          </p>

          <h3>Paso 4: Validación con el equipo directivo</h3>
          <p>
            El resultado técnico del SAN se contrasta con la realidad operativa del hospital: disponibilidad presupuestaria, existencia de profesionales en el mercado local, y restricciones físicas de la planta. Normalmente hay una brecha entre la dotación SAN ideal y la dotación posible, que debe abordarse con priorización.
          </p>

          <h2>Indicadores clave del SAN</h2>
          <p>El SAN monitorea varios indicadores para evaluar si la dotación actual está alineada con la necesidad:</p>

          <div className="not-prose space-y-3 my-6">
            {[
              {
                nombre: "Índice de ocupación",
                descripcion: "Porcentaje de camas ocupadas sobre el total disponible. Un valor sobre 85% es señal de subdotación potencial.",
                umbral: "> 85% = alerta",
                color: "border-red-200 bg-red-50 text-red-700",
              },
              {
                nombre: "Horas de enfermería / paciente-día",
                descripcion: "Indicador central de calidad asistencial. Valores bajo 2,5 hrs se asocian a mayor mortalidad y eventos adversos.",
                umbral: "< 2,5 hrs = riesgo",
                color: "border-orange-200 bg-orange-50 text-orange-700",
              },
              {
                nombre: "Tasa de ausentismo",
                descripcion: "Porcentaje de horas perdidas por licencias médicas. Sobre el 10% es indicador de carga excesiva o clima laboral deteriorado.",
                umbral: "> 10% = revisar",
                color: "border-amber-200 bg-amber-50 text-amber-700",
              },
              {
                nombre: "Horas extras sobre dotación base",
                descripcion: "Si las horas extras superan el 5% de las horas totales, hay subdotación crónica que no se está corrigiendo estructuralmente.",
                umbral: "> 5% = subdotación",
                color: "border-yellow-200 bg-yellow-50 text-yellow-700",
              },
            ].map((ind) => (
              <div key={ind.nombre} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{ind.nombre}</p>
                    <p className="text-slate-500 text-sm mt-1">{ind.descripcion}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex-shrink-0 ${ind.color}`}>
                    {ind.umbral}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <h2>Limitaciones del método SAN</h2>
          <p>
            El SAN es una herramienta útil, pero tiene limitaciones reales que sus usuarios deben conocer:
          </p>
          <ul>
            <li>
              <strong>Estándares desactualizados</strong>: algunos parámetros del SAN no han sido revisados en años. La complejidad de los pacientes hospitalizados ha aumentado significativamente, lo que hace que los estándares subestimen la dotación real necesaria en muchos servicios.
            </li>
            <li>
              <strong>No captura variabilidad</strong>: el SAN trabaja con promedios. No modela bien los picos de demanda ni las variaciones estacionales (invierno, brotes, etc.).
            </li>
            <li>
              <strong>Brecha entre dotación SAN y dotación presupuestada</strong>: en la práctica, los hospitales públicos operan con dotaciones por debajo de lo que indica el SAN. La metodología sirve más como argumento técnico en negociaciones que como guía operativa directa.
            </li>
            <li>
              <strong>Difícil aplicación en APS</strong>: el SAN fue diseñado para hospitales. Su aplicación en centros de salud familiar o CESFAM requiere adaptaciones significativas.
            </li>
          </ul>

          <h2>¿Cómo usar el SAN en la práctica?</h2>
          <p>
            La recomendación es usar el SAN como <em>marco de referencia</em> y no como receta exacta. Úsalo para:
          </p>
          <ul>
            <li>Fundamentar solicitudes de aumento de dotación al Servicio de Salud o al MINSAL</li>
            <li>Identificar los servicios con mayor brecha entre dotación real y necesaria</li>
            <li>Priorizar en qué unidades es más urgente reforzar el equipo</li>
            <li>Comparar tu hospital con hospitales de complejidad similar</li>
          </ul>
          <p>
            Para el dimensionamiento operativo día a día — turnos, programación, suplencias — el SAN necesita complementarse con herramientas más granulares.
          </p>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-8 my-10 not-prose">
            <h3 className="text-lg font-bold mb-2">¿Trabajas en un hospital público y quieres aplicar el SAN?</h3>
            <p className="text-slate-300 text-sm mb-4">
              Estamos preparando una guía detallada de aplicación del SAN para hospitales de mediana y alta complejidad. Suscríbete y te avisamos.
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
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Avisarme
              </button>
            </form>
          </div>

          <h2>Conclusión</h2>
          <p>
            El SAN es el lenguaje común que habla el sistema público chileno cuando se trata de dotación hospitalaria. Conocerlo no es opcional para cualquier jefe de RRHH, supervisor o directivo que quiera defender sus necesidades de personal con argumentos técnicos sólidos. Sus limitaciones son reales, pero sus indicadores siguen siendo el punto de partida más legítimo para las conversaciones de dotación en la red pública.
          </p>
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-200 pt-10 mt-10 flex flex-col sm:flex-row justify-between gap-4">
          <Link
            href="/blog/mix-contratos-jornada-parcial"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior: Mix de contratos
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
          >
            Ver todos los artículos
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
