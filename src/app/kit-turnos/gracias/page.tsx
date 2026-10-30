// src/app/kit-turnos/gracias/page.tsx
//
// Adonde Kaden devuelve al comprador después de Flow (`tienda_url_gracias`).
// No se indexa: sin el enlace del fragmento no muestra nada útil.
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import Estado from "./Estado";

export const metadata: Metadata = {
  title: "Tu compra — Kit Turnos Legales",
  robots: { index: false, follow: false },
};

export default function Gracias() {
  return (
    <div className="noche">
      <SiteNav />
      <main className="envase max-w-[760px] py-20">
        <Estado />
      </main>
      <SiteFooter />
    </div>
  );
}
