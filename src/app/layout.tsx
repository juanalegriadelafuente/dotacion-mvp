import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Calculadora de Dotación Retail Chile | ¿Cuántas personas necesito para mi tienda?",
  description:
    "Calcula la dotación mínima retail en Chile considerando efecto domingo, horas hombre y mix de contratos. Herramienta gratuita para operaciones y RRHH.",
  metadataBase: new URL("https://dotaciones.cl"),
  openGraph: {
    title:
      "Calculadora de Dotación Retail Chile | Efecto Domingo y Horas Hombre",
    description:
      "Herramienta gratuita para calcular cuántas personas necesitas en tu tienda retail.",
    url: "https://dotaciones.cl",
    siteName: "Dotaciones.cl",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
