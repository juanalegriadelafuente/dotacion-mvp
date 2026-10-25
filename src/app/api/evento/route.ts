// src/app/api/evento/route.ts
//
// Guarda un evento del embudo (D-ING-11). Responde 204 siempre que el pedido
// tenga forma válida, haya podido guardarlo o no: el navegador no espera nada y
// un error de medición no se le muestra a nadie.
import { NextResponse } from "next/server";
import { EVENTOS } from "@/lib/medir";
import { huella, ipDe, origenValido } from "@/lib/proteccion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERMITIDOS = new Set<string>(EVENTOS);
const LUGAR = /^[a-z0-9/_.-]{1,80}$/;
const ORIGEN = /^[a-z0-9._-]{1,40}$/;

// Freno por instancia: 120 eventos por minuto por visitante es mucho más de lo
// que una persona genera navegando. La IP se usa solo acá, como huella, y no se
// guarda.
const ventanas = new Map<string, number[]>();
function supera(clave: string): boolean {
  const ahora = Date.now();
  const recientes = (ventanas.get(clave) ?? []).filter(
    (t) => ahora - t < 60_000,
  );
  recientes.push(ahora);
  ventanas.set(clave, recientes);
  if (ventanas.size > 5000) ventanas.clear();
  return recientes.length > 120;
}

export async function POST(req: Request) {
  if (!origenValido(req)) return new NextResponse(null, { status: 403 });
  if (supera(huella(ipDe(req)))) return new NextResponse(null, { status: 429 });

  let cuerpo: { evento?: unknown; lugar?: unknown; origen?: unknown };
  try {
    const texto = await req.text();
    if (texto.length > 500) return new NextResponse(null, { status: 413 });
    cuerpo = JSON.parse(texto);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const evento = String(cuerpo.evento ?? "");
  if (!PERMITIDOS.has(evento)) return new NextResponse(null, { status: 400 });
  const lugar =
    typeof cuerpo.lugar === "string" && LUGAR.test(cuerpo.lugar)
      ? cuerpo.lugar
      : null;
  const origen =
    typeof cuerpo.origen === "string" && ORIGEN.test(cuerpo.origen)
      ? cuerpo.origen
      : null;

  try {
    const { supabaseAdmin } = await import("@/lib/supabaseServer");
    const { error } = await supabaseAdmin
      .from("eventos")
      .insert({ evento, lugar, origen });
    if (error) console.error("evento: no se guardó", error.message);
  } catch (e) {
    console.error("evento: no se guardó", String(e));
  }
  return new NextResponse(null, { status: 204 });
}
