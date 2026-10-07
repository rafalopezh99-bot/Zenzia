import ZenziaLogo from "@/components/ZenziaLogo";
import Link from "next/link";

// Piezas compartidas de la web pública (app/page.tsx + páginas legales).
// Tercera identidad: blanco limpio + violeta de marca, inspirada en
// estructura/tono de monday.com a petición de Rafa — tipografía de palo
// (Inter) en vez de la mono técnica de la versión anterior, formas más
// redondeadas y amables, botones en píldora. Ver ".mk" en
// app/globals.css para los tokens. El logo es el PNG real de marca.

function ZenziaWordmark({ heightClass = "h-[5.5rem]" }: { heightClass?: string }) {
  return (
    <ZenziaLogo light className={heightClass} />
  );
}

const NAV_LINK_CLASS = "text-sm font-medium text-mk-muted transition hover:text-mk-ink";

export function MarketingHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-mk-line bg-mk-bg/90 backdrop-blur">
      <div
        className={`mx-auto grid max-w-6xl items-center gap-4 px-6 py-2.5 ${
          minimal ? "grid-cols-[1fr_auto]" : "grid-cols-[auto_1fr_auto]"
        }`}
      >
        <Link href="/" className="justify-self-start">
          <ZenziaWordmark />
        </Link>
        {minimal ? (
          <Link href="/" className="justify-self-end text-sm font-medium text-mk-muted transition hover:text-mk-ink">
            ‹ Volver a Zenzia
          </Link>
        ) : (
          <>
            <nav className="hidden items-center justify-center gap-7 sm:flex">
              <a href="#funcionalidades" className={NAV_LINK_CLASS}>
                Funcionalidades
              </a>
              <a href="#automatizaciones" className={NAV_LINK_CLASS}>
                Automatizaciones
              </a>
              <a href="#desarrollo-web" className={NAV_LINK_CLASS}>
                Desarrollo web
              </a>
              <a href="#sectores" className={NAV_LINK_CLASS}>
                Sectores
              </a>
            </nav>
            <div className="flex items-center justify-self-end gap-4">
              <a href="#contacto" className="hidden text-sm font-semibold text-mk-ink transition hover:text-mk-accent sm:block">
                Pedir una demo
              </a>
              <Link
                href="/login"
                className="rounded-full bg-mk-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Acceder
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-mk-line bg-mk-raised">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <ZenziaWordmark heightClass="h-14 sm:h-16" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mk-muted">
              CRM y desarrollo web, hechos a mano por una sola persona para que dejes de perder el tiempo.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacidad" className="text-xs text-mk-muted hover:text-mk-ink hover:underline">
              Política de privacidad
            </Link>
            <Link href="/aviso-legal" className="text-xs text-mk-muted hover:text-mk-ink hover:underline">
              Aviso legal
            </Link>
            <Link href="/cookies" className="text-xs text-mk-muted hover:text-mk-ink hover:underline">
              Política de cookies
            </Link>
          </nav>
        </div>
        <span className="mt-8 block text-[11px] text-mk-muted">© 2026 Zenzia. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}

// Envoltorio para las páginas legales: misma identidad clara que el resto
// de la web pública, cabecera minimalista y columna de lectura cómoda.
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
    <div className="mk min-h-screen">
      <MarketingHeader minimal />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <span className="text-xs font-semibold uppercase tracking-widest text-mk-accent">
          Última actualización: {updated}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-mk-ink sm:text-4xl">{title}</h1>
        <div className="legal-prose mt-10 space-y-6 text-sm leading-relaxed text-mk-muted">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  );
}

// Subtítulo de sección dentro de una página legal (p. ej. "1. Objeto").
export function LegalHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="!mt-10 text-base font-bold uppercase tracking-tight text-mk-ink">{children}</h2>;
}
