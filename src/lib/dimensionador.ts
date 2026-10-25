// src/lib/dimensionador.ts
//
// La calculadora de dotación le pide la cuenta al dimensionador de Kaden
// (D-DIMW-2): un modelo CP-SAT que decide cuántas personas de cada jornada y a
// qué hora entra cada una. Acá sólo se arma el pedido y se lee la respuesta; la
// cuenta y la ley viven en un solo lugar, que es Kaden.

export const URL_DIMENSIONADOR =
  process.env.NEXT_PUBLIC_DIMENSIONADOR_URL ??
  "https://api.kaden.cl/api/v1/dimensionador/mix";

export type DiaWeb = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type Dia = "LUN" | "MAR" | "MIE" | "JUE" | "VIE" | "SAB" | "DOM";

export const DIA_KADEN: Record<DiaWeb, Dia> = {
  mon: "LUN",
  tue: "MAR",
  wed: "MIE",
  thu: "JUE",
  fri: "VIE",
  sat: "SAB",
  sun: "DOM",
};

export const NOMBRE_DIA: Record<Dia, string> = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
  SAB: "Sábado",
  DOM: "Domingo",
};

export type DiaDemanda = { open: boolean; slots: number[] };

export type JornadaPedida = {
  nombre: string;
  horas_semana: number;
  dias_semana: number;
  costo_hora?: number;
  maximo?: number;
};

export type Entrada = {
  dia: Dia;
  jornada: string;
  hora_inicio: number;
  horas: number;
  personas: number;
};

export type Opcion = {
  estado: string;
  optima: boolean;
  personas: Record<string, number>;
  dotacion_total: number;
  horas_contratadas: number;
  horas_requeridas: number;
  costo_semanal: number | null;
  entradas: Entrada[];
};

export type RespuestaMix = {
  apertura: number;
  cierre: number;
  mas_barata: Opcion | null;
  menos_personas: Opcion | null;
  barata_por: "pesos" | "horas";
  alcance: string;
};

/**
 * De tramos de 30 minutos a horas, como las pide el modelo.
 *
 * En cada hora se toma el MAYOR de sus dos tramos: si a las 13:30 se necesitan
 * 5, la hora de las 13 necesita 5 aunque a las 13:00 basten 3. Promediar
 * dejaría media hora descubierta y la calculadora diría que alcanza.
 */
export function curvaPorHora(
  dias: Record<DiaWeb, DiaDemanda>,
): Partial<Record<Dia, number[]>> {
  const curva: Partial<Record<Dia, number[]>> = {};
  for (const [web, d] of Object.entries(dias) as [DiaWeb, DiaDemanda][]) {
    if (!d.open) continue;
    const horas = Array.from({ length: 24 }, (_, h) =>
      Math.max(d.slots[2 * h] ?? 0, d.slots[2 * h + 1] ?? 0),
    );
    if (horas.some((n) => n > 0)) curva[DIA_KADEN[web]] = horas;
  }
  return curva;
}

/** Las entradas de una opción, agrupadas por día y en orden de la semana. */
export function entradasPorDia(opcion: Opcion): [Dia, Entrada[]][] {
  const orden: Dia[] = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
  return orden
    .map(
      (d) =>
        [d, opcion.entradas.filter((e) => e.dia === d)] as [Dia, Entrada[]],
    )
    .filter(([, es]) => es.length > 0);
}

export const horaTexto = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Lo que dice el servidor cuando no puede calcular, en una frase. */
export function mensajeDeError(estado: number, cuerpo: unknown): string {
  const detalle = (cuerpo as { detail?: unknown } | null)?.detail;
  if (typeof detalle === "string") return detalle;
  if (Array.isArray(detalle) && detalle.length > 0) {
    const msg = String((detalle[0] as { msg?: unknown })?.msg ?? "");
    if (msg) return msg.replace(/^Value error, /, "");
  }
  if (estado === 429)
    return "Hiciste varios cálculos seguidos. Espera un rato.";
  return "No pudimos calcular ahora. Intenta de nuevo en un momento.";
}

export async function pedirMix(
  curva: Partial<Record<Dia, number[]>>,
  jornadas: JornadaPedida[],
): Promise<RespuestaMix> {
  let r: Response;
  try {
    r = await fetch(URL_DIMENSIONADOR, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ curva, jornadas }),
    });
  } catch {
    throw new Error(
      "No pudimos conectarnos con el calculador. Revisa tu conexión.",
    );
  }
  const cuerpo = await r.json().catch(() => null);
  if (!r.ok) throw new Error(mensajeDeError(r.status, cuerpo));
  return cuerpo as RespuestaMix;
}

/**
 * Una opción en la forma que ya leen el correo y el Excel de `/api/leads`, para
 * no reescribir ese envío. Sólo se traducen números que el modelo calculó: la
 * holgura es lo contratado menos lo que pide la curva.
 */
export function aMixDeCorreo(
  opcion: Opcion,
  jornadas: JornadaPedida[],
  id: number,
  marca: { isCheapest: boolean; isOptimal: boolean },
) {
  const porNombre = new Map(jornadas.map((j) => [j.nombre, j]));
  const holgura = opcion.horas_contratadas - opcion.horas_requeridas;
  const personasParcial = Object.entries(opcion.personas).reduce(
    (suma, [nombre, n]) => {
      const j = porNombre.get(nombre);
      return j && j.horas_semana <= 30 ? suma + n : suma;
    },
    0,
  );
  return {
    id,
    headcount: opcion.dotacion_total,
    hoursTotal: opcion.horas_contratadas,
    slackHours: Math.round(holgura * 10) / 10,
    slackPct:
      opcion.horas_contratadas > 0 ? holgura / opcion.horas_contratadas : 0,
    sundayOk: true,
    coverageOk: true,
    weeklyCost: opcion.costo_semanal ?? undefined,
    ptShare:
      opcion.dotacion_total > 0 ? personasParcial / opcion.dotacion_total : 0,
    items: Object.entries(opcion.personas).map(([nombre, count]) => {
      const j = porNombre.get(nombre);
      return {
        count,
        contractName: nombre,
        hoursPerWeek: j?.horas_semana ?? 0,
        jornadaName: j ? `${j.dias_semana} días` : "",
      };
    }),
    ...marca,
  };
}
