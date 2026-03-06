// src/app/sitemap.ts
import type { MetadataRoute } from "next";

const BASE = "https://dotaciones.cl";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // ── Páginas principales ──────────────────────────────────────────────
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/calculadora`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/san`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/contacto`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },

    // ── Blog ─────────────────────────────────────────────────────────────
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/como-calcular-dotacion-personal`,
      lastModified: new Date("2026-01-10"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/mix-contratos-jornada-parcial`,
      lastModified: new Date("2026-01-18"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/blog/dotacion-hospitalaria-san`,
      lastModified: new Date("2026-01-25"),
      changeFrequency: "monthly",
      priority: 0.8,
    },

    // ── Recursos ─────────────────────────────────────────────────────────
    {
      url: `${BASE}/san/glosario`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
