// src/lib/divisor.ts
//
// El divisor de turnos: partir un horario en N turnos iguales y, si se quiere,
// repartirlos entre personas a lo largo de varios días.
//
// Módulo PURO (sin React ni red) para poder probarlo con `npm test`.
//
// Aquí NO se decide nada sobre la ley (D-ING-1): la legalidad la revisa Kaden
// Revisión, a la que se le pega la planilla que arma `aPlanilla`. Una segunda
// copia de las reglas en TypeScript terminaría diciendo otra cosa que la primera.

export const MIN_DIA = 24 * 60;

export interface Tramo {
  /** Minutos desde la medianoche del día en que empieza el horario (0–1439). */
  inicio: number;
  /** Puede pasar de 1440 si el turno termina al día siguiente. */
  fin: number;
}

/** «08:30» → 510. Devuelve null si no es una hora válida. */
export function aMinutos(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 1530 → «01:30» (la hora del reloj, sin el día). */
export function aHora(minutos: number): string {
  const enDia = ((minutos % MIN_DIA) + MIN_DIA) % MIN_DIA;
  const h = Math.floor(enDia / 60);
  const m = enDia % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 160 → «2 h 40 min». */
export function duracionTexto(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/**
 * Minutos que cubre el horario. Si «hasta» es igual o anterior a «desde», el
 * horario cruza la medianoche; si son iguales, son 24 horas.
 */
export function largoDelHorario(desde: number, hasta: number): number {
  return hasta > desde ? hasta - desde : hasta + MIN_DIA - desde;
}

/**
 * Parte el horario en `n` turnos seguidos, sin huecos ni traslapes. Los cortes
 * se redondean a `paso` minutos (1, 5, 15 o 30), así que los turnos pueden
 * diferir entre sí en a lo más un paso; el primero empieza exacto en «desde» y
 * el último termina exacto en «hasta».
 */
export function dividir(
  desde: number,
  hasta: number,
  n: number,
  paso = 1,
): Tramo[] {
  const total = largoDelHorario(desde, hasta);
  const cortes: number[] = [];
  for (let i = 0; i <= n; i++) {
    const exacto = (total * i) / n;
    cortes.push(i === 0 || i === n ? exacto : Math.round(exacto / paso) * paso);
  }
  const tramos: Tramo[] = [];
  for (let i = 0; i < n; i++) {
    tramos.push({ inicio: desde + cortes[i], fin: desde + cortes[i + 1] });
  }
  return tramos;
}

export interface Asignacion {
  /** Fecha ISO del día en que EMPIEZA el horario (`2026-11-03`). */
  fecha: string;
  /** Índice del turno dentro del día (0 = el primero). */
  turno: number;
  persona: string;
}

/** `2026-11-03` + 2 → `2026-11-05`, sin depender de la zona horaria. */
export function sumarDias(fechaIso: string, dias: number): string {
  const [a, m, d] = fechaIso.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

/**
 * Reparte los turnos de cada día entre las personas, en rueda: el día 1 la
 * primera persona toma el turno 1, la segunda el turno 2…; al día siguiente la
 * rueda sigue donde quedó. Así, con más personas que turnos, todos descansan
 * algunos días, y con menos, alguien repite turno en el mismo día (lo que la
 * revisión legal va a marcar).
 */
export function repartir(
  personas: string[],
  turnosPorDia: number,
  fechaInicio: string,
  dias: number,
): Asignacion[] {
  const salida: Asignacion[] = [];
  if (personas.length === 0) return salida;
  let k = 0;
  for (let d = 0; d < dias; d++) {
    const fecha = sumarDias(fechaInicio, d);
    for (let t = 0; t < turnosPorDia; t++) {
      salida.push({ fecha, turno: t, persona: personas[k % personas.length] });
      k++;
    }
  }
  return salida;
}

/** Minutos asignados a cada persona en todo el periodo (aritmética, no ley). */
export function minutosPorPersona(
  asignaciones: Asignacion[],
  tramos: Tramo[],
): Record<string, number> {
  const total: Record<string, number> = {};
  for (const a of asignaciones) {
    const t = tramos[a.turno];
    total[a.persona] = (total[a.persona] ?? 0) + (t.fin - t.inicio);
  }
  return total;
}

/**
 * La planilla en el formato que lee Kaden Revisión al pegarla: primera fila
 * con las fechas, una fila por persona y, en cada celda, el horario
 * («22:00-06:00») o vacío si ese día no trabaja. Separada por tabuladores, como
 * la copia Excel.
 *
 * Cada turno va en la columna del día en que EMPIEZA: en un horario de 22:00 a
 * 06:00, el turno de 02:00 a 06:00 es de madrugada del día siguiente, no del
 * día en que partió el horario. Ponerlo en la fecha de inicio haría que la
 * revisión mirara el día equivocado.
 *
 * Si una persona tiene dos turnos el mismo día (pocas personas para los turnos)
 * la celda lleva solo el primero y se avisa aparte: una celda de planilla es un
 * turno, no dos.
 */
export function aPlanilla(
  asignaciones: Asignacion[],
  tramos: Tramo[],
): { texto: string; dobles: number } {
  const diaReal = (a: Asignacion) =>
    sumarDias(a.fecha, Math.floor(tramos[a.turno].inicio / MIN_DIA));
  const fechas = [...new Set(asignaciones.map(diaReal))].sort();
  const personas = [...new Set(asignaciones.map((a) => a.persona))];
  const celda: Record<string, Record<string, string>> = {};
  let dobles = 0;
  for (const a of asignaciones) {
    const fecha = diaReal(a);
    celda[a.persona] ??= {};
    if (celda[a.persona][fecha]) {
      dobles++;
      continue;
    }
    const t = tramos[a.turno];
    celda[a.persona][fecha] = `${aHora(t.inicio)}-${aHora(t.fin)}`;
  }
  const filas = [
    ["Nombre", ...fechas].join("\t"),
    ...personas.map((p) =>
      [p, ...fechas.map((f) => celda[p]?.[f] ?? "")].join("\t"),
    ),
  ];
  return { texto: filas.join("\n"), dobles };
}
