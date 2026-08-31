import Link from "next/link";
import { FONT_SANS, FONT_MONO, PAPER, INK, SLATE, LINE } from "@/lib/marketing-theme";

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

export function MarketingHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-baseline gap-2">
        <span className="text-xl font-black tracking-tight" style={{ color: INK }}>
          Zenzia
        </span>
      </Link>
      {minimal ? (
        <Link
          href="/"
          className="text-sm uppercase tracking-wide transition hover:opacity-70"
          style={{ fontFamily: FONT_MONO, color: SLATE }}
        >
          ‹ Volver a Zenzia
        </Link>
      ) : (
        <nav className="flex items-center gap-6">
          <a
            href="#funcionalidades"
            className="hidden text-sm uppercase tracking-wide transition hover:opacity-70 sm:inline"
            style={{ fontFamily: FONT_MONO, color: SLATE }}
          >
            Funcionalidades
          </a>
          <a
            href="#sectores"
            className="hidden text-sm uppercase tracking-wide transition hover:opacity-70 sm:inline"
            style={{ fontFamily: FONT_MONO, color: SLATE }}
          >
            Sectores
          </a>
          <a
            href="#contacto"
            className="hidden text-sm uppercase tracking-wide transition hover:opacity-70 sm:inline"
            style={{ fontFamily: FONT_MONO, color: SLATE }}
          >
            Contacto
          </a>
          <Link
            href="/login"
            className="rounded-full px-5 py-2 text-sm font-medium text-white transition hover:brightness-110"
            style={{ backgroundColor: INK, fontFamily: FONT_MONO }}
          >
            acceder()
          </Link>
        </nav>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black" style={{ color: INK }}>
              Zenzia
            </span>
            <Mono className="text-[11px]" style={{ color: SLATE }}>
              un producto de RL Digital Studios
            </Mono>
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
        <Mono className="mt-4 block text-[11px]" style={{ color: SLATE }}>
          © 2026 Zenzia. Todos los derechos reservados.
        </Mono>
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
        <h1 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-4xl">{title}</h1>
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
