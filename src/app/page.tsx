// src/app/page.tsx
//
// Portada, diseño A (D-ING-9): blanco, degradado de la marca y una muestra de la
// revisión al lado del título. Es un componente de servidor para que el blog
// quede en el HTML que lee Google.
import type { Metadata } from "next";
import Link from "next/link";
import RevisionMuestra from "@/components/RevisionMuestra";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import Suscripcion from "@/components/Suscripcion";
import { type BlogPost, getBlogPosts } from "@/lib/notion-blog";
import { URL_REVISAR } from "@/lib/sitio";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: "dotaciones.cl — Turnos legales y dotación de personal en Chile",
  },
  description:
    "Revisa gratis si tu planilla de turnos cumple el Código del Trabajo, divide horarios y calcula cuánta gente necesitas con la jornada de 42 horas.",
  alternates: { canonical: "https://dotaciones.cl" },
};

const herramientas = [
  {
    icono: "✓",
    titulo: "Revisa si tu turno es legal",
    texto:
      "Pega tu planilla del mes desde Excel y te marcamos, persona por persona, lo que no cumple, con la norma que lo dice.",
    href: URL_REVISAR,
  },
  {
    icono: "⟷",
    titulo: "Divide un horario en turnos",
    texto:
      "24 horas en 3, la noche en 2. Repártelo entre tu equipo y revisa si el resultado cumple la ley.",
    href: "/dividir-turnos",
  },
  {
    icono: "∑",
    titulo: "Calcula cuánta gente necesitas",
    texto:
      "Las combinaciones de contratos (completos, part time, 5x2, 6x1) que cubren tu operación, con ausentismo.",
    href: "/calculadora",
  },
  {
    icono: "✚",
    titulo: "Dotación hospitalaria SAN",
    texto:
      "Personal del Servicio de Alimentación y Nutrición según la orientación técnica del Minsal.",
    href: "/san",
  },
];

const pasos = [
  [
    "Pega tu planilla",
    "Copia desde Excel la fila de los días y las filas de tu gente.",
  ],
  [
    "Te marcamos lo que no cumple",
    "Días seguidos, descanso entre jornadas, domingos libres y horas extra.",
  ],
  [
    "Corrige con la norma a la vista",
    "Cada problema explica en palabras simples qué regla rompe.",
  ],
];

async function articulos(): Promise<BlogPost[]> {
  try {
    return (await getBlogPosts()).slice(0, 4);
  } catch (e) {
    console.error("portada: no se pudo leer el blog", String(e));
    return [];
  }
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
  const posts = await articulos();
  const [destacado, ...resto] = posts;

  return (
    <div className="fuente-a min-h-screen bg-white text-slate-900">
      <SiteNav />

      <main>
        {/* ── Portada ── */}
        <header className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="degradado-marca absolute -top-48 right-[-15%] h-[560px] w-[560px] rounded-full opacity-25 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-5 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[12.5px] font-semibold text-[#5B4BEA]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6D5EFC]" />
                Actualizado a la jornada de 42 horas
              </span>
              <h1 className="mt-5 text-[42px] font-extrabold leading-[1.04] tracking-tight sm:text-[58px]">
                Turnos que{" "}
                <span className="texto-degradado">cumplen la ley</span>, sin
                adivinar.
              </h1>
              <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-slate-600">
                Revisa tu planilla contra el Código del Trabajo, divide horarios
                y calcula cuánta gente necesitas. Herramientas gratuitas,
                pensadas para quien arma los turnos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={URL_REVISAR}
                  className="degradado-marca rounded-full px-7 py-3.5 text-center text-[15px] font-bold text-white shadow-lg shadow-indigo-500/30 transition-transform hover:-translate-y-0.5"
                >
                  Revisar mi turno gratis →
                </a>
                <Link
                  href="#herramientas"
                  className="rounded-full border border-slate-300 px-7 py-3.5 text-center text-[15px] font-semibold hover:border-slate-400"
                >
                  Ver herramientas
                </Link>
              </div>
              <p className="mt-4 text-[13px] text-slate-500">
                Sin registro · tu planilla no se guarda
              </p>
            </div>
            <div className="lg:pl-6">
              <RevisionMuestra />
            </div>
          </div>
        </header>

        {/* ── Herramientas ── */}
        <section id="herramientas" className="scroll-mt-16 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-5">
            <h2 className="text-[32px] font-extrabold tracking-tight">
              Herramientas gratuitas
            </h2>
            <p className="mt-2 text-[16px] text-slate-600">
              Cada una responde una pregunta concreta.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {herramientas.map((h) => (
                <Enlace
                  key={h.titulo}
                  href={h.href}
                  className="group flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="degradado-marca flex h-11 w-11 items-center justify-center rounded-xl text-[20px] font-bold text-white">
                    {h.icono}
                  </div>
                  <h3 className="mt-5 text-[17px] font-bold">{h.titulo}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-600">
                    {h.texto}
                  </p>
                  <span className="mt-5 text-[14px] font-semibold text-[#5B4BEA]">
                    Abrir →
                  </span>
                </Enlace>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cómo funciona la revisión ── */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-5">
            <h2 className="text-[32px] font-extrabold tracking-tight">
              Cómo funciona la revisión
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {pasos.map(([t, d], i) => (
                <li key={t} className="rounded-2xl p-6 ring-1 ring-slate-200">
                  <span className="texto-degradado text-[40px] font-extrabold leading-none">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 text-[17px] font-bold">{t}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">
                    {d}
                  </p>
                </li>
              ))}
            </ol>
            <a
              href={URL_REVISAR}
              className="mt-8 inline-block rounded-full bg-slate-900 px-6 py-3 text-[15px] font-semibold text-white hover:bg-slate-700"
            >
              Probar con mi planilla →
            </a>
          </div>
        </section>

        {/* ── Blog ── */}
        {destacado && (
          <section className="border-t border-slate-200 py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-[32px] font-extrabold tracking-tight">
                    Blog
                  </h2>
                  <p className="mt-2 text-[16px] text-slate-600">
                    Normativa, opinión y casos sobre turnos y dotación en Chile.
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="hidden text-[14px] font-semibold text-[#5B4BEA] sm:inline"
                >
                  Todo el blog →
                </Link>
              </div>
              <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <Link
                  href={`/blog/${destacado.slug}`}
                  className="degradado-marca flex flex-col rounded-3xl p-8 text-white transition-transform hover:-translate-y-1"
                >
                  <span className="self-start rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold">
                    {destacado.category}
                  </span>
                  <h3 className="mt-6 text-[26px] font-extrabold leading-tight sm:text-[30px]">
                    {destacado.title}
                  </h3>
                  <p className="mt-4 text-white/85">{destacado.excerpt}</p>
                  <span className="mt-8 font-semibold">
                    Leer · {destacado.readTime} →
                  </span>
                </Link>
                <div className="divide-y divide-slate-200">
                  {resto.map((p) => (
                    <Link
                      key={p.id}
                      href={`/blog/${p.slug}`}
                      className="group block py-5 first:pt-0"
                    >
                      <span className="text-[12px] font-bold uppercase tracking-wide text-[#5B4BEA]">
                        {p.category}
                      </span>
                      <h3 className="mt-1 text-[17px] font-bold leading-snug group-hover:text-[#5B4BEA]">
                        {p.title}
                      </h3>
                      <span className="text-[13px] text-slate-500">
                        {p.readTime} de lectura
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href="/blog"
                className="mt-8 inline-block text-[14px] font-semibold text-[#5B4BEA] sm:hidden"
              >
                Todo el blog →
              </Link>
            </div>
          </section>
        )}

        {/* ── Suscripción ── */}
        <section className="px-4 pb-20 sm:px-5">
          <div className="degradado-marca mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl px-6 py-10 text-white sm:px-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[26px] font-extrabold leading-tight">
                Lo nuevo en turnos y jornada, en tu correo
              </h2>
              <p className="mt-2 text-white/85">
                Cambios de la ley, dictámenes y artículos nuevos. Sin spam.
              </p>
            </div>
            <Suscripcion oscuro />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
