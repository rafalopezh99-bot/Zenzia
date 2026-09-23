// Tokens visuales compartidos por todo lo público de Zenzia (landing +
// páginas legales). Identidad "Calma con autoridad": índigo profundo +
// verde salvia como respiro, sobre crema — no la estética de
// rldigitalstudios.com que llevaba esto antes. Centralizado aquí para no
// repetir hex codes en cada página — ver components/marketing-ui.tsx para
// los componentes que los usan.
//
// Se mantienen los mismos nombres de export que la versión anterior (PAPER,
// INK, SLATE, LINE, BLUE, BLUE_PALE, MINT, FONT_MONO) aunque el valor y, en
// algún caso, el papel que juegan hayan cambiado — así las páginas legales
// (aviso-legal, privacidad, cookies) heredan la nueva paleta sin tocarlas.

export const FONT_SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
export const FONT_SERIF = "Georgia, 'Times New Roman', serif";
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace";

export const PAPER = "#F4F1EA"; // crema
export const PAPER_DEEP = "#FFFFFF"; // secciones alternas
export const INK = "#22304A"; // índigo profundo (texto, titulares, header)
export const SLATE = "#3A4B6B"; // texto secundario sobre crema
export const LINE = "#E3DFD3"; // bordes
export const BLUE = "#D98E5B"; // terracota: acento de acción (antes azul verdoso)
export const BLUE_PALE = "#F3E3D3"; // terracota pálido, fondos de icono
export const MINT = "#6B9080"; // verde salvia: acento secundario (antes menta)
