// src/components/SiteNav.tsx
// Diseño A (D-ING-9): blanco, logo con el degradado de marca, CTA oscuro.
import Link from "next/link";
import { URL_REVISAR } from "@/lib/sitio";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`fuente-a flex items-center gap-2 text-[17px] font-extrabold tracking-tight text-slate-900 ${className}`}
    >
      <span className="degradado-marca inline-flex h-8 w-8 items-center justify-center rounded-xl text-[15px] font-extrabold text-white">
        D
      </span>
      dotaciones<span className="text-[#6D5EFC]">.cl</span>
    </Link>
  );
}

export default function SiteNav() {
  return (
    <nav className="fuente-a sticky top-0 z-[100] border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-5">
        <Logo />
        <div className="flex items-center gap-1 text-[14px] font-medium text-slate-600 sm:gap-2">
          <Link
            href="/#herramientas"
            className="hidden rounded-full px-3 py-2 hover:text-slate-900 sm:inline"
          >
            Herramientas
          </Link>
          <Link
            href="/blog"
            className="hidden rounded-full px-3 py-2 hover:text-slate-900 sm:inline"
          >
            Blog
          </Link>
          <Link
            href="/contacto"
            className="hidden rounded-full px-3 py-2 hover:text-slate-900 md:inline"
          >
            Contacto
          </Link>
          <a
            href={URL_REVISAR}
            className="ml-1 rounded-full bg-slate-900 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Revisar mi turno
          </a>
        </div>
      </div>
    </nav>
  );
}
