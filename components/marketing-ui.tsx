import Link from "next/link";
import { FONT_SANS, FONT_SERIF, FONT_MONO, PAPER, INK, SLATE, LINE, BLUE } from "@/lib/marketing-theme";

// Piezas compartidas entre la landing pública (app/page.tsx) y las páginas
// legales (aviso-legal, privacidad, cookies) — para que compartan cabecera,
// pie y tipografía sin duplicar el marcado en cada archivo.

export function Mono({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span style={{ fontFamily: FONT_MONO, ...style }} className={className}>
      {children}
    </span>
  );
}

// Wordmark en texto (Georgia, minúscula) en vez de la imagen anterior —
// aquella traía un degradado turquesa pensado para la estética antigua y
// desentonaría con la paleta índigo/crema nueva. Si más adelante se quiere
// un logo gráfico propio para esta identidad, sustituir esto por un <img>.
function ZenziaWordmark({ size }: { size: number }) {
  return (
    <span style={{ fontFamily: FONT_SERIF, fontSize: size * 0.6, fontWeight: 700, color: "inherit" }}>zenzia</span>
  );
}

export function MarketingHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="sticky top-0 z-10" style={{ backgroundColor: INK }}>
      <div
        className={`mx-auto grid max-w-6xl items-center gap-4 px-6 py-4 ${
          minimal ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_auto_1fr]"
        }`}
      >
        <Link href="/" className="justify-self-start" style={{ color: PAPER }}>
          <ZenziaWordmark size={36} />
        </Link>
        {minimal ? (
          <Link
            href="/"
            className="justify-self-end text-sm transition hover:opacity-80"
            style={{ fontFamily: FONT_SANS, color: "#C9D2E0" }}
          >
            ‹ Volver a Zenzia
          </Link>
        ) : (
          <>
            <nav className="hidden items-center gap-6 sm:flex">
              <a href="#servicios" className="text-sm transition hover:opacity-80" style={{ fontFamily: FONT_SANS, color: "#C9D2E0" }}>
                Servicios
              </a>
              <a href="#funcionalidades" className="text-sm transition hover:opacity-80" style={{ fontFamily: FONT_SANS, color: "#C9D2E0" }}>
                Funcionalidades
              </a>
              <a href="#automatizaciones" className="text-sm transition hover:opacity-80" style={{ fontFamily: FONT_SANS, color: "#C9D2E0" }}>
                Automatizaciones
              </a>
              <a href="#sectores" className="text-sm transition hover:opacity-80" style={{ fontFamily: FONT_SANS, color: "#C9D2E0" }}>
                Para tu negocio
              </a>
            </nav>
            <Link
              href="/login"
              className="justify-self-end rounded-full px-5 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:scale-105"
              style={{ backgroundColor: BLUE, fontFamily: FONT_SANS }}
            >
              Acceder
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 700, color: INK }}>zenzia</span>
            <span className="text-[11px]" style={{ fontFamily: FONT_SANS, color: SLATE }}>
              un producto de RL Digital Studios
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacidad" className="text-xs hover:underline" style={{ color: SLATE }}>
              Política de privacidad
            </Link>
            <Link href="/aviso-legal" className="text-xs hover:underline" style={{ color: SLATE }}>
              Aviso legal
            </Link>
            <Link href="/cookies" className="text-xs hover:underline" style={{ color: SLATE }}>
              Política de cookies
            </Link>
          </nav>
        </div>
        <span className="mt-4 block text-[11px]" style={{ fontFamily: FONT_SANS, color: SLATE }}>
          © 2026 Zenzia. Todos los derechos reservados.
        </span>
      </div>
    </footer>
  );
}

// Envoltorio para las páginas legales: mismo fondo/tipografía que la
// landing, cabecera minimalista (solo "volver"), y una columna de lectura
// cómoda para texto largo.
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: PAPER, color: INK, fontFamily: FONT_SANS }}>
      <MarketingHeader minimal />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <Mono className="text-xs uppercase tracking-widest" style={{ color: SLATE }}>
          Última actualización: {updated}
        </Mono>
        <h1 style={{ fontFamily: FONT_SERIF }} className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
          {title}
        </h1>
        <div className="legal-prose mt-10 space-y-6 text-sm leading-relaxed" style={{ color: SLATE }}>
          {children}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

// Subtítulo de sección dentro de una página legal (p. ej. "1. Objeto").
export function LegalHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="!mt-10 text-base font-bold uppercase tracking-tight" style={{ color: INK }}>
      {children}
    </h2>
  );
}
