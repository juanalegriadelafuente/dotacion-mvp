import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://dotaciones.cl",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://dotaciones.cl/calculadora",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
