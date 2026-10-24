// src/components/RevisionMuestra.tsx
//
// Una muestra estática de lo que entrega la revisión de turnos, para la portada.
// Los dos problemas son reglas reales del verificador de Kaden (Art. 28: un día
// libre al séptimo; descanso mínimo entre jornadas) y la grilla los produce
// de verdad: Ana trabaja de lunes a domingo, y Carla sale de la noche del sábado
// y entra de mañana el domingo, sin el descanso mínimo entre jornadas.

const dias = ["L", "M", "M", "J", "V", "S", "D"];

const filas: { nombre: string; turnos: string[]; malos: number[] }[] = [
  { nombre: "Ana", turnos: ["M", "M", "M", "T", "T", "T", "T"], malos: [6] },
  { nombre: "Beto", turnos: ["T", "L", "M", "M", "L", "N", "N"], malos: [] },
  { nombre: "Carla", turnos: ["L", "T", "T", "L", "M", "N", "M"], malos: [6] },
  { nombre: "Diego", turnos: ["N", "N", "L", "T", "T", "L", "L"], malos: [] },
];

function celda(turno: string, malo: boolean) {
  if (malo) return "bg-rose-100 text-rose-600 ring-2 ring-rose-400";
  if (turno === "L") return "bg-slate-100 text-slate-400";
  return "bg-indigo-50 text-indigo-700";
}

export default function RevisionMuestra() {
  return (
    <figure
      className="fuente-a rounded-2xl bg-white text-slate-800 shadow-[0_30px_80px_-20px_rgba(76,60,200,.35)] ring-1 ring-slate-200/70"
      aria-label="Ejemplo de una revisión de turnos"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 pb-3 pt-4">
        <div className="text-[13px] font-semibold">
          Revisión de turnos · ejemplo
        </div>
        <div className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
          2 problemas
        </div>
      </div>
      <div className="px-5 py-4">
        <table className="w-full text-center font-mono text-[11px]">
          <thead>
            <tr className="text-slate-400">
              <th className="w-14" />
              {dias.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: los días repiten letra (M, M)
                <th key={i} className="pb-1 font-normal">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.nombre}>
                <td className="py-1 text-left font-sans text-[12px]">
                  {f.nombre}
                </td>
                {f.turnos.map((t, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: posición fija del día
                  <td key={i} className="py-1">
                    <span
                      className={`inline-block w-6 rounded py-0.5 ${celda(t, f.malos.includes(i))}`}
                    >
                      {t}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-4 space-y-2 text-[12.5px] leading-snug">
          <li className="flex gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
            <span>
              <b>Ana</b> trabaja 7 días seguidos: le corresponde un día libre{" "}
              <span className="text-slate-400">· Art. 28</span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
            <span>
              <b>Carla</b> sale de la noche y entra de mañana sin el descanso
              mínimo{" "}
              <span className="text-slate-400">· descanso entre jornadas</span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span>
              <b>Beto</b> y <b>Diego</b> cumplen
            </span>
          </li>
        </ul>
      </div>
    </figure>
  );
}
