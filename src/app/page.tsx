export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide text-zinc-300">
            dotaciones.cl
          </div>
          <a
            href="/calculadora"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Ir a la calculadora →
          </a>
        </header>

        <section className="mt-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Calculadora de Dotación Retail
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
            Estima cuántas personas necesitas para cubrir tu semana, considerando colaciones,
            traslapes y el efecto domingo. Resultado: horas-persona, FTE y mix sugerido de contratos.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/calculadora"
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-black hover:opacity-90"
            >
              Calcular dotación ahora →
            </a>
            <a
              href="/calculadora"
              className="rounded-2xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 hover:bg-zinc-900"
            >
              Ver ejemplo
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-sm font-semibold text-zinc-200">Qué obtienes</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-300">
                <li>Horas-persona/semana y FTE estimado</li>
                <li>Chequeo colación vs traslape (brecha)</li>
                <li>Chequeo dominical (cuello de botella retail)</li>
                <li>Mix sugerido de contratos (2–3 opciones)</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-sm font-semibold text-zinc-200">Para quién</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-300">
                <li>Restaurantes, comida rápida, tiendas y retail</li>
                <li>Jefaturas operativas y dueños que arman turnos “a ojo”</li>
                <li>Quien quiere una referencia rápida antes de contratar</li>
              </ul>
              <p className="mt-4 text-sm text-zinc-400">
                MVP: iremos sumando presets por rubro, link compartible y exportación.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-zinc-900 pt-6 text-xs text-zinc-500">
          © {new Date().getFullYear()} Dotaciones.cl — herramienta gratuita (MVP)
        </footer>
      </div>
    </main>
  );
}