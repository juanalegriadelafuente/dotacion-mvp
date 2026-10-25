// src/lib/medir.ts
//
// Registrar un paso del embudo desde el navegador (D-ING-11). Sin cookies, sin
// identificar a nadie: manda el evento, el lugar y de dónde vino la visita, y el
// servidor lo guarda con el día. Si falla, no pasa nada: medir nunca rompe lo
// que el visitante vino a hacer.

export const EVENTOS = [
  "visita",
  "revisar_click",
  "lite_click",
  "planilla_demo",
  "divisor_mini",
  "divisor_uso",
  "divisor_copiar",
  "dotacion_calculo",
  "suscripcion",
  "blog_filtro",
] as const;

export type Evento = (typeof EVENTOS)[number];

/** De dónde llegó: `utm_source` si viene, si no el dominio que refirió. */
function origen(): string | undefined {
  try {
    const utm = new URLSearchParams(location.search).get("utm_source");
    if (utm) return utm.toLowerCase().slice(0, 40);
    if (!document.referrer) return "directo";
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    if (host === location.hostname.replace(/^www\./, "")) return "interno";
    return host.slice(0, 40);
  } catch {
    return undefined;
  }
}

/** Una vez por carga de página y por clave: «usó la planilla», no cada clic. */
const yaMedido = new Set<string>();

export function medir(evento: Evento, lugar?: string, unaVez = false): void {
  try {
    const clave = `${evento}|${lugar ?? ""}`;
    if (unaVez && yaMedido.has(clave)) return;
    yaMedido.add(clave);
    const cuerpo = JSON.stringify({
      evento,
      lugar: (lugar ?? location.pathname).toLowerCase().slice(0, 80),
      origen: origen(),
    });
    const blob = new Blob([cuerpo], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/evento", blob)) {
      fetch("/api/evento", {
        method: "POST",
        body: cuerpo,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Medir no puede romper la página.
  }
}
