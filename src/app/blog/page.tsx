import Link from "next/link";

const posts = [
  {
    slug: "como-calcular-dotacion-personal",
    title: "Cómo calcular la dotación de personal en salud: guía paso a paso",
    excerpt:
      "Aprende a calcular cuántos profesionales necesitas según carga asistencial, turnos y normativa vigente. Metodología práctica para jefes de RRHH y supervisores clínicos.",
    category: "Metodología",
    date: "2025-06-10",
    readTime: "8 min",
    featured: true,
  },
  {
    slug: "mix-contratos-jornada-parcial",
    title: "Mix de contratos y jornada parcial: cómo optimizar tu dotación sin perder cobertura",
    excerpt:
      "Contratos de 22, 33 y 44 horas mezclados con turnantes. Cómo armar una dotación flexible que cumpla la normativa y reduzca el costo por hora trabajada.",
    category: "Planificación",
    date: "2025-06-18",
    readTime: "6 min",
    featured: false,
  },
  {
    slug: "dotacion-hospitalaria-san",
    title: "Dotación hospitalaria según el Sistema de Análisis de Necesidades (SAN)",
    excerpt:
      "El método SAN es el estándar del Ministerio de Salud para calcular dotación en hospitales públicos. Explicamos cómo aplicarlo, sus indicadores clave y sus limitaciones.",
    category: "Normativa",
    date: "2025-06-25",
    readTime: "10 min",
    featured: false,
  },
];

const categoryColors: Record<string, string> = {
  Metodología: "bg-blue-50 text-blue-700 border border-blue-200",
  Planificación: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Normativa: "bg-amber-50 text-amber-700 border border-amber-200",
};

export const metadata = {
  title: "Blog — Dotaciones.cl",
  description:
    "Artículos prácticos sobre planificación de dotación, turnos y normativa laboral en salud para Chile.",
};

export default function BlogIndex() {
  const [featured, ...rest] = posts;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              dotaciones<span className="text-blue-600">.cl</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/blog" className="text-blue-600 font-semibold">
              Blog
            </Link>
            <Link
              href="/"
              className="hover:text-slate-900 transition-colors"
            >
              Inicio
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
            Recursos gratuitos
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
            Todo lo que necesitas saber<br />
            sobre <span className="text-blue-400">dotación en salud</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Guías prácticas, metodologías y normativa para jefes de RRHH,
            supervisores y directivos de centros de salud en Chile.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Featured post */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Artículo destacado
          </p>
          <Link href={`/blog/${featured.slug}`} className="group block">
            <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="md:flex">
                {/* Color band */}
                <div className="md:w-2 bg-blue-600 flex-shrink-0" />
                <div className="p-8 md:p-10 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryColors[featured.category]}`}
                    >
                      {featured.category}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {featured.readTime} de lectura
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug mb-3">
                    {featured.title}
                  </h2>
                  <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-2xl">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                    Leer artículo
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        </div>

        {/* Rest of posts */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            Más artículos
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <article className="bg-white rounded-xl border border-gray-200 p-7 h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryColors[post.category]}`}
                    >
                      {post.category}
                    </span>
                    <span className="text-slate-400 text-xs">{post.readTime}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug mb-2">
                    {post.title}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-sm mt-auto">
                    Leer
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA suscripción */}
        <div className="mt-16 bg-blue-600 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">
            ¿Quieres más guías como estas?
          </h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Recibe nuevos artículos, plantillas y novedades normativas directo en tu correo. Sin spam.
          </p>
          <form
            action="https://formspree.io/f/TU_FORM_ID"
            method="POST"
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="tu@correo.cl"
              className="flex-1 px-4 py-3 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-blue-700 font-bold px-6 py-3 rounded-lg text-sm hover:bg-blue-50 transition-colors"
            >
              Suscribirme
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} dotaciones.cl — Todos los derechos reservados
      </footer>
    </main>
  );
}
