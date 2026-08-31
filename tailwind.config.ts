import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Misma paleta "paper" que la landing pública y las páginas legales
      // (ver lib/marketing-theme.ts) — para que el panel (antes oscuro) use
      // exactamente los mismos tonos, no una aproximación. "brand" es el
      // azul-verdoso de la marca; se llama así (no "blue") para no chocar
      // con la escala azul que trae Tailwind por defecto.
      colors: {
        paper: "#F7F8F6",
        "paper-deep": "#EDF1EF",
        ink: "#0F1113",
        slate: "#5B6A63",
        line: "#D6DEDA",
        brand: "#2C6C82",
        "brand-pale": "#E1EEF0",
        mint: "#BFE3D3",
      },
    },
  },
  plugins: [],
};
export default config;
