// src/app/sitemap.ts
//
// ¿Cómo agregar un post nuevo?
//   1. Agrega el objeto al array de blog de abajo
//   2. git push → Vercel regenera el sitemap solo en el build
//   3. No necesitas tocar Google Search Console (ya apunta a /sitemap.xml)

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
      url: `${BASE}/calculadora/guia`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/san`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/san/glosario`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
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
    // ▼ Agrega cada nuevo post aquí, con su fecha real de publicación
    {
      url: `${BASE}/blog/dictamen-252-20-exclusion-jornada-articulo-22`,
      lastModified: new Date("2026-04-22"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/dictamen-253-21-42-horas-implementacion`,
      lastModified: new Date("2026-04-20"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/rse-vs-sostenibilidad-empresas-chile`,
      lastModified: new Date("2026-04-16"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/blog/factor-reemplazo-dotacion-chile`,
      lastModified: new Date("2026-04-16"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/blog/jornada-6x1-retail-chile`,
      lastModified: new Date("2026-04-18"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/blog/dotacion-hospitalaria-san`,
      lastModified: new Date("2026-01-25"),
      changeFrequency: "monthly",
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
  ];
}