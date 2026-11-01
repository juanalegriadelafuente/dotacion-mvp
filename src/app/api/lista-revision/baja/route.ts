// src/app/api/lista-revision/baja/route.ts
//
// Da de baja: borra la fila. Solo por POST, porque los programas de correo abren
// los enlaces por su cuenta para revisarlos y darían de baja a la persona. Sin
// revisar el origen: la baja con un clic (RFC 8058) llega desde el proveedor de
// correo, y el token aleatorio ya es la prueba de que el correo es de esa persona.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!UUID.test(token)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // Import diferido: supabaseServer lanza error si faltan las variables.
  const { supabaseAdmin } = await import("@/lib/supabaseServer");
  const { error } = await supabaseAdmin
    .from("lista_revision")
    .delete()
    .eq("token_baja", token);
  if (error) {
    console.error("lista-revision: no se pudo dar de baja", error.code);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  // Igual si el token no existía: la persona ya no está en la lista.
  return NextResponse.json({ ok: true });
}
