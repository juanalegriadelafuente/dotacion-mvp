// src/app/sitemap.ts
//
// ✅ Sitemap dinámico — se actualiza automáticamente en cada deploy.
// Los posts del blog se leen directamente desde Notion a través de getBlogPosts().
// Solo tienes que agregar páginas estáticas nuevas manualmente.

import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/notion-blog";

export const revalidate = 3600; // revalidar cada hora en producción

const BASE = "https://dotaciones.cl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Páginas estáticas ─────────────────────────────────────────────────────
  const paginas: MetadataRoute.Sitemap = [
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
      url: `${BASE}/calculadora/finiquito`,
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
      url: `${BASE}/san/glosario`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/contacto`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // ── Posts del blog (dinámico desde Notion) ────────────────────────────────
  let posts: MetadataRoute.Sitemap = [];
  try {
    const blogPosts = await getBlogPosts();
    posts = blogPosts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: post.date && !isNaN(new Date(post.date).getTime()) ? new Date(post.date) : now,
      changeFrequency: "monthly" as const,
      priority: post.featured ? 0.9 : 0.7,
    }));
  } catch (error) {
    // Si Notion falla, el sitemap sigue funcionando con las páginas estáticas
    console.error("Sitemap: error al obtener posts de Notion:", error);
  }

  return [...paginas, ...posts];
}