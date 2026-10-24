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
    <div className="fuente-a min-h-screen bg-white text-slate-900">
      <SiteNav />
      <main className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-[760px]">
          <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5B4BEA]">
            Quiénes somos
          </p>
          <h1 className="font-extrabold tracking-tight text-[clamp(34px,5vw,52px)] leading-[1.05]">
            Turnos y dotación, dentro de la ley y sin adivinar
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-slate-600">
            dotaciones.cl es un sitio de{" "}
            <strong className="text-slate-900">Nexwork SpA</strong>, empresa
            chilena de optimización de capital humano. Hacemos{" "}
            <a
              href="https://kaden.cl"
              className="text-[#5B4BEA] underline-offset-4 hover:underline"
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
              <div key={p.titulo} className="border-l-4 border-[#6D5EFC] pl-5">
                <h2 className="text-[18px] font-semibold">{p.titulo}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                  {p.texto}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-[14px] leading-relaxed text-slate-600">
            Las herramientas orientan y no reemplazan la asesoría legal. La
            responsabilidad de los turnos y contratos es de cada empleador. Si
            encuentras un error, escríbenos: lo corregimos.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={URL_REVISAR}
              className="inline-flex items-center justify-center degradado-marca rounded-full px-6 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-indigo-500/25"
            >
              Revisar mi turno gratis
            </a>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3.5 text-[15px] font-semibold hover:bg-slate-50"
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
