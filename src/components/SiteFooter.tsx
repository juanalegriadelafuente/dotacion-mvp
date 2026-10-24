// src/components/SiteFooter.tsx
import Link from "next/link";
import { URL_REVISAR } from "@/lib/sitio";

const columnas: {
  titulo: string;
  enlaces: { label: string; href: string }[];
}[] = [
  {
    titulo: "Herramientas",
    enlaces: [
      { label: "Revisar si mi turno es legal", href: URL_REVISAR },
      { label: "Calculadora de dotación", href: "/calculadora" },
      { label: "Dotación hospitalaria (SAN)", href: "/san" },
      { label: "Calculadora de finiquito", href: "/calculadora/finiquito" },
    ],
  },
  {
    titulo: "Guías",
    enlaces: [
      {
        label: "Planificador de turnos",
        href: "/blog/planificador-turnos-chile",
      },
      { label: "Jornada 6x1", href: "/blog/jornada-6x1-retail-chile" },
      {
        label: "Ley de 42 horas",
        href: "/blog/dictamen-253-21-42-horas-implementacion",
      },
      { label: "Todas las guías", href: "/blog" },
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
    <footer
      className="border-t px-4 py-12 sm:px-10"
      style={{ background: "#0D1B2A", borderColor: "rgba(232,236,239,0.10)" }}
    >
      <div className="mx-auto grid max-w-[1120px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div
            className="text-[15px] font-extrabold text-[#E8ECEF]"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            dotaciones<span style={{ color: "#168A6C" }}>.cl</span>
          </div>
          <p className="mt-3 max-w-[30ch] text-[13px] leading-relaxed text-[#E8ECEF]/50">
            Herramientas gratuitas para planificar turnos y dotación según la
            ley laboral chilena.
          </p>
        </div>
        {columnas.map((c) => (
          <div key={c.titulo}>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A8895]">
              {c.titulo}
            </div>
            <ul className="space-y-2">
              {c.enlaces.map((l) => (
                <li key={l.href}>
                  {l.href.startsWith("http") ? (
                    <a
                      href={l.href}
                      className="text-[13px] text-[#E8ECEF]/65 hover:text-[#E8ECEF]"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-[13px] text-[#E8ECEF]/65 hover:text-[#E8ECEF]"
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
      <div
        className="mx-auto mt-10 max-w-[1120px] border-t pt-5 text-[12px] text-[#E8ECEF]/35"
        style={{ borderColor: "rgba(232,236,239,0.08)" }}
      >
        © {new Date().getFullYear()} dotaciones.cl · Nexwork SpA · Chile. Las
        herramientas orientan; no reemplazan la asesoría legal.
      </div>
    </footer>
  );
}
