import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/lista-revision-turnos.pdf", "/lista-revision/baja"],
    },
    sitemap: "https://dotaciones.cl/sitemap.xml",
  };
}
