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
  title: "Calculadora de Dotación Retail en Chile | Dotaciones.cl",
  description:
    "Calcula cuántas personas necesitas para cubrir tu operación retail considerando horas semanales, colaciones, traslapes y efecto domingo. Herramienta gratuita online.",
  metadataBase: new URL("https://dotaciones.cl"),
  openGraph: {
    title: "Calculadora de Dotación Retail en Chile",
    description: "Calcula dotación semanal considerando descansos y domingos. Gratis.",
    url: "https://dotaciones.cl",
    siteName: "Dotaciones.cl",
    locale: "es_CL",
    type: "website",
  },
  alternates: {
    canonical: "https://dotaciones.cl",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}