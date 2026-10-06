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
        // Tokens de la web pública (zenzia.es): identidad propia, separada
        // de la paleta de arriba (esa sigue siendo la del panel). Viven
        // bajo .mk (ver globals.css) en vez de responder a [data-theme],
        // porque es una identidad fija de marca, no un modo conmutable.
        // Tercera iteración (inspirada en monday.com a petición de Rafa):
        // blanco + violeta de marca + tres acentos secundarios, en vez de
        // la anterior oscura/ámbar — un sistema multicolor, no un único
        // acento, para dar esa energía "SaaS colorido".
        mk: {
          bg: "var(--mk-bg)",
          raised: "var(--mk-raised)",
          ink: "var(--mk-ink)",
          muted: "var(--mk-muted)",
          line: "var(--mk-line)",
          accent: "var(--mk-accent)",
          "accent-dim": "var(--mk-accent-dim)",
          coral: "var(--mk-coral)",
          teal: "var(--mk-teal)",
          amber: "var(--mk-amber)",
        },
      },
      // Inter, IBM Plex Mono y JetBrains Mono ya se cargan en app/layout.tsx
      // (vía <link>, ver comentario allí). font-sans/font-mono son las de
      // siempre (panel, LiveClock). font-display quedó de la identidad
      // anterior de la web pública (JetBrains Mono) — ya no se usa en
      // app/page.tsx, pero se deja declarada por si una sección puntual la
      // necesita (p. ej. una etiqueta tipo "código").
      fontFamily: {
        sans: ['"Inter"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Arial", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", '"SFMono-Regular"', "Menlo", "monospace"],
        display: ['"JetBrains Mono"', "ui-monospace", '"SFMono-Regular"', "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
