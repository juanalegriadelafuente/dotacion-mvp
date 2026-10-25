// src/app/dividir-turnos/page.tsx
//
// Responde la búsqueda «dividir turnos» y sus variantes, que en Search Console
// (3 meses al 24-10-2026) sumaban ~2.100 impresiones con casi ningún clic.
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import Divisor from "./Divisor";

export const metadata: Metadata = {
  title:
    "Dividir turnos: calculadora para repartir un horario en partes iguales",
  description:
    "Divide un horario en turnos iguales (24 horas en 3 turnos de 8, la noche en 2…) y repártelos entre tu equipo. Gratis, sin registro, y con revisión legal del resultado.",
  alternates: { canonical: "https://dotaciones.cl/dividir-turnos" },
};

const ejemplos = [
  [
    "24 horas en 3 turnos",
    "08:00–16:00, 16:00–00:00 y 00:00–08:00: tres turnos de 8 horas.",
  ],
  [
    "24 horas en 4 turnos",
    "Cuatro turnos de 6 horas, por ejemplo 00:00, 06:00, 12:00 y 18:00.",
  ],
  [
    "La noche en 2 turnos",
    "De 22:00 a 06:00 son 8 horas: 22:00–02:00 y 02:00–06:00.",
  ],
  [
    "Un horario de 09:00 a 19:00 en 3",
    "10 horas en 3 turnos: con redondeo a 15 minutos quedan 09:00–12:15, 12:15–15:45 y 15:45–19:00.",
  ],
];

const preguntas = [
  {
    p: "¿Cómo divido un turno de 24 horas?",
    r: "Pon el mismo horario en «desde» y «hasta» (por ejemplo, 08:00 y 08:00) y elige en cuántos turnos lo divides. En 3 turnos son 8 horas cada uno; en 4, 6 horas; en 2, 12 horas.",
  },
  {
    p: "¿Qué pasa si el horario cruza la medianoche?",
    r: "Si «hasta» es una hora anterior a «desde» (por ejemplo, de 22:00 a 06:00), la calculadora entiende que el horario termina al día siguiente y lo divide igual.",
  },
  {
    p: "¿Cómo reparto los turnos entre mi equipo?",
    r: "Escribe los nombres, uno por línea, y cuántos días quieres planificar. Los turnos se asignan en rueda: cada día la rotación sigue donde quedó el anterior, y al final ves cuántas horas le tocan a cada persona.",
  },
  {
    p: "¿Dividir parejo hace que el turno sea legal?",
    r: "No necesariamente. Desde el 26 de abril de 2026 la jornada ordinaria máxima es de 42 horas semanales (Ley 21.561), y además cuentan los días seguidos, el descanso entre jornadas y los domingos libres. Por eso el resultado se puede copiar y revisar gratis contra el Código del Trabajo.",
  },
];

export default function DividirTurnos() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((q) => ({
      "@type": "Question",
      name: q.p,
      acceptedAnswer: { "@type": "Answer", text: q.r },
    })),
  };

  return (
    <div className="noche">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD estático, sin datos del usuario
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav />
      <main className="px-4 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-[900px]">
          <p className="mb-4 text-[12px] font-semibold text-[#2BB58D]">
            Herramienta gratuita
          </p>
          <h1 className="titular text-[clamp(32px,5vw,50px)] leading-[1.05]">
            Dividir turnos: reparte un horario en partes iguales
          </h1>
          <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-[#9AA8B6]">
            Elige el horario que hay que cubrir y en cuántos turnos lo divides.
            Si quieres, agrega los nombres de tu equipo y te armamos la rotación
            de los próximos días. Después, revisa gratis si el reparto cumple la
            ley.
          </p>

          <div className="mt-10">
            <Divisor />
          </div>

          <section className="mt-16">
            <h2 className="titular text-[clamp(26px,3.4vw,36px)]">
              Ejemplos
            </h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {ejemplos.map(([t, d]) => (
                <div
                  key={t}
                  className="rounded-2xl border border-white/10 p-5"
                >
                  <dt className="text-[16px] font-semibold">{t}</dt>
                  <dd className="mt-1.5 text-[14.5px] leading-relaxed text-[#9AA8B6]">
                    {d}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-16">
            <h2 className="titular text-[clamp(26px,3.4vw,36px)]">
              Preguntas frecuentes
            </h2>
            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {preguntas.map((q) => (
                <details key={q.p} className="group py-4">
                  <summary className="cursor-pointer list-none text-[16px] font-semibold marker:hidden">
                    {q.p}
                  </summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#9AA8B6]">
                    {q.r}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
