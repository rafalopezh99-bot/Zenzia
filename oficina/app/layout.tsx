import type { Metadata } from "next";
import "./globals.css";
import "./oficina-pixel.css";

export const metadata: Metadata = {
  title: "Oficina ZENZIA",
  description: "Oficina virtual con departamentos de Claude a los que encargar tareas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
