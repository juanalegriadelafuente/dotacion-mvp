// src/components/SiteNav.tsx
// Diseño Noche (D-ING-10). Autosuficiente: también va arriba de las
// calculadoras, que tienen su propio estilo.
import Link from "next/link";
import { URL_REVISAR } from "@/lib/sitio";

export default function SiteNav() {
  return (
    <nav
      aria-label="Principal"
      className="sticky top-0 z-[100] border-b border-white/10 bg-[#0B1724]/90 backdrop-blur"
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5">
        <Link
          href="/"
          className="text-[28px] text-[#EEF1F4]"
          style={{ fontFamily: "var(--font-instrument-serif), serif" }}
        >
          dotaciones<span className="text-[#2BB58D]">.cl</span>
        </Link>
        <div className="flex items-center gap-6 text-[15px]">
          <Link
            href="/#herramientas"
            className="hidden text-[#9AA8B6] hover:text-[#EEF1F4] sm:inline"
          >
            Herramientas
          </Link>
          <Link
            href="/blog"
            className="hidden text-[#9AA8B6] hover:text-[#EEF1F4] sm:inline"
          >
            Blog
          </Link>
          <Link
            href="/nosotros"
            className="hidden text-[#9AA8B6] hover:text-[#EEF1F4] md:inline"
          >
            Quiénes somos
          </Link>
          <a
            href={URL_REVISAR}
            className="rounded-full bg-[#EEF1F4] px-[18px] py-[11px] font-semibold text-[#0B1724] hover:bg-white"
          >
            Revisar mi turno
          </a>
        </div>
      </div>
    </nav>
  );
}
