import "./globals.css";
import type { Metadata, Viewport } from "next";

const DESCRIPTION =
  "CRM para negocios locales — contactos, agenda, facturación y presupuestos en un solo sitio.";

// metadataBase resuelve las rutas relativas de abajo (og-image.png) a URL
// absoluta, que es lo que exigen WhatsApp/Twitter/Facebook para mostrar la
// miniatura al compartir el enlace — sin esto, algunos clientes no la cargan.
export const metadata: Metadata = {
  metadataBase: new URL("https://zenzia.es"),
  title: "Zenzia",
  description: DESCRIPTION,
  openGraph: {
    title: "Zenzia",
    description: DESCRIPTION,
    url: "https://zenzia.es",
    siteName: "Zenzia",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Zenzia" }],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenzia",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

// Color de la barra del navegador en móvil (Android/Chrome) al abrir
// zenzia.es — antes quedaba en el teal antiguo, ahora en el azul marino
// de la marca.
export const viewport: Viewport = {
  themeColor: "#163e6e",
};

// Inter (texto del panel) + IBM Plex Mono (reloj del panel, LiveClock) +
// JetBrains Mono (titulares de la web pública, ver app/page.tsx y
// components/marketing-ui.tsx — identidad "oscura y técnica" de zenzia.es,
// deliberadamente distinta de la tipografía clara del panel) se cargan
// aquí como hoja de estilos de Google Fonts en tiempo de navegador, no con
// next/font/google — ese método descarga las fuentes en el momento del
// build/servidor, y falla si esa máquina no tiene salida a
// fonts.googleapis.com (nos pasó en el sandbox). Con un <link> normal es
// el navegador del visitante el que las pide, igual que cualquier web.
// Antes de que React hidrate, este script decide claro/oscuro (preferencia
// guardada en localStorage, o el sistema si no hay ninguna) y lo marca en
// <html> con data-theme. Va inline y bloqueante a propósito: así el primer
// pintado ya sale en el tema correcto, sin el parpadeo de cargar en claro
// y saltar a oscuro medio segundo después. suppressHydrationWarning en
// <html> es porque este atributo lo pone el script, no el render de React.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("zenzia-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=IBM+Plex+Mono:wght@400;500;600&family=JetBrains+Mono:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
