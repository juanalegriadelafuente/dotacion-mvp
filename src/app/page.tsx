// src/app/page.tsx
//
// Portada: herramientas primero (D-ING-4). Es un componente de servidor para que
// las guías queden en el HTML que lee Google, y no se pidan desde el navegador.
import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { type BlogPost, getBlogPosts } from "@/lib/notion-blog";
import { URL_REVISAR } from "@/lib/sitio";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: "dotaciones.cl — Turnos legales y dotación de personal en Chile",
  },
  description:
    "Revisa gratis si tu planilla de turnos cumple el Código del Trabajo y calcula cuánta gente necesitas con la jornada de 42 horas. Gratis.",
  alternates: { canonical: "https://dotaciones.cl" },
};

const herramientas = [
  {
    titulo: "Revisa si tu turno es legal",
    texto:
      "Pega tu planilla del mes desde Excel y te marcamos, persona por persona, lo que no cumple: días seguidos, descanso entre jornadas, domingos libres, horas extra. Con la norma que respalda cada regla.",
    href: URL_REVISAR,
    accion: "Revisar mi planilla",
    destacada: true,
  },
  {
    titulo: "Divide un horario en turnos",
    texto:
      "24 horas en 3 turnos, la noche en 2… Parte el horario en turnos iguales, repártelos entre tu equipo y revisa si el resultado cumple la ley.",
    href: "/dividir-turnos",
    accion: "Dividir turnos",
  },
  {
    titulo: "Calcula cuánta gente necesitas",
    texto:
      "Con la gente que necesitas en cada tramo horario, propone las combinaciones de contratos (completos, part time, 5x2, 6x1) que cubren tu operación, con ausentismo incluido.",
    href: "/calculadora",
    accion: "Abrir la calculadora",
  },
  {
    titulo: "Dotación hospitalaria (SAN)",
    texto:
      "Horas y personal del Servicio de Alimentación y Nutrición de un hospital o clínica, según camas y complejidad.",
    href: "/san",
    accion: "Calcular dotación SAN",
  },
  {
    titulo: "Calculadora de finiquito",
    texto:
      "Estima lo que corresponde pagar al término de un contrato: indemnización, vacaciones proporcionales y total.",
    href: "/calculadora/finiquito",
    accion: "Calcular finiquito",
  },
];

const guias = [
  {
    titulo: "Planificador de turnos de trabajo en Chile",
    texto:
      "Paso a paso para calcular turnos y dotación, con un ejemplo completo.",
    href: "/blog/planificador-turnos-chile",
  },
  {
    titulo: "Jornada 6x1: cómo funciona",
    texto:
      "Seis días de trabajo y uno de descanso: qué exige la ley y cuándo conviene.",
    href: "/blog/jornada-6x1-retail-chile",
  },
  {
    titulo: "Dictamen 253/21 y la jornada de 42 horas",
    texto: "Qué cambió el 26 de abril de 2026 y cómo aplicarlo en los turnos.",
    href: "/blog/dictamen-253-21-42-horas-implementacion",
  },
  {
    titulo: "Factor de reemplazo",
    texto:
      "Cuánta gente extra necesitas para cubrir vacaciones, licencias y ausencias.",
    href: "/blog/factor-reemplazo-dotacion-chile",
  },
];

async function ultimasGuias(): Promise<BlogPost[]> {
  try {
    const posts = await getBlogPosts();
    const destacadas = new Set(guias.map((g) => g.href.replace("/blog/", "")));
    return posts.filter((p) => !destacadas.has(p.slug)).slice(0, 6);
  } catch (e) {
    console.error("portada: no se pudieron leer las guías", String(e));
    return [];
  }
}

function Flecha() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14M13 6l6 6-6 6"
      />
    </svg>
  );
}

function Enlace({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return href.startsWith("http") ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default async function Home() {
  const ultimas = await ultimasGuias();

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#E8ECEF]">
      <SiteNav />

      <main>
        {/* ── Portada ── */}
        <section
          className="border-b px-4 py-16 sm:px-10 sm:py-24"
          style={{ borderColor: "rgba(232,236,239,0.10)" }}
        >
          <div className="mx-auto max-w-[1120px]">
            <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#168A6C]">
              Turnos · jornada · dotación · ley chilena
            </p>
            <h1
              className="max-w-[18ch] text-[clamp(36px,6vw,64px)] leading-[1.02] tracking-[-0.01em]"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              ¿Tu turno cumple la ley? ¿Cuánta gente necesitas?
            </h1>
            <p className="mt-6 max-w-[60ch] text-[17px] leading-relaxed text-[#E8ECEF]/70">
              Herramientas gratuitas que responden con tus datos, no con teoría:
              revisa tu planilla contra el Código del Trabajo y calcula la
              dotación que cubre tu operación con la jornada de 42 horas.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={URL_REVISAR}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0F6E56] px-6 py-3.5 text-[15px] font-semibold text-[#F5F1E8] transition-colors hover:bg-[#168A6C]"
              >
                Revisar mi turno gratis <Flecha />
              </a>
              <Link
                href="/calculadora"
                className="inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3.5 text-[15px] font-semibold text-[#E8ECEF] transition-colors hover:bg-[#15314A]"
                style={{ borderColor: "rgba(232,236,239,0.22)" }}
              >
                Calcular mi dotación
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-[#7A8895]">
              Gratis. Revisar tu turno no pide registro ni guarda tu planilla.
            </p>
          </div>
        </section>

        {/* ── Herramientas ── */}
        <section
          id="herramientas"
          className="scroll-mt-16 px-4 py-16 sm:px-10 sm:py-20"
        >
          <div className="mx-auto max-w-[1120px]">
            <h2
              className="text-[clamp(28px,3.6vw,40px)] leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Herramientas
            </h2>
            <p className="mt-2 text-[15px] text-[#E8ECEF]/60">
              Cada una contesta una pregunta concreta. Todas gratis.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {herramientas.map((h) => (
                <Enlace
                  key={h.titulo}
                  href={h.href}
                  className={`group flex flex-col justify-between rounded-lg border p-6 transition-colors sm:p-7 ${
                    h.destacada
                      ? "border-[#0F6E56] bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20"
                      : "border-[#E8ECEF]/12 bg-[#0F2436] hover:border-[#E8ECEF]/25"
                  }`}
                >
                  <div>
                    <h3 className="text-[20px] font-semibold leading-snug">
                      {h.titulo}
                    </h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-[#E8ECEF]/70">
                      {h.texto}
                    </p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-[#168A6C] group-hover:text-[#E8ECEF]">
                    {h.accion} <Flecha />
                  </span>
                </Enlace>
              ))}
            </div>
          </div>
        </section>

        {/* ── Guías más leídas ── */}
        <section
          className="border-t px-4 py-16 sm:px-10 sm:py-20"
          style={{ borderColor: "rgba(232,236,239,0.10)" }}
        >
          <div className="mx-auto max-w-[1120px]">
            <h2
              className="text-[clamp(28px,3.6vw,40px)] leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Las guías más leídas
            </h2>
            <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[#E8ECEF]/10 bg-[#E8ECEF]/10 sm:grid-cols-2">
              {guias.map((g) => (
                <Link
                  key={g.href}
                  href={g.href}
                  className="bg-[#0D1B2A] p-6 transition-colors hover:bg-[#0F2436]"
                >
                  <h3 className="text-[17px] font-semibold leading-snug">
                    {g.titulo}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#E8ECEF]/60">
                    {g.texto}
                  </p>
                </Link>
              ))}
            </div>

            {ultimas.length > 0 && (
              <>
                <h3 className="mt-14 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7A8895]">
                  Más guías
                </h3>
                <ul className="mt-4 divide-y divide-[#E8ECEF]/10 border-y border-[#E8ECEF]/10">
                  {ultimas.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/blog/${p.slug}`}
                        className="flex flex-col gap-1 py-4 transition-colors hover:text-[#168A6C] sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                      >
                        <span className="text-[15.5px]">{p.title}</span>
                        <span className="shrink-0 text-[12px] text-[#7A8895]">
                          {p.category}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-[#168A6C] hover:text-[#E8ECEF]"
            >
              Ver todas las guías <Flecha />
            </Link>
          </div>
        </section>

        {/* ── Quiénes somos ── */}
        <section
          className="border-t px-4 py-16 sm:px-10"
          style={{ borderColor: "rgba(232,236,239,0.10)" }}
        >
          <div className="mx-auto grid max-w-[1120px] gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <p className="max-w-[62ch] text-[16px] leading-relaxed text-[#E8ECEF]/75">
              dotaciones.cl es de{" "}
              <strong className="text-[#E8ECEF]">Nexwork SpA</strong>, empresa
              chilena de optimización de capital humano. Las reglas legales que
              usa la revisión de turnos son las mismas del motor de
              planificación de Kaden, y cada regla indica la norma que la
              respalda.
            </p>
            <div className="flex gap-3">
              <Link
                href="/nosotros"
                className="rounded-md border px-5 py-3 text-[14px] font-semibold hover:bg-[#15314A]"
                style={{ borderColor: "rgba(232,236,239,0.22)" }}
              >
                Quiénes somos
              </Link>
              <Link
                href="/contacto"
                className="rounded-md bg-[#0F2436] px-5 py-3 text-[14px] font-semibold hover:bg-[#15314A]"
              >
                Contacto
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
