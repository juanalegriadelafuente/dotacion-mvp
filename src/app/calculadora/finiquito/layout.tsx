import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de finiquito Chile 2026 | dotaciones.cl",
  description: "Calcula tu finiquito paso a paso: indemnización por años, aviso previo, feriado proporcional y reserva de derechos. Gratis, sin registro.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
