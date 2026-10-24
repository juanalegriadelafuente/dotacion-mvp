// src/app/opengraph-image.tsx
// La imagen que se ve al compartir el sitio en WhatsApp, LinkedIn o X.
// Reemplaza a /og-image.png, que el layout pedía pero nunca existió.
import { ImageResponse } from "next/og";

export const alt =
  "dotaciones.cl — Turnos legales y dotación de personal en Chile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagen() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #6D5EFC, #22C1C3)",
        color: "#FFFFFF",
        padding: "72px 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>
        dotaciones.cl
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 76, lineHeight: 1.05, maxWidth: 980 }}>
          ¿Tu turno cumple la ley?
        </div>
        <div
          style={{
            fontSize: 76,
            lineHeight: 1.05,
            maxWidth: 980,
            color: "#0F172A",
          }}
        >
          ¿Cuánta gente necesitas?
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        Herramientas gratuitas · ley laboral chilena · jornada de 42 horas
      </div>
    </div>,
    size,
  );
}
