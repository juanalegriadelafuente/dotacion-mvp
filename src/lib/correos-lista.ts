// src/lib/correos-lista.ts
//
// Los tres correos de la lista de revisión (textos aprobados por Juan el
// 01-11-2026). Funciones puras: no envían nada ni leen variables de entorno.

export const URL_SITIO = "https://dotaciones.cl";
export const URL_PDF_LISTA = `${URL_SITIO}/lista-revision-turnos.pdf`;
const URL_VERIFICADOR =
  "https://kaden.cl/verificador?utm_source=dotaciones&utm_medium=correo";
const URL_KIT = `${URL_SITIO}/kit-turnos?utm_source=lista&utm_medium=correo`;

const DIA_MS = 24 * 60 * 60 * 1000;

/** Días de espera antes del correo 2 y del correo 3. */
const ESPERA_DIAS: Record<1 | 2, number> = { 1: 2, 2: 3 };

/** Cuándo toca el correo que sigue al `ultimo` que se envió. */
export function proximoEnvio(ultimo: 1 | 2, desde: Date): Date {
  return new Date(desde.getTime() + ESPERA_DIAS[ultimo] * DIA_MS);
}

export function urlBaja(token: string): string {
  return `${URL_SITIO}/lista-revision/baja?t=${token}`;
}

export function enPesos(monto: number): string {
  return `$${Math.round(monto)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export type Correo = { asunto: string; html: string; texto: string };

function armar(
  asunto: string,
  parrafos: string[],
  textos: string[],
  token: string,
): Correo {
  const baja = urlBaja(token);
  const firma = "Juan Alegría de la Fuente<br>dotaciones.cl · Nexwork SpA";
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#f4f1ea;font-family:Arial,sans-serif;color:#16202b;font-size:16px;line-height:1.55"><div style="max-width:560px;margin:0 auto">${parrafos
    .map((p) => `<p style="margin:0 0 16px">${p}</p>`)
    .join(
      "",
    )}<p style="margin:24px 0 16px">${firma}</p><p style="margin:0;font-size:13px;color:#5a6672">Recibes este correo porque pediste la lista de revisión en dotaciones.cl. <a href="${baja}" style="color:#5a6672">Darme de baja</a>.</p></div></body></html>`;
  const texto = `${textos.join("\n\n")}\n\nJuan Alegría de la Fuente\ndotaciones.cl · Nexwork SpA\n\nPara dejar de recibir estos correos: ${baja}\n`;
  return { asunto, html, texto };
}

export function correoLista(token: string): Correo {
  return armar(
    "Tu lista: 10 preguntas antes de publicar el turno",
    [
      "Hola:",
      `Acá está la <a href="${URL_PDF_LISTA}">lista de revisión en PDF</a>. Imprímela y pásala por tu planilla antes de publicar el turno del mes.`,
      `Si quieres comprobarlo con un sistema, pega tu planilla en <a href="${URL_VERIFICADOR}">kaden.cl/verificador</a>. Gratis te dice si cumple y te explica el primer problema.`,
    ],
    [
      "Hola:",
      `Acá está la lista de revisión en PDF: ${URL_PDF_LISTA}\nImprímela y pásala por tu planilla antes de publicar el turno del mes.`,
      `Si quieres comprobarlo con un sistema, pega tu planilla en ${URL_VERIFICADOR}\nGratis te dice si cumple y te explica el primer problema.`,
    ],
    token,
  );
}

export function correoSaliente(token: string): Correo {
  const cuerpo = [
    "Hola:",
    "Un turno de 22:00 a 06:00 termina al día siguiente. Ese día es el saliente: aunque en la planilla aparezca vacío, no fue un día libre.",
    "Por eso una racha de lunes a sábado, con noche el sábado, son siete días seguidos y no seis. Y la ley no permite más de seis.",
    "Lo mismo pasa con el cambio de mes: las rachas no se reinician el día 1. Si alguien trabajó del 27 al 31, el 1 y el 2 ya le hacen siete.",
    "Revisa estas dos cosas en tu próximo turno. Son las preguntas 2 y 3 de la lista.",
  ];
  return armar("El error que no se ve en la planilla", cuerpo, cuerpo, token);
}

/** El precio viene de la tienda de Kaden: en este sitio no se escribe ninguno. */
export function correoKit(token: string, precio: number): Correo {
  const intro =
    "La lista sirve para revisar al final. Si prefieres que los errores aparezcan mientras armas el mes, armé el Kit Turnos Legales:";
  const trae = [
    "Una planilla Excel con las horas de cada semana al lado de los días y los errores a la izquierda del nombre.",
    "Una planilla de ejemplo, con errores a propósito para que veas cómo avisa.",
    "Una guía de 18 páginas con el artículo de la ley al lado de cada regla.",
  ];
  const cierre = "Este es el último correo de esta serie.";
  return armar(
    "Una planilla que hace estas cuentas por ti",
    [
      "Hola:",
      `${intro}<br>• ${trae.join("<br>• ")}`,
      `Cuesta ${enPesos(precio)}: <a href="${URL_KIT}">dotaciones.cl/kit-turnos</a>`,
      cierre,
    ],
    [
      "Hola:",
      `${intro}\n- ${trae.join("\n- ")}`,
      `Cuesta ${enPesos(precio)}: ${URL_KIT}`,
      cierre,
    ],
    token,
  );
}
