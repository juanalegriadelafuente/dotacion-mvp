// src/lib/enviar-lista.ts
//
// Manda un correo de la lista de revisión por Resend. `reply_to` llega a una
// casilla real, y los encabezados List-Unsubscribe dan la baja con un clic desde
// el propio programa de correo.
import "server-only";
import type { Correo } from "@/lib/correos-lista";
import { URL_SITIO } from "@/lib/correos-lista";

export async function enviarCorreoLista(
  destino: string,
  token: string,
  correo: Correo,
): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Juan de Dotaciones <no-reply@kaden.cl>",
      reply_to: "hola@kaden.cl",
      to: [destino],
      subject: correo.asunto,
      html: correo.html,
      text: correo.texto,
      headers: {
        "List-Unsubscribe": `<${URL_SITIO}/api/lista-revision/baja?t=${token}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!res.ok) {
    // Solo el tipo de error: el mensaje podría traer la dirección, y un correo no
    // va a los registros.
    const error = await res.json().catch(() => null);
    console.error("lista-revision: Resend respondió", res.status, error?.name);
    return false;
  }
  return true;
}
