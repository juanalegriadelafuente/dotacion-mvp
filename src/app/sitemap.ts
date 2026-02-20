import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://dotaciones.cl',
      lastModified: new Date(),
    },
    {
      url: 'https://dotaciones.cl/calculadora',
      lastModified: new Date(),
    },
  ]
}