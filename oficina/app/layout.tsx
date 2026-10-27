import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oficina RL Digital Studios",
  description: "Oficina virtual con departamentos de Claude a los que encargar tareas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
