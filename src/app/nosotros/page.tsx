// src/app/nosotros/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { URL_REVISAR } from "@/lib/sitio";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "dotaciones.cl es de Nexwork SpA, empresa chilena de optimización de capital humano. Herramientas gratuitas de turnos y dotación según la ley laboral chilena.",
  alternates: { canonical: "https://dotaciones.cl/nosotros" },
};

const principios = [
  {
    titulo: "Herramientas que responden",
    texto:
      "Un artículo explica que hay que dar dos domingos libres al mes. No te dice si tu planilla los da. Nuestras herramientas calculan con tus datos y te contestan sobre tu caso.",
  },
  {
    titulo: "La norma a la vista",
    texto:
      "Cada regla de la revisión de turnos indica la norma que la respalda. Cuando la ley cambia (como la jornada de 42 horas en abril de 2026, o la de 40 horas en abril de 2028) se actualiza en un solo lugar.",
  },
  {
    titulo: "Tu planilla no se queda",
    texto:
      "La revisión de turnos no guarda la planilla que pegas: entra, se revisa y sale el resultado. Si dejas tu correo en una calculadora, se trata según nuestra política de privacidad.",
  },
];

export default function Nosotros() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#E8ECEF]">
      <SiteNav />
      <main className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-[760px]">
          <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#168A6C]">
            Quiénes somos
          </p>
          <h1
            className="text-[clamp(34px,5vw,52px)] leading-[1.05]"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Turnos y dotación, dentro de la ley y sin adivinar
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-[#E8ECEF]/75">
            dotaciones.cl es un sitio de{" "}
            <strong className="text-[#E8ECEF]">Nexwork SpA</strong>, empresa
            chilena de optimización de capital humano. Hacemos{" "}
            <a
              href="https://kaden.cl"
              className="text-[#168A6C] underline-offset-4 hover:underline"
            >
              Kaden
            </a>
            , un sistema que planifica turnos y dotaciones con optimización
            matemática y con la ley laboral chilena incorporada. Aquí
            publicamos, gratis, las herramientas y guías que sirven a cualquier
            empresa que arma turnos.
          </p>

          <div className="mt-12 space-y-8">
            {principios.map((p) => (
              <div key={p.titulo} className="border-l-2 border-[#0F6E56] pl-5">
                <h2 className="text-[18px] font-semibold">{p.titulo}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#E8ECEF]/70">
                  {p.texto}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 rounded-lg border border-[#E8ECEF]/12 bg-[#0F2436] p-5 text-[14px] leading-relaxed text-[#E8ECEF]/65">
            Las herramientas orientan y no reemplazan la asesoría legal. La
            responsabilidad de los turnos y contratos es de cada empleador. Si
            encuentras un error, escríbenos: lo corregimos.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={URL_REVISAR}
              className="inline-flex items-center justify-center rounded-md bg-[#0F6E56] px-6 py-3.5 text-[15px] font-semibold text-[#F5F1E8] hover:bg-[#168A6C]"
            >
              Revisar mi turno gratis
            </a>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-md border px-6 py-3.5 text-[15px] font-semibold hover:bg-[#15314A]"
              style={{ borderColor: "rgba(232,236,239,0.22)" }}
            >
              Escribirnos
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
