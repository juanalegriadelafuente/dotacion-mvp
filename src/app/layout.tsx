// src/app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Dotaciones.cl — Juan Alegría · Workforce Management Chile",
    template: "%s | Dotaciones.cl",
  },
  description:
    "15 años dimensionando dotaciones, optimizando turnos y calculando en retail, casinos, aeropuertos y salud. Calculadoras gratuitas y artículos sobre normativa laboral chilena.",
  metadataBase: new URL("https://dotaciones.cl"),
  keywords: [
    "calculadora dotación personal",
    "cuánta gente necesito para cubrir turnos",
    "planificador de turnos Chile",
    "dotación personal retail",
    "dotación hospitalaria SAN",
    "mix contratos jornada parcial",
    "turnos rotativos Chile",
    "calcular dotación",
    "dimensionamiento personal",
    "jornada laboral 42 horas Chile",
  ],
  authors: [{ name: "Juan Alegría" }],
  creator: "Juan Alegría",
  publisher: "Dotaciones.cl",
  alternates: {
    canonical: "https://dotaciones.cl",
  },
  openGraph: {
    title: "Dotaciones.cl — Juan Alegría · Workforce Management Chile",
    description:
      "15 años dimensionando dotaciones en retail, casinos, aeropuertos y salud. Calculadoras gratuitas y normativa laboral chilena.",
    url: "https://dotaciones.cl",
    siteName: "Dotaciones.cl",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "https://dotaciones.cl/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dotaciones.cl — Juan Alegría · Workforce Management Chile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dotaciones.cl — Juan Alegría",
    description:
      "15 años dimensionando dotaciones en Chile. Calculadoras gratuitas.",
    images: ["https://dotaciones.cl/og-image.png"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}