// src/app/lista-revision/page.tsx
//
// La lista de revisión a cambio del correo: maqueta aprobada por Juan el
// 01-11-2026. El Kit se ofrece recién en el último correo, y solo si está a la
// venta.
import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import Formulario from "./Formulario";

export const metadata: Metadata = {
  title: "Lista de revisión de turnos: 10 preguntas antes de publicar",
  description:
    "Lista gratis de una página para revisar tu planilla antes de publicar el turno: horas, días seguidos, domingos, descansos y feriados, con la ley vigente en Chile.",
  alternates: { canonical: "https://dotaciones.cl/lista-revision" },
};

const muestra = [
  "¿Alguien suma más horas en una semana que su jornada o que las 42 horas?",
  "¿Alguien trabaja más de 6 días seguidos, contando los últimos días del mes anterior?",
  "¿Marcaste el saliente después de cada noche, sin contarlo como libre?",
  "¿Algún turno pasa de 10 horas de jornada ordinaria?",
];

export default function ListaRevision() {
  return (
    <div className="noche">
      <SiteNav />
      <main className="px-4 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-start gap-14">
          <div className="min-w-0 flex-[999_1_460px]">
            <h1 className="titular text-[clamp(40px,6vw,64px)] leading-[1.02]">
              10 preguntas antes de publicar el{" "}
              <em className="text-[#2BB58D]">turno</em>
            </h1>
            <p className="mt-5 max-w-[560px] text-[19px] leading-relaxed text-[#C3CCD5]">
              Una lista de una página para revisar tu planilla antes de que la
              vea tu equipo. Horas, días seguidos, domingos, descansos y
              feriados, con la ley vigente en Chile.
            </p>
            <p
              className="mt-5 origin-left -rotate-[1.5deg] text-[28px] text-[#FF8A8A]"
              style={{ fontFamily: "var(--font-caveat), cursive" }}
            >
              la imprimes y la pegas al lado del computador
            </p>
            <Formulario />
            <p className="mt-4 max-w-[520px] text-[13px] leading-relaxed text-[#9AA8B6]">
              Solo guardamos tu correo para esto.{" "}
              <Link href="/privacidad" className="text-[#2BB58D] underline">
                Política de privacidad
              </Link>
              .
            </p>
          </div>
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5 rounded-md bg-[#F4F1EA] p-8 text-[#16202B]">
            <h2 className="titular text-[30px] leading-[1.1]">
              Antes de publicar el turno
            </h2>
            <ul className="flex flex-col gap-3.5">
              {muestra.map((pregunta) => (
                <li
                  key={pregunta}
                  className="flex gap-3 text-[15px] leading-snug"
                >
                  <span
                    aria-hidden="true"
                    className="mt-px h-[18px] w-[18px] flex-none border-[1.5px] border-[#16202B]"
                  />
                  <span>{pregunta}</span>
                </li>
              ))}
            </ul>
            <p className="pt-1.5 text-[14px] font-semibold text-[#7A3B2E]">
              Y seis preguntas más en la lista completa
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
