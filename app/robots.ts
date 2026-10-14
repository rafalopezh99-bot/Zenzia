import type { MetadataRoute } from "next";

// robots.txt: la web pública se indexa; el panel y las páginas privadas no.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/portal/", "/cita/", "/consentimiento/", "/nueva-contrasena", "/onboarding"],
      },
    ],
    sitemap: "https://zenzia.es/sitemap.xml",
  };
}
