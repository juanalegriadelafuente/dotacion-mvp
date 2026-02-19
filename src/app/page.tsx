export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Calculadora de Dotación Retail
      </h1>

      <p className="mt-3 text-zinc-700">
        Calcula cuánta gente necesitas para cubrir la semana, considerando colaciones, traslapes
        y el efecto domingo (full-time &gt;30h con disponibilidad dominical 50% por defecto).
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/calculadora"
          className="rounded-xl bg-black px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          Ir a la calculadora →
        </a>

        <a
          href="/calculadora"
          className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-black hover:bg-zinc-50"
        >
          Ver ejemplo
        </a>
      </div>

      <div className="mt-10 grid gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="font-semibold">Qué entrega</p>
          <ul className="mt-2 list-disc pl-5 text-zinc-700">
            <li>Horas-persona/semana + FTE estimado</li>
            <li>Chequeo colación vs traslape (brecha)</li>
            <li>Chequeo dominical (cuello de botella retail)</li>
            <li>Propuesta de mix de contratos (top 2–3)</li>
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-700">
          <p className="font-semibold text-black">Nota</p>
          <p className="mt-1">
            Esto es un MVP. Próximo: presets por rubro, link compartible, descarga PDF.
          </p>
        </div>
      </div>

      <footer className="mt-10 text-sm text-zinc-500">
        MVP Dotación.cl — v0.1
      </footer>
    </main>
  );
}