// src/app/kit-turnos/terminos/page.tsx
//
// Términos de compra del Kit Turnos Legales. Texto legal: lo redacta Claude y lo
// valida Juan antes de publicarse (como D-REV-10). El precio no se escribe: sale
// de Kaden, igual que en la página de venta.
import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { enPesos, KIT_TURNOS, verProducto } from "@/lib/tienda";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Términos de compra del Kit Turnos Legales — dotaciones.cl",
  description:
    "Qué incluye el Kit Turnos Legales, cómo se paga y se entrega, sus límites y quién lo vende.",
  alternates: { canonical: "https://dotaciones.cl/kit-turnos/terminos" },
};

export default async function Terminos() {
  const producto = await verProducto(KIT_TURNOS);
  const precio = producto ? enPesos(producto.precio) : "el precio publicado";

  const secciones: { titulo: string; parrafos: string[] }[] = [
    {
      titulo: "Qué compras",
      parrafos: [
        "Un archivo .zip con dos archivos: una planilla Excel (.xlsx) para armar los turnos del mes, con alertas de días seguidos, horas de la semana, domingos libres y descanso entre turnos, y la guía «Turnos legales en Chile» en PDF.",
        "Es una licencia para usarlos en tu empresa. No puedes revenderlos ni publicarlos.",
      ],
    },
    {
      titulo: "Precio y pago",
      parrafos: [
        `${precio}, IVA incluido, en un pago único. No es una suscripción y no hay cobros posteriores.`,
        "El pago se hace con tarjeta en Flow, una pasarela de pago externa. Nexwork SpA no recibe ni guarda los datos de tu tarjeta. Flow envía el comprobante del pago al correo que indicaste.",
      ],
    },
    {
      titulo: "Entrega",
      parrafos: [
        "Apenas Flow confirma el pago, normalmente en segundos, ves el enlace de descarga en pantalla y te llega el mismo enlace por correo. El enlace funciona durante 30 días corridos y permite hasta 5 descargas. Guarda los archivos en tu computador.",
        "Si pagaste y el enlace no aparece o no te llega, escríbenos a hola@kaden.cl con el correo que usaste y lo resolvemos.",
      ],
    },
    {
      titulo: "Qué cubre y qué no",
      parrafos: [
        "La guía y la planilla describen la ley laboral chilena vigente a la fecha de su edición, que está indicada en ambos archivos. La planilla avisa solo las reglas que se indican en ella; no revisa la colación dentro de la jornada, el 4x3 ni los pactos de cada contrato.",
        "No es asesoría legal ni certifica el cumplimiento de la legislación laboral. La responsabilidad por los turnos es de cada empleador.",
      ],
    },
    {
      titulo: "Retracto y garantía",
      parrafos: [
        producto?.aviso_retracto ??
          "Por tratarse de un contenido digital de descarga inmediata, esta compra no tiene derecho a retracto (artículo 3° bis, letra b), de la Ley N° 19.496), lo que se informa antes de pagar.",
        "Si el archivo no se puede descargar o viene dañado, escríbenos a hola@kaden.cl dentro de 30 días y te lo reponemos o te devolvemos el monto completo.",
      ],
    },
    {
      titulo: "Quién vende",
      parrafos: [
        "Nexwork SpA, RUT 78.388.198-5, Avenida Carlos Valdovinos 2351, Pedro Aguirre Cerda, Santiago, Chile. Contacto: hola@kaden.cl.",
      ],
    },
  ];

  return (
    <div className="noche">
      <SiteNav />
      <main className="envase max-w-[760px] py-16">
        <p className="text-[15px] font-medium text-[#2BB58D]">
          Kit Turnos Legales
        </p>
        <h1 className="titular mt-2 text-[clamp(34px,5vw,48px)] leading-tight">
          Términos de compra
        </h1>
        <p className="mt-2 text-[#9AA8B6]">Vigentes desde el 30-10-2026.</p>
        {secciones.map((s) => (
          <section key={s.titulo} className="mt-10">
            <h2 className="text-[20px] font-semibold">{s.titulo}</h2>
            {s.parrafos.map((p) => (
              <p
                key={p.slice(0, 40)}
                className="mt-3 leading-relaxed text-[#C3CCD5]"
              >
                {p}
              </p>
            ))}
          </section>
        ))}
        <p className="mt-10 leading-relaxed text-[#C3CCD5]">
          El tratamiento de tus datos está en la{" "}
          <Link href="/privacidad" className="underline">
            política de privacidad
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
