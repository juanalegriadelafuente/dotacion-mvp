// src/lib/resumen-dotacion.ts
//
// El texto que acompaña un cálculo de dotación. Lo arma este código, no una IA: un
// análisis real dijo que el límite legal era de 45 horas (son 42) y otro llamó «la
// más económica» a una opción sin que el cálculo lo dijera. Acá solo se repiten los
// números del cálculo, y lo que no viene no se menciona.

const SIN_LEY =
  "Este resumen no revisa si los turnos cumplen la ley. Para eso, pega tu planilla en kaden.cl/verificador.";

const MAX_OPCIONES = 2;
const MAX_CONTRATOS = 6;
const MAX_ADVERTENCIAS = 5;

function numero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0
    ? valor
    : null;
}

function cifra(valor: number): string {
  return valor.toLocaleString("es-CL", { maximumFractionDigits: 1 });
}

function personas(n: number): string {
  return n === 1 ? "1 persona" : `${cifra(n)} personas`;
}

function horas(n: number): string {
  return n === 1 ? "1 hora" : `${cifra(n)} horas`;
}

function contratos(items: unknown): string {
  if (!Array.isArray(items)) return "";
  const partes = items.slice(0, MAX_CONTRATOS).flatMap((item) => {
    const n = numero(item?.count);
    const nombre = String(item?.contractName ?? "")
      .trim()
      .slice(0, 40);
    return n !== null && n > 0 && nombre ? [`${cifra(n)} de ${nombre}`] : [];
  });
  if (partes.length < 2) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

/** Una opción en palabras, o `null` si no trae cuántas personas son. */
function opcion(mix: Record<string, unknown>): string | null {
  const dotacion = numero(mix?.headcount);
  if (dotacion === null) return null;
  const detalle = contratos(mix.items);
  const total = numero(mix.hoursTotal);
  const holgura = numero(mix.slackHours);
  let texto = personas(dotacion);
  if (detalle) texto += ` (${detalle})`;
  if (total !== null) texto += `, con ${horas(total)} contratadas a la semana`;
  if (holgura !== null) texto += ` y ${horas(holgura)} de holgura`;
  return `${texto}.`;
}

/** Calculadora de retail y servicios: las opciones que devolvió el optimizador. */
export function resumenRetail(
  mixes: unknown,
  resultados?: Record<string, unknown> | null,
): string {
  const parrafos: string[] = [];
  const requeridas = numero(resultados?.requiredHours);
  if (requeridas !== null && requeridas > 0) {
    parrafos.push(`Tu operación necesita ${horas(requeridas)} a la semana.`);
  }
  if (Array.isArray(mixes)) {
    for (const mix of mixes.slice(0, MAX_OPCIONES)) {
      const texto = opcion(mix);
      if (!texto) continue;
      const titulo = [
        mix.isCheapest ? "más barata" : "",
        mix.isOptimal ? "con menos personas" : "",
      ]
        .filter(Boolean)
        .join(" y ");
      parrafos.push(`${titulo ? `Opción ${titulo}` : "Opción"}: ${texto}`);
    }
  }
  parrafos.push(SIN_LEY);
  return parrafos.join("\n\n");
}

/** Calculadora SAN: las cifras que ya aparecen en la pantalla de resultados. */
export function resumenSan(resultados: Record<string, unknown>): string {
  const parrafos: string[] = [];
  const total = numero(resultados?.totalHorasSemanales);
  const fte = numero(resultados?.fteEquivalente);
  if (total !== null) {
    parrafos.push(
      `Tu servicio necesita ${horas(total)} a la semana${fte !== null ? `, equivalentes a ${cifra(fte)} jornadas completas` : ""}.`,
    );
  }
  const nutricionistas = numero(resultados?.nutricionistasCli);
  if (nutricionistas !== null) {
    parrafos.push(`Nutricionistas clínicas: ${cifra(nutricionistas)}.`);
  }
  const mix = resultados?.mixRecomendado as Record<string, unknown> | null;
  const texto = mix ? opcion(mix) : null;
  if (texto) parrafos.push(`Combinación de contratos: ${texto}`);
  const advertencias = resultados?.advertencias;
  if (Array.isArray(advertencias) && advertencias.length > 0) {
    const lista = advertencias
      .slice(0, MAX_ADVERTENCIAS)
      .map((a) => String(a).slice(0, 200));
    parrafos.push(`Advertencias del cálculo: ${lista.join(" · ")}`);
  }
  parrafos.push(SIN_LEY);
  return parrafos.join("\n\n");
}
