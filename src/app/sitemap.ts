import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://dotaciones.cl/",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://dotaciones.cl/calculadora",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: "https://dotaciones.cl/calculadora/guia",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://dotaciones.cl/san",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: "https://dotaciones.cl/san/guia",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://dotaciones.cl/san/glosario",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://dotaciones.cl/contacto",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}