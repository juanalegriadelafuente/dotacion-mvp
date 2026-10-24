// src/app/blog/dotacion-hospitalaria-san/page.tsx
//
// Reescrito el 24-10-2026. La versión anterior describía un «Sistema de Análisis
// de Necesidades» para toda la dotación hospitalaria, que no corresponde: SAN es
// el Servicio de Alimentación y Nutrición. Este texto explica solo lo que la
// calculadora implementa de la orientación técnica SAN del Minsal (enero 2025),
// con un ejemplo calculado con sus mismas tablas (src/lib/san/v2025).
import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title:
    "Dotación del Servicio de Alimentación y Nutrición (SAN): cómo se calcula",
  description:
    "Cómo se calcula la dotación de un SAN hospitalario: raciones totales día (RTD), factores de complejidad, ración completa día (RCD), personal por área y nutricionistas clínicos por camas.",
  alternates: {
    canonical: "https://dotaciones.cl/blog/dotacion-hospitalaria-san",
  },
};

const serif = { fontFamily: "var(--font-instrument-serif), serif" };

const h2 = "mt-12 text-[clamp(24px,3vw,32px)] leading-tight";
const p = "mt-4 text-[16.5px] leading-[1.75] text-[#E8ECEF]/80";
const li = "text-[16px] leading-[1.7] text-[#E8ECEF]/80";

function Tabla({
  cabeza,
  filas,
}: {
  cabeza: string[];
  filas: (string | number)[][];
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-[#E8ECEF]/12">
      <table className="w-full min-w-[480px] text-left text-[14.5px]">
        <thead className="bg-[#0F2436] text-[12px] uppercase tracking-[0.06em] text-[#7A8895]">
          <tr>
            {cabeza.map((c) => (
              <th key={c} className="px-4 py-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={String(f[0])} className="border-t border-[#E8ECEF]/8">
              {f.map((c, i) => (
                <td
                  // biome-ignore lint/suspicious/noArrayIndexKey: columnas fijas de una tabla estática
                  key={i}
                  className={`px-4 py-2.5 ${i === 0 ? "font-semibold" : "text-[#E8ECEF]/80"}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ArticuloSAN() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#E8ECEF]">
      <SiteNav />
      <main className="px-4 py-12 sm:px-10 sm:py-16">
        <article className="mx-auto max-w-[760px]">
          <Link
            href="/blog"
            className="text-[12px] uppercase tracking-[0.1em] text-[#E8ECEF]/45 hover:text-[#E8ECEF]"
          >
            ← Volver a las guías
          </Link>
          <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#168A6C]">
            Salud · actualizado el 24-10-2026
          </p>
          <h1
            className="mt-3 text-[clamp(32px,5vw,48px)] leading-[1.06]"
            style={serif}
          >
            Dotación del Servicio de Alimentación y Nutrición (SAN): cómo se
            calcula
          </h1>
          <p
            className="mt-5 text-[19px] italic leading-relaxed text-[#E8ECEF]/70"
            style={serif}
          >
            El SAN es la unidad del hospital o la clínica que produce y
            distribuye la alimentación de los pacientes y, cuando hay casino, la
            de los funcionarios. Su dotación no se estima a ojo: se calcula a
            partir de las raciones que produce, la complejidad del proceso y las
            camas que atiende.
          </p>

          <div className="mt-8 flex flex-col items-start gap-3 rounded-lg border border-[#0F6E56]/40 bg-[#0F6E56]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[15px]">
              ¿Prefieres calcularlo directo con tus datos?
            </span>
            <Link
              href="/san"
              className="rounded-md bg-[#0F6E56] px-5 py-2.5 text-[14px] font-semibold text-[#F5F1E8] hover:bg-[#168A6C]"
            >
              Abrir la calculadora SAN →
            </Link>
          </div>

          <h2 className={h2} style={serif}>
            La referencia: la orientación técnica SAN
          </h2>
          <p className={p}>
            El método que se describe aquí, y que usa la calculadora de
            dotaciones.cl, sigue la orientación técnica para Servicios de
            Alimentación y Nutrición del Ministerio de Salud en su versión de
            enero de 2025. Tiene cuatro pasos: medir la producción (RTD),
            ajustarla por complejidad (RCD), convertirla en personal por área y
            sumar a los nutricionistas clínicos según las camas.
          </p>

          <h2 className={h2} style={serif}>
            1. Raciones totales día (RTD)
          </h2>
          <p className={p}>
            La RTD es el total de raciones que el SAN produce en un día. Se
            suman las raciones de cada tiempo de comida (desayuno, colaciones,
            almuerzo, once y cena), ponderadas por un{" "}
            <strong>coeficiente de ración (CR)</strong> que lleva cada tiempo de
            comida a una medida comparable. Se calcula por separado para los
            pacientes y para el casino de funcionarios, porque cada una se
            distribuye distinto.
          </p>

          <h2 className={h2} style={serif}>
            2. Factores de complejidad y ración completa día (RCD)
          </h2>
          <p className={p}>
            No todos los SAN producen igual. La RCD ajusta la RTD con{" "}
            <strong>factores de complejidad (FC)</strong>. Los factores no se
            multiplican entre sí: se suman sus excedentes sobre 1 (FC total = 1
            + la suma de cada FC menos 1), y la RCD es la RTD por ese FC total.
          </p>
          <Tabla
            cabeza={["Factor", "Situación", "FC"]}
            filas={[
              [
                "Equipamiento",
                "Tiene lavavajillas, hornos combinados y marmitas automáticas",
                "1,0",
              ],
              ["", "Tiene al menos uno de ellos", "1,1"],
              ["", "No tiene ninguno", "1,2"],
              [
                "Líneas adicionales de producción",
                "0 a 29 raciones adicionales (la mayor entre almuerzo y cena)",
                "1,0",
              ],
              [" ", "30 a 59", "1,1"],
              ["  ", "60 a 89", "1,2"],
              ["   ", "90 a 120", "1,3"],
              [
                "Materia prima vegetal sin procesar",
                "Menos de 30 % (sin contar fruta natural)",
                "1,0",
              ],
              ["    ", "30 % o más", "1,1"],
            ]}
          />
          <p className={p}>
            La RCD también define la complejidad de la Unidad Central de
            Producción (UCP): <strong>mínima</strong> bajo 150,{" "}
            <strong>mediana</strong> entre 150 y 299, y <strong>máxima</strong>{" "}
            desde 300.
          </p>

          <h2 className={h2} style={serif}>
            3. Personal de la Unidad Central de Producción
          </h2>
          <p className={p}>
            Cada área tiene una razón de personas por raciones que cambia según
            el tramo de producción. Recepción y almacenamiento, producción y
            lavado se calculan sobre la RCD; la distribución a pacientes y al
            casino, sobre la RTD de cada uno. Cada área se expresa con un
            decimal y el total de la UCP se redondea al entero, con un mínimo de
            3 personas.
          </p>

          <h2 className={h2} style={serif}>
            4. Nutricionistas clínicos
          </h2>
          <p className={p}>
            Los nutricionistas clínicos se calculan por camas, según el nivel de
            cuidado: <strong>uno cada 32 camas básicas</strong>,{" "}
            <strong>uno cada 24 camas medias</strong> y{" "}
            <strong>uno cada 16 camas críticas</strong>.
          </p>

          <h2 className={h2} style={serif}>
            Un ejemplo completo
          </h2>
          <p className={p}>
            Un hospital produce 450 raciones al día para pacientes y 150 para el
            casino (RTD total de 600). Tiene algunos equipos automatizados (FC
            1,1) y el 35 % de su materia prima vegetal llega sin procesar (FC
            1,1). Tiene 120 camas básicas, 48 medias y 16 críticas.
          </p>
          <ul className="mt-4 list-disc space-y-1.5 pl-6">
            <li className={li}>FC total = 1 + 0,1 + 0,1 = 1,2</li>
            <li className={li}>
              RCD = 600 × 1,2 = 720 → UCP de complejidad máxima
            </li>
          </ul>
          <Tabla
            cabeza={["Área", "Base", "Razón", "Personas"]}
            filas={[
              ["Recepción y almacenamiento", "RCD 720", "1:150", "4,8"],
              ["Producción", "RCD 720", "1:50", "14,4"],
              ["Lavado", "RCD 720", "1:70", "10,3"],
              ["Distribución a pacientes", "RTD 450", "1:20", "22,5"],
              ["Distribución al casino", "RTD 150", "1:100", "1,5"],
              ["Total UCP", "", "", "53,5 → 54"],
              [
                "Nutricionistas clínicos",
                "120/32 + 48/24 + 16/16",
                "",
                "6,8 → 7",
              ],
            ]}
          />
          <p className={p}>
            En total son <strong>61 jornadas completas de 44 horas</strong>, es
            decir 2.684 horas semanales. Como desde el 26 de abril de 2026 la
            jornada completa es de 42 horas (Ley 21.561), cubrir esas mismas
            horas requiere el equivalente a{" "}
            <strong>63,9 jornadas de 42 horas</strong>.
          </p>

          <h2 className={h2} style={serif}>
            Lo que este cálculo no incluye
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li className={li}>
              <strong>Reemplazos.</strong> La dotación normativa cubre la
              operación, no las vacaciones, licencias y ausencias. Para eso se
              suma un{" "}
              <Link
                href="/blog/factor-reemplazo-dotacion-chile"
                className="text-[#168A6C] underline-offset-4 hover:underline"
              >
                factor de reemplazo
              </Link>
              ; la calculadora lo permite.
            </li>
            <li className={li}>
              <strong>Cómo se reparten los turnos.</strong> Saber cuántas
              personas necesitas no dice cómo cubrir cada horario con contratos
              completos y parciales. La calculadora propone esas combinaciones.
            </li>
          </ul>

          <div className="mt-12 rounded-xl border border-[#0F6E56] bg-[#0F6E56]/10 p-6 sm:p-8">
            <h2 className="text-[22px] font-semibold">
              Calcula la dotación de tu SAN
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#E8ECEF]/75">
              Ingresa tus raciones, factores y camas. La calculadora aplica las
              mismas tablas de este artículo y propone cómo cubrir las horas con
              contratos.
            </p>
            <Link
              href="/san"
              className="mt-5 inline-block rounded-md bg-[#0F6E56] px-6 py-3 text-[15px] font-semibold text-[#F5F1E8] hover:bg-[#168A6C]"
            >
              Abrir la calculadora SAN →
            </Link>
            <p className="mt-4 text-[13px] text-[#E8ECEF]/50">
              Las herramientas orientan y no reemplazan la orientación técnica
              oficial ni la evaluación de cada establecimiento.
            </p>
          </div>

          <div className="mt-12 border-t border-[#E8ECEF]/10 pt-8 text-[14px]">
            <Link
              href="/blog/mix-contratos-jornada-parcial-chile"
              className="text-[#168A6C] hover:text-[#E8ECEF]"
            >
              ← Mix de contratos y jornada parcial
            </Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
