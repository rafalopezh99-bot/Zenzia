import "./globals.css";

export const metadata = { title: "Zenzia" };

// Inter (texto) e IBM Plex Mono (etiquetas/nav de la landing) se cargan
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
