"use client";
// src/components/noche/PlanillaDemo.tsx
//
// La planilla de la portada: se toca una celda, cambia el turno y la revisión se
// rehace con tinta roja. Es una DEMOSTRACIÓN de tres reglas, rotulada así: la
// revisión completa (todas las reglas, con su norma) es el verificador de Kaden,
// que es la única versión de la ley (D-ING-1). Llamarlo en cada clic desde acá
// agotaría su freno por IP, porque todas las visitas saldrían desde Vercel.
import { useState } from "react";
import { URL_REVISAR } from "@/lib/sitio";

const EJEMPLO: [string, string][] = [
  ["Ana", "MMMTTTT"],
  ["Beto", "TLMMLNN"],
  ["Carla", "LTTLMNM"],
  ["Diego", "NNLTTLL"],
];
const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const NOMBRE_DIA = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];
const CICLO: Record<string, string> = { M: "T", T: "N", N: "L", L: "M" };
const NOMBRE_TURNO: Record<string, string> = {
  M: "mañana",
  T: "tarde",
  N: "noche",
  L: "libre",
};
// Horas entre el fin de un turno y el inicio del del día siguiente.
// M 07–15, T 15–23, N 23–07 (termina al otro día).
const DESCANSO: Record<string, number> = {
  MM: 16,
  MT: 24,
  MN: 32,
  TM: 8,
  TT: 16,
  TN: 24,
  NM: 0,
  NT: 8,
  NN: 16,
};

function revisar(filas: [string, string][]) {
  const malas = new Set<string>();
  const notas: string[] = [];
  filas.forEach(([nombre, t], f) => {
    const dias = t.split("");
    const trabajados = dias.filter((x) => x !== "L").length;
    if (trabajados === 7) {
      malas.add(`${f}-6`);
      notas.push(`${nombre}: 7 días seguidos, le toca un día libre · Art. 28`);
    }
    if (trabajados * 8 > 42)
      notas.push(`${nombre}: ${trabajados * 8} h en la semana, el tope es 42`);
    for (let d = 1; d < 7; d++) {
      const h = DESCANSO[dias[d - 1] + dias[d]];
      if (h !== undefined && h < 12) {
        malas.add(`${f}-${d}`);
        notas.push(
          `${nombre}: el ${NOMBRE_DIA[d]} entra con ${h} h de descanso`,
        );
      }
    }
  });
  return { malas, notas };
}

export default function PlanillaDemo() {
  const [filas, setFilas] = useState<[string, string][]>(EJEMPLO);
  const { malas, notas } = revisar(filas);
  const conProblemas = new Set(notas.map((n) => n.split(":")[0])).size;

  function cambiar(f: number, d: number) {
    setFilas((prev) =>
      prev.map(([n, t], i) => {
        if (i !== f) return [n, t];
        const arr = t.split("");
        arr[d] = CICLO[arr[d]];
        return [n, arr.join("")];
      }),
    );
  }

  return (
    <div className="hoja entra" style={{ animationDelay: "320ms" }}>
      <div className="hoja-cab">
        <h2>Pruébalo aquí</h2>
        <p>M 07–15 · T 15–23 · N 23–07</p>
      </div>
      <p className="ayuda">
        Toca una celda para cambiar el turno. <b>La revisión se rehace sola.</b>
      </p>
      <div className="fila" aria-hidden="true">
        <span />
        {DIAS.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: los días repiten letra
          <span key={i} className="dia">
            {d}
          </span>
        ))}
      </div>
      {filas.map(([nombre, t], f) => (
        <div key={nombre} className="fila">
          <span className="persona">{nombre}</span>
          {t.split("").map((c, d) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: posición fija del día
              key={d}
              type="button"
              className={`c ${c}${malas.has(`${f}-${d}`) ? " mala" : ""}`}
              onClick={() => cambiar(f, d)}
              aria-label={`${nombre}, ${NOMBRE_DIA[d]}: ${NOMBRE_TURNO[c]}. Cambiar turno.`}
            >
              {c}
            </button>
          ))}
        </div>
      ))}
      <ul className="notas" aria-live="polite">
        {notas.length === 0 ? (
          <li className="nota mano ok">Todo cumple. Prueba romper algo.</li>
        ) : (
          notas.slice(0, 4).map((n) => (
            <li key={n} className="nota mano">
              {n}
            </li>
          ))
        )}
      </ul>
      <div className="hoja-pie">
        <span>
          {notas.length === 0
            ? "4 de 4 personas cumplen"
            : `${conProblemas} de 4 personas con problemas`}
          {" · "}
          <a
            href={URL_REVISAR}
            className="underline underline-offset-4 hover:text-[#EEF1F4]"
          >
            ejemplo con 3 reglas; revisa tu planilla completa
          </a>
        </span>
        <button
          type="button"
          className="chico"
          onClick={() => setFilas(EJEMPLO)}
        >
          Volver al ejemplo
        </button>
      </div>
    </div>
  );
}
