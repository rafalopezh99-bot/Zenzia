import "./globals.css";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, JetBrains_Mono, Outfit } from "next/font/google";

const DESCRIPTION =
  "CRM para negocios locales — contactos, agenda, facturación y presupuestos en un solo sitio.";

// metadataBase resuelve las rutas relativas de abajo (og-image.png) a URL
// absoluta, que es lo que exigen WhatsApp/Twitter/Facebook para mostrar la
// miniatura al compartir el enlace — sin esto, algunos clientes no la cargan.
export const metadata: Metadata = {
  metadataBase: new URL("https://zenzia.es"),
  title: {
    default: "Zenzia · CRM para autónomos: agenda, clientes y facturación con VeriFactu",
    template: "%s · Zenzia",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
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

// Inter (texto del panel) + Outfit (logo, ver ZenziaLogo.tsx) + IBM Plex
// Mono (reloj del panel, LiveClock) + JetBrains Mono (titulares de la web
// pública, ver app/page.tsx y components/marketing-ui.tsx — identidad
// "oscura y técnica" de zenzia.es, deliberadamente distinta de la
// tipografía clara del panel) se cargan con next/font/google: las fuentes
// se descargan una vez en build y quedan self-hosted junto al resto de
// estáticos, sin round-trip a fonts.googleapis.com en el navegador del
// visitante (antes se cargaban por <link>, una decisión de cuando el
// sandbox de build no tenía salida a internet — ya no es el caso).
// Cada fuente expone una variable CSS (--font-*, ver tailwind.config.ts y
// globals.css) en vez del nombre de familia a pelo, que es como
// next/font la expone de verdad.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-inter",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-outfit",
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${ibmPlexMono.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
