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

// Metadata global (general, no amarrado a retail)
export const metadata: Metadata = {
  title: {
    default: "Dotaciones.cl | Calculadoras de dotación por horas y mix de contratos",
    template: "%s | Dotaciones.cl",
  },
  description:
    "Herramientas gratuitas para dimensionar dotación por horas y mix de contratos. Incluye calculadora retail y calculadora SAN hospitalaria con trazabilidad.",
  metadataBase: new URL("https://dotaciones.cl"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Dotaciones.cl | Calculadoras de dotación por horas",
    description:
      "Calculadoras gratuitas para dotación por horas y mix de contratos (retail y SAN hospitalario).",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}