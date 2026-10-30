// src/app/kit-turnos/MuestraPlanilla.tsx
//
// Cómo se ve la planilla del Kit mientras se arma: las alertas a la izquierda del
// nombre y las horas al cierre de cada semana (el diseño que Juan aprobó el
// 28-10). Cuatro casos de ejemplo, con los mensajes que escribe la planilla de
// verdad; los nombres son inventados.

type Semana = { d: string[]; h: number; malos?: number[]; hMala?: boolean };
type Fila = { nombre: string; alerta?: string; semanas: Semana[] };

const FILAS: Fila[] = [
  {
    nombre: "Camila",
    semanas: [
      { d: ["M", "M", "M", "M", "M", "M", ""], h: 42 },
      { d: ["M", "M", "", "M", "M", "M", "M"], h: 42 },
    ],
  },
  {
    nombre: "Diego",
    alerta: "7 días seguidos.",
    semanas: [
      { d: ["T", "T", "T", "T", "T", "N", "S"], h: 42, malos: [6] },
      { d: ["", "T", "T", "T", "T", "T", ""], h: 35 },
    ],
  },
  {
    nombre: "Rocío",
    alerta: "Semana de 35 h (máx. 30).",
    semanas: [
      { d: ["M", "M", "M", "M", "", "", ""], h: 28 },
      { d: ["M", "M", "M", "M", "M", "", ""], h: 35, hMala: true },
    ],
  },
  {
    nombre: "Tomás",
    alerta: "1 descanso(s) de menos de 12 h.",
    semanas: [
      { d: ["T", "M", "", "T", "T", "T", ""], h: 35, malos: [1] },
      { d: ["T", "T", "T", "", "T", "T", ""], h: 35 },
    ],
  },
];

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
/** Claves fijas por columna: la grilla es estática y nunca se reordena. */
const COLUMNAS = ["lu", "ma", "mi", "ju", "vi", "sa", "do"];

const COLOR: Record<string, string> = {
  M: "bg-[#163a4f] text-[#cfe3f0]",
  T: "bg-[#1d3b2f] text-[#c9eedd]",
  N: "bg-[#2a2550] text-[#d9d3ff]",
  S: "border border-dashed border-[#6d64b8] text-[#d9d3ff]",
  "": "border border-white/[0.08]",
};

const celda =
  "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[3px] font-mono text-[13px]";
const horas =
  "flex h-[34px] w-[46px] shrink-0 items-center justify-center font-mono text-[13px] font-medium";

export default function MuestraPlanilla() {
  return (
    <figure className="m-0">
      <p
        className="mano mb-2 ml-1 -rotate-2 text-[26px] text-[#FF6B6B]"
        aria-hidden="true"
      >
        te avisa mientras armas, no a fin de mes ↓
      </p>
      <div className="overflow-x-auto rounded-md border border-white/10 bg-[#112538] p-4">
        <table className="border-separate border-spacing-1">
          <caption className="sr-only">
            Ejemplo de la planilla del Kit con cuatro personas y dos semanas
          </caption>
          <thead>
            <tr className="text-[12px] text-[#9AA8B6]">
              <th scope="col" className="w-[190px] text-left font-normal">
                Errores
              </th>
              <th scope="col" className="w-[76px] text-left font-normal">
                Nombre
              </th>
              {[0, 1].flatMap((s) => [
                ...DIAS.map((d, i) => (
                  <th
                    key={`${s}-${COLUMNAS[i]}`}
                    scope="col"
                    className="w-[34px] font-normal"
                  >
                    {d}
                  </th>
                )),
                <th key={`${s}-h`} scope="col" className="w-[46px] font-normal">
                  h
                </th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {FILAS.map((f) => (
              <tr key={f.nombre}>
                <td
                  className={`min-w-[190px] pr-2 text-[13px] leading-tight ${f.alerta ? "text-[#FF6B6B]" : "text-[#2BB58D]"}`}
                >
                  {f.alerta ?? "OK"}
                </td>
                <th
                  scope="row"
                  className="min-w-[64px] text-left text-[14px] font-normal"
                >
                  {f.nombre}
                </th>
                {f.semanas.flatMap((s, si) => [
                  ...s.d.map((t, i) => (
                    <td key={`${si}-${COLUMNAS[i]}`}>
                      <span
                        className={`${celda} ${COLOR[t]} ${s.malos?.includes(i) ? "outline outline-2 -outline-offset-2 outline-[#FF6B6B]" : ""}`}
                      >
                        {t}
                      </span>
                    </td>
                  )),
                  <td key={`${si}-${COLUMNAS.length}`}>
                    <span
                      className={`${horas} ${s.hMala ? "text-[#FF6B6B]" : ""}`}
                    >
                      {s.h} h
                    </span>
                  </td>,
                ])}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#9AA8B6]">
          <span>M mañana · T tarde · N noche</span>
          <span>S saliente (no es libre)</span>
          <span>vacío = libre · h = horas de la semana</span>
        </p>
      </div>
    </figure>
  );
}
