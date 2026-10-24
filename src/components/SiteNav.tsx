// src/components/SiteNav.tsx
import Link from "next/link";
import { URL_REVISAR } from "@/lib/sitio";

export default function SiteNav() {
  return (
    <nav
      className="sticky top-0 z-[100] flex h-14 items-center justify-between border-b px-4 sm:px-10"
      style={{ background: "#0D1B2A", borderColor: "rgba(232,236,239,0.10)" }}
    >
      <Link
        href="/"
        className="text-[16px] font-extrabold tracking-[-0.02em] text-[#E8ECEF]"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        dotaciones<span style={{ color: "#168A6C" }}>.cl</span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/#herramientas"
          className="hidden rounded-md px-3 py-1.5 text-[13px] text-[#E8ECEF]/60 hover:text-[#E8ECEF] sm:inline"
        >
          Herramientas
        </Link>
        <Link
          href="/blog"
          className="hidden rounded-md px-3 py-1.5 text-[13px] text-[#E8ECEF]/60 hover:text-[#E8ECEF] sm:inline"
        >
          Guías
        </Link>
        <Link
          href="/contacto"
          className="hidden rounded-md px-3 py-1.5 text-[13px] text-[#E8ECEF]/60 hover:text-[#E8ECEF] md:inline"
        >
          Contacto
        </Link>
        <a
          href={URL_REVISAR}
          className="rounded-md px-3.5 py-2 text-[13px] font-semibold text-[#F5F1E8] transition-colors hover:bg-[#168A6C] sm:px-4"
          style={{ background: "#0F6E56" }}
        >
          Revisar mi turno
        </a>
      </div>
    </nav>
  );
}
