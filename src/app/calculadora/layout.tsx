import type { Metadata } from "next";

// La calculadora es una página de cliente: su título para Google vive acá.
export const metadata: Metadata = {
  title: "Calculadora de turnos de trabajo: cuántas personas contratar",
  description:
    "Calcula gratis cuántas personas necesitas y con qué contratos: dinos la demanda de cada tramo del día y un optimizador te da la combinación más barata y la de menos personas, con la hora de entrada de cada turno.",
  alternates: { canonical: "https://dotaciones.cl/calculadora" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
