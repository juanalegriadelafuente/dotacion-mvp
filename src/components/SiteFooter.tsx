// src/components/SiteFooter.tsx
// Diseño A (D-ING-9).
import Link from "next/link";
import { URL_REVISAR } from "@/lib/sitio";
import { Logo } from "./SiteNav";

const columnas: {
  titulo: string;
  enlaces: { label: string; href: string }[];
}[] = [
  {
    titulo: "Herramientas",
    enlaces: [
      { label: "Revisar si mi turno es legal", href: URL_REVISAR },
      { label: "Dividir turnos", href: "/dividir-turnos" },
      { label: "Calculadora de dotación", href: "/calculadora" },
      { label: "Dotación hospitalaria (SAN)", href: "/san" },
      { label: "Calculadora de finiquito", href: "/calculadora/finiquito" },
    ],
  },
  {
    titulo: "Blog",
    enlaces: [
      { label: "Todos los artículos", href: "/blog" },
      {
        label: "Planificador de turnos",
        href: "/blog/planificador-turnos-chile",
      },
      { label: "Jornada 6x1", href: "/blog/jornada-6x1-retail-chile" },
      {
        label: "Dictamen 253/21 y 42 horas",
        href: "/blog/dictamen-253-21-42-horas-implementacion",
      },
    ],
  },
  {
    titulo: "dotaciones.cl",
    enlaces: [
      { label: "Quiénes somos", href: "/nosotros" },
      { label: "Contacto", href: "/contacto" },
      { label: "Privacidad", href: "/privacidad" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="fuente-a border-t border-slate-200 bg-slate-50 px-4 py-14 sm:px-5">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-[30ch] text-[14px] leading-relaxed text-slate-500">
            Herramientas gratuitas y un blog sobre turnos y dotación según la
            ley laboral chilena.
          </p>
        </div>
        {columnas.map((c) => (
          <div key={c.titulo}>
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-400">
              {c.titulo}
            </div>
            <ul className="space-y-2.5">
              {c.enlaces.map((l) => (
                <li key={l.href}>
                  {l.href.startsWith("http") ? (
                    <a
                      href={l.href}
                      className="text-[14px] text-slate-600 hover:text-[#5B4BEA]"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-[14px] text-slate-600 hover:text-[#5B4BEA]"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-slate-200 pt-6 text-[13px] text-slate-400">
        © {new Date().getFullYear()} dotaciones.cl · Nexwork SpA · Chile. Las
        herramientas orientan; no reemplazan la asesoría legal.
      </div>
    </footer>
  );
}
