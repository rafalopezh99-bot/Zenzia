// Logo de marca compartido por todo el panel (sidebar, login, registro...).
// El logo en navy no se lee sobre el fondo oscuro del modo oscuro, así que
// aquí se pintan dos PNG superpuestos (letras claras + punto celeste más
// vivo, ver zenzia-wordmark-dark.png) y se alterna cuál se ve con las
// mismas clases dark: que ya usa el resto del panel (Badge, etc.), sin
// JS: [data-theme="dark"] en <html> decide cuál queda visible. El tema se
// decide en un script inline en app/layout.tsx que corre en TODAS las
// páginas (login y registro incluidos, no solo dentro del panel), así que
// este componente hace falta en cualquier sitio donde salga el logotipo.
export default function ZenziaLogo({ className }: { className: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/zenzia-wordmark.png" alt="Zenzia" className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/zenzia-wordmark-dark.png" alt="Zenzia" className={`hidden ${className} dark:block`} />
    </>
  );
}
