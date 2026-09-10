import type { MetadataRoute } from "next";

// Sin esto, al hacer "Añadir a pantalla de inicio" en el móvil (sobre todo
// Android/Chrome) no hay ningún manifest que declare iconos, así que el
// sistema pone un icono genérico (la "bolita del mundo") en vez del logo.
// Next.js detecta este archivo por convención y expone /manifest.webmanifest
// con un <link rel="manifest"> automático en el <head> — no hace falta
// tocar app/layout.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zenzia",
    short_name: "Zenzia",
    description: "CRM para negocios locales — contactos, agenda, facturación y presupuestos en un solo sitio.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f8f6",
    theme_color: "#2c6c82",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
