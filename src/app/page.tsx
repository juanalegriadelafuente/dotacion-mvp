// src/app/page.tsx
//
// Portada, diseño Noche (D-ING-10), elegido por Juan en el lienzo de diseño el
// 24-10-2026. Componente de servidor: el blog y la cuenta regresiva llegan en el
// HTML; la planilla, el divisor y el filtro del blog son islas de cliente.
import type { Metadata } from "next";
import Link from "next/link";
import BlogFiltro, { type ArticuloLista } from "@/components/noche/BlogFiltro";
import DivisorMini from "@/components/noche/DivisorMini";
import PlanillaDemo from "@/components/noche/PlanillaDemo";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import Suscripcion from "@/components/Suscripcion";
import { getBlogPosts } from "@/lib/notion-blog";
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

/** Días que faltan para el 26-04-2028, cuando la jornada baja a 40 horas (Ley 21.561). */
function diasPara40(): number {
  return Math.max(0, Math.ceil((Date.UTC(2028, 3, 26) - Date.now()) / 864e5));
}

async function articulos(): Promise<ArticuloLista[]> {
  try {
    const posts = await getBlogPosts();
    return posts.map((p, i) => ({
      id: p.id,
      n: String(posts.length - i).padStart(3, "0"),
      slug: p.slug,
      titulo: p.title,
      categoria: p.category,
      fecha: p.date,
      lectura: p.readTime,
    }));
  } catch (e) {
    console.error("portada: no se pudo leer el blog", String(e));
    return [];
  }
}

export default async function Home() {
  const lista = await articulos();
  const dias = diasPara40().toLocaleString("es-CL");
  const cinta = [
    ["42 horas", "rigen desde el 26 de abril de 2026"],
    ["40 horas", `desde el 26 de abril de 2028, en ${dias} días`],
    ["6 días", "seguidos como máximo, Art. 28"],
    ["2 domingos", "libres al mes en turnos, Art. 38"],
    ...(lista.length > 0
      ? [[`${lista.length} artículos`, "publicados desde abril de 2026"]]
      : []),
  ];

  return (
    <div className="noche">
      <div className="numeral" aria-hidden="true">
        42
      </div>
      <SiteNav />

      <main>
        <div className="envase">
          <header className="hero">
            <div>
              <h1 className="gigante entra" style={{ animationDelay: "80ms" }}>
                Tus turnos, revisados <em>sin humo</em>.
                <span className="cursor" />
              </h1>
              <p className="bajada entra" style={{ animationDelay: "260ms" }}>
                Pega tu planilla y te marcamos, persona por persona, lo que no
                cumple el Código del Trabajo. Herramientas y artículos de{" "}
                <strong>alguien que lleva 15 años armando dotaciones</strong> en
                retail, casinos, aeropuertos y salud.
              </p>
              <div
                className="acciones entra"
                style={{ animationDelay: "420ms" }}
              >
                <a className="n-boton prin" href={URL_REVISAR}>
                  Revisar mi planilla gratis
                </a>
                <Link className="n-boton" href="/dividir-turnos">
                  Dividir un turno
                </Link>
              </div>
              <p
                className="nota-chica entra"
                style={{ animationDelay: "560ms" }}
              >
                Sin registro. Tu planilla no se guarda.
              </p>
            </div>
            <PlanillaDemo />
          </header>
        </div>

        <div className="cinta" aria-hidden="true">
          <div className="rio">
            {[...cinta, ...cinta].map(([b, s], i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: la cinta repite sus datos
              <span key={i}>
                <b>{b}</b> {s} <i>✳</i>
              </span>
            ))}
          </div>
        </div>

        <div className="envase">
          <section id="herramientas" className="seccion revela">
            <div className="titulo">
              <h2>Herramientas</h2>
              <p>
                Gratis. Cada una contesta una pregunta que hoy se resuelve a
                ojo.
              </p>
            </div>
            <div className="mosaico">
              <div className="t ancha">
                <div className="flex flex-col gap-[14px]">
                  <h3>Divide un turno en partes iguales</h3>
                  <p>
                    Mueve el control: las 24 horas se reparten solas. En la
                    herramienta completa agregas a tu equipo, armas la rotación
                    y revisas si es legal.
                  </p>
                  <Link className="ir" href="/dividir-turnos">
                    Abrir el divisor
                  </Link>
                </div>
                <DivisorMini />
              </div>
              <a className="t" href={URL_REVISAR}>
                <h3>¿Tu turno cumple la ley?</h3>
                <p>
                  Pega el mes desde Excel. Días seguidos, descanso entre turnos,
                  domingos libres y horas de la semana, con la norma de cada
                  regla.
                </p>
                <span className="ir">Revisar mi planilla</span>
              </a>
              <Link className="t" href="/calculadora">
                <h3>Cuánta gente necesitas</h3>
                <p>
                  Las combinaciones de contratos que cubren tu operación, con
                  ausentismo incluido.
                </p>
                <span className="ir">Calcular dotación</span>
              </Link>
              <Link className="t" href="/san">
                <span className="grande">SAN</span>
                <p>
                  Dotación del Servicio de Alimentación y Nutrición de un
                  hospital, según la orientación técnica del Minsal.
                </p>
                <span className="ir">Calcular SAN</span>
              </Link>
              <Link className="t" href="/calculadora/finiquito">
                <h3>Finiquito</h3>
                <p>
                  Indemnización, vacaciones proporcionales y el total a pagar.
                </p>
                <span className="ir">Estimar finiquito</span>
              </Link>
            </div>
          </section>

          <section className="seccion revela">
            <div className="cuenta">
              <div className="digitos">
                {dias}
                <span>d</span>
              </div>
              <div>
                <h3>para que la jornada baje a 40 horas</h3>
                <p>
                  El 26 de abril de 2028 termina la rebaja de la Ley 21.561. Hoy
                  rigen 42 horas.{" "}
                  <span className="resaltado">
                    Los turnos que cumplen hoy pueden dejar de cumplir ese día
                  </span>
                  , y la dotación que alcanza hoy puede quedar corta.
                </p>
                <Link
                  className="n-boton"
                  href="/blog/ley-40-horas-turismo-flexibilizacion-turnos"
                >
                  Lo que viene con las 40 horas
                </Link>
              </div>
            </div>
          </section>

          {lista.length > 0 && (
            <section id="blog" className="seccion revela">
              <div className="titulo">
                <h2>Blog</h2>
                <p>
                  Normativa, opinión y casos sobre turnos y dotación en Chile.{" "}
                  {lista.length} artículos desde abril de 2026.
                </p>
              </div>
              <BlogFiltro articulos={lista.slice(0, 9)} />
              <Link className="n-boton mt-8" href="/blog">
                Todo el blog
              </Link>
            </section>
          )}

          <section id="autor" className="seccion revela">
            <div className="autor">
              <div>
                <p className="cita">
                  «Las reglas se cruzan entre ellas. Por eso “¿mi turno es
                  legal?” no se responde leyendo: se responde calculando.»
                </p>
                <p className="quien">
                  Juan Alegría · 15 años en dimensionamiento de personal ·
                  Nexwork SpA
                </p>
              </div>
              <div className="sus">
                <h3>Lo que cambia en la ley de turnos, en tu correo</h3>
                <p>
                  Dictámenes, cambios de jornada y artículos nuevos. Sin spam.
                </p>
                <Suscripcion oscuro />
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="mt-[110px]">
        <SiteFooter />
      </div>
    </div>
  );
}
