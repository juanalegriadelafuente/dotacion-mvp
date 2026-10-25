// src/components/SiteFooter.tsx
// Diseño Noche (D-ING-10).
import Link from "next/link";
import { URL_LITE, URL_REVISAR } from "@/lib/sitio";

const enlaces: { label: string; href: string }[] = [
  { label: "Revisar mi turno", href: URL_REVISAR },
  { label: "Arma tus turnos", href: URL_LITE },
  { label: "Dividir turnos", href: "/dividir-turnos" },
  { label: "Calculadora de dotación", href: "/calculadora" },
  { label: "Blog", href: "/blog" },
  { label: "Quiénes somos", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
  { label: "Privacidad", href: "/privacidad" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0B1724] text-[15px] text-[#9AA8B6]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-6 px-5 pb-16 pt-14">
        <span>
          <span
            className="text-[22px] text-[#EEF1F4]"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            dotaciones<span className="text-[#2BB58D]">.cl</span>
          </span>
          <span className="mt-2 block text-[14px]">
            Nexwork SpA · Chile. Las herramientas orientan; no reemplazan la
            asesoría legal.
          </span>
        </span>
        <nav aria-label="Pie" className="flex flex-wrap gap-x-6 gap-y-2">
          {enlaces.map((l) =>
            l.href.startsWith("http") ? (
              <a key={l.href} href={l.href} className="hover:text-[#EEF1F4]">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="hover:text-[#EEF1F4]">
                {l.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
