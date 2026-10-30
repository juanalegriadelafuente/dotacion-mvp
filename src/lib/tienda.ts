// src/lib/tienda.ts
//
// La tienda de descargas vive en Kaden (D-ING-1, D-PAG-1): Kaden cobra con Flow,
// guarda la venta y entrega el archivo. Desde acá solo se le pregunta el precio,
// se pide el pago y se consulta la compra. Ningún precio se escribe en este sitio.

export const API_TIENDA =
  process.env.NEXT_PUBLIC_TIENDA_URL ?? "https://api.kaden.cl/api/v1/tienda";

export const KIT_TURNOS = "kit_turnos";

export type Producto = {
  codigo: string;
  nombre: string;
  /** Pesos, IVA incluido. */
  precio: number;
  /** `false` mientras el archivo no esté en el servidor: no se ofrece comprar. */
  disponible: boolean;
  /** El aviso de exclusión del retracto (D-PAG-4), tal cual lo entrega Kaden. */
  aviso_retracto: string;
};

export type Compra = {
  estado: "pendiente" | "pagado" | "rechazado";
  numero: number;
  producto: string;
  /** aaaa-mm-dd */
  vence: string;
  descargas_restantes: number;
};

export class ErrorTienda extends Error {}

async function detalle(r: Response): Promise<string> {
  try {
    const cuerpo = await r.json();
    if (typeof cuerpo?.detail === "string") return cuerpo.detail;
  } catch {
    // sin cuerpo legible
  }
  return "No pudimos conectarnos con la tienda. Intenta de nuevo en un momento.";
}

/** Precio y aviso desde Kaden. En el servidor se revalida cada hora. */
export async function verProducto(codigo: string): Promise<Producto | null> {
  try {
    const r = await fetch(`${API_TIENDA}/productos/${codigo}`, {
      next: { revalidate: 3600 },
    });
    return r.ok ? ((await r.json()) as Producto) : null;
  } catch {
    return null;
  }
}

export async function comprar(
  codigo: string,
  datos: {
    email: string;
    acepta_terminos: boolean;
    acepta_sin_retracto: boolean;
    origen?: string;
  },
): Promise<string> {
  const r = await fetch(`${API_TIENDA}/${codigo}/comprar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!r.ok) throw new ErrorTienda(await detalle(r));
  const { url_pago } = (await r.json()) as { url_pago: string };
  return url_pago;
}

export async function verCompra(token: string): Promise<Compra> {
  const r = await fetch(`${API_TIENDA}/compra/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new ErrorTienda(await detalle(r));
  return (await r.json()) as Compra;
}

export function urlDescarga(token: string): string {
  return `${API_TIENDA}/descarga/${encodeURIComponent(token)}`;
}

export function enPesos(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}
