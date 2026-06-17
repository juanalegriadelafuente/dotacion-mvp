import { redirect } from "next/navigation";

export const metadata = {
  title: "Calculadora de dotación retail Chile | Dotaciones.cl",
  description:
    "Calcula cuántas personas necesitas en tu tienda retail según demanda por tramos horarios, turnos 6×1, 5×2 y factor de reemplazo. Normativa chilena.",
  alternates: { canonical: "https://dotaciones.cl/calculadora/retail" },
  openGraph: {
    title: "Calculadora dotación retail Chile",
    description:
      "Dimensiona tu equipo de tienda según la demanda real. Incluye turnos rotativos, contratos part-time y costo empresa.",
    url: "https://dotaciones.cl/calculadora/retail",
  },
};

export default function CalculadoraRetailPage() {
  redirect("/calculadora");
}