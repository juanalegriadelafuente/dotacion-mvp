// src/app/layout.tsx
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
  title: {
    default: "Dotaciones.cl — Calculadora de turnos y dotación de personal",
    template: "%s | Dotaciones.cl",
  },
  description:
    "Calcula cuánta gente necesitas para cubrir tus turnos. Calculadora gratuita de dotación para retail, restaurantes, hospitales y más. Incluye mix de contratos y normativa chilena.",
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
  authors: [{ name: "Dotaciones.cl" }],
  creator: "Dotaciones.cl",
  publisher: "Dotaciones.cl",
  alternates: {
    canonical: "https://dotaciones.cl",
  },
  openGraph: {
    title: "Dotaciones.cl — Calculadora de turnos y dotación de personal",
    description:
      "Calcula cuánta gente necesitas para cubrir tus turnos. Gratis, para retail, restaurantes y hospitales. Normativa chilena incluida.",
    url: "https://dotaciones.cl",
    siteName: "Dotaciones.cl",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "https://dotaciones.cl/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dotaciones.cl — Calculadora de dotación de personal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dotaciones.cl — Calculadora de turnos y dotación",
    description:
      "Calcula cuánta gente necesitas para cubrir tus turnos. Gratis.",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
