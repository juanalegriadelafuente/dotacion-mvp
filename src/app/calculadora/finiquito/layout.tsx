import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Calculadora de finiquito Chile 2026 | dotaciones.cl",
  description:
    "Calcula tu finiquito gratis: indemnización por años, aviso previo, feriado proporcional y reserva de derechos. Indefinido, plazo fijo y obra/faena.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}