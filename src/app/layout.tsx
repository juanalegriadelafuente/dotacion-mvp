// src/app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import Medicion from "@/components/Medicion";
import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Caveat,
} from "next/font/google";
import "./globals.css";
import "./noche.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// La «mano» del diseño Noche (D-ING-10): las notas en tinta roja sobre la
// planilla. Sólo para anotaciones, nunca para texto de lectura.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "dotaciones.cl — Turnos legales y dotación de personal en Chile",
    template: "%s | dotaciones.cl",
  },
  description:
    "Herramientas gratuitas para revisar si tus turnos cumplen el Código del Trabajo y calcular la dotación de personal en Chile. Guías de jornada, 6x1 y 42 horas.",
  metadataBase: new URL("https://dotaciones.cl"),
  keywords: [
    "calculadora dotación personal",
    "cuánta gente necesito para cubrir turnos",
    "revisar turnos legales",
    "calculadora de turnos de trabajo",
    "planificador de turnos Chile",
    "dotación personal retail",
    "dotación hospitalaria SAN",
    "mix contratos jornada parcial",
    "turnos rotativos Chile",
    "calcular dotación",
    "dimensionamiento personal",
    "jornada laboral 42 horas Chile",
  ],
  authors: [{ name: "Nexwork SpA" }],
  creator: "Nexwork SpA",
  publisher: "Dotaciones.cl",
  alternates: {
    canonical: "https://dotaciones.cl",
  },
  openGraph: {
    title: "dotaciones.cl — Turnos legales y dotación de personal en Chile",
    description:
      "Revisa gratis si tu turno cumple la ley y calcula cuánta gente necesitas.",
    url: "https://dotaciones.cl",
    siteName: "Dotaciones.cl",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "dotaciones.cl — Turnos legales y dotación",
    description:
      "Revisa gratis si tu turno cumple la ley y calcula cuánta gente necesitas.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${caveat.variable} antialiased`}
      >
        {children}
        <Analytics />
        <Medicion />
      </body>
    </html>
  );
}
