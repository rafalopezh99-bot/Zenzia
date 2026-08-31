import "./globals.css";

export const metadata = { title: "Zenzia" };

// Inter (texto) e IBM Plex Mono (etiquetas/nav de la landing) se cargan
// aquí como hoja de estilos de Google Fonts en tiempo de navegador, no con
// next/font/google — ese método descarga las fuentes en el momento del
// build/servidor, y falla si esa máquina no tiene salida a
// fonts.googleapis.com (nos pasó en el sandbox). Con un <link> normal es
// el navegador del visitante el que las pide, igual que cualquier web.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
