import type { MetadataRoute } from "next";

// sitemap.xml con las páginas públicas de zenzia.es.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://zenzia.es";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/registro`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/aviso-legal`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
