// src/app/kit-turnos/page.tsx
//
// La página de venta del Kit Turnos Legales (D-ING-12), con el diseño de la
// maqueta aprobada por Juan el 30-10-2026. El precio, la disponibilidad y el
// aviso de retracto vienen de Kaden: acá no se escribe ningún precio.
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { URL_REVISAR } from "@/lib/sitio";
import { enPesos, KIT_TURNOS, verProducto } from "@/lib/tienda";
import Compra from "./Compra";
import MuestraPlanilla from "./MuestraPlanilla";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kit Turnos Legales: planilla Excel de turnos con alertas + guía",
  description:
    "Planilla Excel para armar turnos que avisa días seguidos, horas de la semana, domingos libres y descanso entre turnos, más una guía con la ley chilena vigente. Descarga inmediata.",
  alternates: { canonical: "https://dotaciones.cl/kit-turnos" },
};

/** Fecha de la ley que describen la guía y la planilla. */
const LEY_AL = "30-10-2026";

const ALERTAS = [
  "más de 6 días seguidos, contando el saliente de cada noche",
  "una semana que pasa la jornada pactada o el tope legal",
  "menos de 2 domingos libres en el mes",
  "descansos de menos de 12 horas entre un turno y otro",
];

const CAPITULOS = [
  "Las seis reglas clave",
  "Horas de la semana",
  "Días seguidos",
  "Horas por día y 4x3",
  "Descanso entre turnos",
  "Domingos y feriados",
  "Horas extra y part time",
  "Esquemas que funcionan",
  "¿Cuánta gente necesitas?",
  "Cómo usar la planilla",
  "Lista de revisión",
  "Errores frecuentes",
];

const REGLAS = [
  [
    "Horas de la semana",
    "Hasta 42 horas (40 desde el 26-04-2028). La colación no se cuenta.",
    "Código del Trabajo, art. 22; Ley 21.561",
  ],
  [
    "Días seguidos",
    "Nadie trabaja más de 6 días seguidos. El saliente de una noche no es libre.",
    "Código del Trabajo, art. 28",
  ],
  [
    "Horas por día",
    "La jornada ordinaria no pasa de 10 horas en un día.",
    "Código del Trabajo, art. 28",
  ],
  [
    "Descanso entre turnos",
    "Entre un turno y el siguiente, un descanso al menos igual a lo trabajado.",
    "Dirección del Trabajo, Ord. 5321 de 2017",
  ],
  [
    "Domingos",
    "En comercio y servicios, al menos 2 domingos libres al mes.",
    "Código del Trabajo, art. 38",
  ],
  [
    "Horas extra",
    "Máximo 2 al día, pactadas por escrito y pagadas con 50 % de recargo.",
    "Código del Trabajo, art. 32",
  ],
];

const PASOS = [
  ["Pagas con Flow", "Tarjeta de débito o crédito. No necesitas crear cuenta."],
  [
    "Te llega el enlace",
    "En pantalla y a tu correo. Vale 30 días y hasta 5 descargas.",
  ],
  [
    "Descargas el .zip",
    "La planilla y la guía en PDF. Las usas desde el mes que viene.",
  ],
];

const PREGUNTAS = [
  {
    p: "¿Sirve para la jornada de 42 horas?",
    r: "Sí. La planilla toma el tope legal vigente y la jornada pactada de cada persona. La guía explica qué cambia con las 40 horas desde el 26-04-2028.",
  },
  {
    p: "¿Necesito saber Excel?",
    r: "No. Escribes un código por día (M, T, N…) y la planilla hace las cuentas. Los topes legales vienen en una hoja bloqueada, con su artículo.",
  },
  {
    p: "¿Reemplaza a un abogado?",
    r: "No. Es la ley vigente explicada para armar turnos. No conoce tu contrato, tu convenio colectivo ni los pactos de tu empresa.",
  },
  {
    p: "¿Qué no revisa la planilla?",
    r: "La colación dentro de la jornada, el 4x3 y los pactos de cada contrato. Para eso, pega la grilla en el verificador de Kaden.",
  },
  {
    p: "¿Qué pasa si el archivo no me llega o viene dañado?",
    r: "Escríbenos a hola@kaden.cl con el correo que usaste y te lo reponemos o te devolvemos el dinero.",
  },
];

export default async function KitTurnos() {
  const producto = await verProducto(KIT_TURNOS);
  const precio = producto ? enPesos(producto.precio) : null;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Kit Turnos Legales",
      description: metadata.description,
      brand: { "@type": "Brand", name: "dotaciones.cl" },
      ...(producto?.disponible && {
        offers: {
          "@type": "Offer",
          price: producto.precio,
          priceCurrency: "CLP",
          availability: "https://schema.org/InStock",
          url: "https://dotaciones.cl/kit-turnos",
        },
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PREGUNTAS.map((q) => ({
        "@type": "Question",
        name: q.p,
        acceptedAnswer: { "@type": "Answer", text: q.r },
      })),
    },
  ];

  return (
    <div className="noche">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD estático, sin datos del usuario
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav />
      <main>
        {/* Portada */}
        <section className="envase flex flex-wrap items-center gap-12 pt-16 pb-10">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5">
            <p className="text-[15px] font-medium text-[#2BB58D]">
              Kit Turnos Legales · planilla Excel + guía
            </p>
            <h1 className="titular text-[clamp(40px,6vw,68px)] leading-[1.02]">
              Arma el mes de turnos <em className="text-[#2BB58D]">sin</em> los
              errores que terminan en multa.
            </h1>
            <p className="max-w-[560px] text-[19px] leading-relaxed text-[#C3CCD5]">
              Una planilla que te avisa mientras armas: días seguidos, horas de
              la semana, domingos libres y descanso entre turnos. Y una guía
              corta, con el artículo de la ley al lado de cada regla. Sin humo.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#comprar"
                className="inline-flex min-h-[48px] items-center rounded bg-[#2BB58D] px-6 text-[16px] font-semibold !text-[#06231A] hover:bg-[#3FCFA4]"
              >
                {precio ? `Comprar el kit · ${precio}` : "Ver el kit"}
              </a>
              <a
                href="#que-trae"
                className="inline-flex min-h-[48px] items-center rounded border border-white/25 px-5 text-[16px] font-medium hover:border-[#2BB58D] hover:text-[#2BB58D]"
              >
                Ver qué trae
              </a>
            </div>
            <p className="text-[14px] text-[#9AA8B6]">
              Pago único, IVA incluido. Descarga inmediata. Ley vigente al{" "}
              {LEY_AL}.
            </p>
          </div>
          <div className="min-w-0 flex-[1_1_560px]">
            <MuestraPlanilla />
          </div>
        </section>

        {/* Qué trae */}
        <section id="que-trae" className="envase scroll-mt-20 py-14">
          <h2 className="titular mb-7 text-[clamp(32px,4vw,44px)]">Qué trae</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <article className="flex flex-col gap-3.5 rounded-md border border-white/10 bg-[#112538] p-7">
              <h3 className="text-[22px] font-semibold">
                La planilla{" "}
                <span className="font-normal text-[#9AA8B6]">(.xlsx)</span>
              </h3>
              <p className="leading-relaxed text-[#C3CCD5]">
                Escribes el código del turno en cada día y la columna de alertas
                te dice qué está mal, persona por persona:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {ALERTAS.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="leading-relaxed text-[#C3CCD5]">
                Además: las horas al cierre de cada semana, la semana anterior
                al mes (para que las rachas no se reinicien el día 1) y una hoja
                de cobertura que pinta en rojo las horas donde te falta gente.
              </p>
            </article>
            <article className="flex flex-col gap-3.5 rounded-md border border-white/10 bg-[#112538] p-7">
              <h3 className="text-[22px] font-semibold">
                La guía{" "}
                <span className="font-normal text-[#9AA8B6]">
                  «Turnos legales en Chile»
                </span>
              </h3>
              <p className="leading-relaxed text-[#C3CCD5]">
                Para el dueño, el administrador o el jefe de turno. Doce
                capítulos cortos, con ejemplos de locales y la norma al lado:
              </p>
              <ol className="list-decimal gap-x-6 space-y-1 pl-6 sm:columns-2">
                {CAPITULOS.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        {/* Las seis reglas */}
        <section className="envase py-14">
          <div className="mb-7 flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <h2 className="titular text-[clamp(32px,4vw,44px)]">
              Las seis reglas que más multas generan
            </h2>
            <span className="mano text-[24px] text-[#FF6B6B]">
              gratis, aunque no compres
            </span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {REGLAS.map(([titulo, texto, norma], i) => (
              <div
                key={titulo}
                className="flex flex-col gap-2 bg-[#0F2133] p-6"
              >
                <span className="titular text-[34px] leading-none text-[#2BB58D]">
                  §{i + 1}
                </span>
                <h3 className="text-[18px] font-semibold">{titulo}</h3>
                <p className="leading-normal text-[#C3CCD5]">{texto}</p>
                <p className="text-[13px] text-[#9AA8B6]">{norma}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cómo se compra */}
        <section className="envase py-14">
          <h2 className="titular mb-7 text-[clamp(32px,4vw,44px)]">
            Cómo se compra
          </h2>
          <ol className="grid gap-5 sm:grid-cols-3">
            {PASOS.map(([t, d], i) => (
              <li key={t} className="flex flex-col gap-2">
                <span className="titular text-[40px] text-[#2BB58D]">
                  {i + 1}
                </span>
                <h3 className="text-[18px] font-semibold">{t}</h3>
                <p className="leading-normal text-[#C3CCD5]">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Compra */}
        <section id="comprar" className="envase scroll-mt-20 py-14">
          <div className="flex flex-wrap items-center gap-8 rounded-md border border-[#2BB58D] bg-[#112538] p-6 sm:p-9">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
              <h2 className="titular text-[40px] leading-tight">
                Kit Turnos Legales
              </h2>
              <p className="leading-normal text-[#C3CCD5]">
                Planilla Excel con alertas + guía «Turnos legales en Chile»
                (PDF). Ley vigente al {LEY_AL}.
              </p>
              {producto?.aviso_retracto && (
                <p className="rounded border border-white/15 p-3 text-[13px] leading-normal text-[#C3CCD5]">
                  <strong className="text-[#EEF1F4]">
                    Sin derecho a retracto.
                  </strong>{" "}
                  {producto.aviso_retracto}
                </p>
              )}
            </div>
            <div className="min-w-0 flex-[0_1_340px]">
              <Compra producto={producto} />
            </div>
          </div>
        </section>

        {/* Revisión */}
        <section className="envase pt-6 pb-14">
          <div className="flex flex-wrap items-center gap-6 border-t border-white/10 pt-10">
            <div className="min-w-0 flex-[1_1_520px]">
              <h2 className="titular mb-2.5 text-[34px]">
                ¿Ya tienes el turno armado?
              </h2>
              <p className="max-w-[640px] leading-relaxed text-[#C3CCD5]">
                Pégalo en el verificador: gratis te dice si cumple. El informe
                completo, con cada problema, la norma y cómo corregirlo, viene
                en PDF. Revisa también lo que la planilla no ve: colación, 4x3 y
                pactos.
              </p>
            </div>
            <a
              href={URL_REVISAR}
              className="inline-flex min-h-[48px] items-center rounded border border-white/25 px-5 text-[16px] font-medium hover:border-[#2BB58D] hover:text-[#2BB58D]"
            >
              Revisar mi turno gratis
            </a>
          </div>
        </section>

        {/* Preguntas */}
        <section className="envase max-w-[860px] pt-6 pb-20">
          <h2 className="titular mb-5 text-[clamp(32px,4vw,44px)]">
            Preguntas
          </h2>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {PREGUNTAS.map((q) => (
              <details key={q.p} className="py-4">
                <summary className="cursor-pointer list-none text-[18px] font-medium marker:hidden">
                  {q.p}
                </summary>
                <p className="mt-3 leading-relaxed text-[#C3CCD5]">{q.r}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
