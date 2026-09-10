import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // El panel soporta modo claro/oscuro: en vez de la clase ".dark" de
  // siempre, se activa con un atributo [data-theme="dark"] puesto en
  // <html> (ver ThemeToggle.tsx + script de arranque en app/layout.tsx).
  // Así una preferencia "sistema" y un valor guardado por el usuario
  // pueden convivir sin pelearse por la misma clase.
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      // Misma paleta "paper" que la landing pública y las páginas legales
      // (ver lib/marketing-theme.ts) en modo claro. Cada tono se resuelve
      // con una variable CSS (definida en globals.css, con su contrapartida
      // oscura bajo [data-theme="dark"]) en vez de un hex fijo, así que
      // cambiar de tema no requiere tocar ninguna clase de Tailwind en el
      // resto del código — los mismos "bg-paper"/"text-ink" de siempre ya
      // responden solos. "surface" es el blanco de tarjetas/inputs (antes
      // bg-white a pelo), separado de "paper" para que la tarjeta se note
      // un pelín distinta del fondo también en oscuro.
      colors: {
        paper: "var(--color-paper)",
        "paper-deep": "var(--color-paper-deep)",
        ink: "var(--color-ink)",
        slate: "var(--color-slate)",
        line: "var(--color-line)",
        brand: "var(--color-brand)",
        "brand-pale": "var(--color-brand-pale)",
        mint: "var(--color-mint)",
        surface: "var(--color-surface)",
      },
    },
  },
  plugins: [],
};
export default config;
