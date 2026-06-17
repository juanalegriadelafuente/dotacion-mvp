import { redirect } from "next/navigation";

export const metadata = {
  title: "Calculadora SAN Hospitalaria Chile | Dotaciones.cl",
  description:
    "Calcula la dotación normativa del Servicio de Alimentación y Nutrición según OT-SAN MINSAL. RTD, RCD, factores de complejidad y mix de contratos.",
  alternates: { canonical: "https://dotaciones.cl/san" },
  openGraph: {
    title: "Calculadora SAN Hospitalaria Chile",
    description:
      "Normativa MINSAL → perfil operacional → mix de contratos. Tres etapas integradas para hospitales y clínicas chilenas.",
    url: "https://dotaciones.cl/calculadora/san",
  },
};

export default function CalculadoraSanRedirectPage() {
  redirect("/san");
}