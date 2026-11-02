"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuleDef } from "@/lib/modules";
import { getTerminology, showsAcademiaFields } from "@/lib/terminology";
import ThemeToggle from "@/components/ThemeToggle";
import ZenziaLogo from "@/components/ZenziaLogo";

// El sidebar no sabe nada de "fisio" ni "taller": solo pinta los módulos
// que llegan activados. Añadir o quitar una ventana para un cliente es
// activar/desactivar una fila en company_modules, no tocar este componente.
//
// En móvil no cabe un sidebar fijo de 224px junto al contenido, así que
// aquí mismo se convierte en una barra superior con botón de menú que abre
// el nav como un cajón deslizante; en escritorio (sm y superior) vuelve a
// ser el sidebar fijo de siempre.
// Icono de cada sección del menú (por ruta).
const ICONS: Record<string, string> = {
  "/dashboard": "M3 11l9-8 9 8M5 10v10h14V10",
  "/contactos": "M16 20v-2a4 4 0 0 0-8 0v2M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7",
  "/estadisticas": "M4 19l5-6 4 3 7-9",
  "/grupos": "M17 20v-2a4 4 0 0 0-3-3.9M7 20v-2a4 4 0 0 1 8 0v2M11 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7",
  "/clientes": "M4 21V8l8-5 8 5v13M9 21v-6h6v6",
  "/notificaciones": "M18 16V11a6 6 0 0 0-12 0v5l-2 2h16zM10 21h4",
  "/citas": "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
  "/historial": "M6 3h9l4 4v14H6zM9 12h6M9 16h6",
  "/seguimiento": "M3 12h4l3-7 4 14 3-7h4",
  "/vehiculos": "M5 16l1.5-6h11L19 16M4 16h16v3H4zM7 19v2M17 19v2",
  "/presupuestos": "M6 3h12v18H6zM9 8h6M9 12h6M9 16h3",
  "/bonos": "M4 7h16v4a2 2 0 0 0 0 4v2H4v-2a2 2 0 0 0 0-4z",
  "/fotos": "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5",
  "/consentimientos": "M4 20c3-1 4-5 7-5s2 3 4 3 3-2 5-2M6 3h12v9",
  "/facturacion": "M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21zM10 8h4M10 12h4",
  "/pagos": "M3 7h18v11H3zM3 11h18",
  "/mi-web": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  "/galeria": "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5",
  "/proveedores": "M3 7h11v10H3zM14 10h4l3 3v4h-7M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  "/cuentas": "M4 21V5h10v16M14 9h6v12M8 9h2M8 13h2",
  "/solicitudes": "M4 5h16v14H4zM4 6l8 7 8-7",
  "/perfil": "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21c0-4 4-6 8-6s8 2 8 6",
};

function NavIcon({ href }: { href: string }) {
  const d = ICONS[href];
  if (!d) return null;
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

export default function Sidebar({
  modules,
  notificationCount = 0,
  isAdmin = false,
  signupRequestCount = 0,
  vertical = null,
  showStats = true,
  showNotifications = true,
  locked = [],
  webOnly = false,
}: {
  modules: ModuleDef[];
  notificationCount?: number;
  isAdmin?: boolean;
  signupRequestCount?: number;
  vertical?: string | null;
  showStats?: boolean;
  showNotifications?: boolean;
  locked?: string[];
  // Plan Web: el menú solo tiene "Mi web", "Galería" y cerrar sesión.
  webOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const terms = getTerminology(vertical);
  const showAcademia = showsAcademiaFields(vertical);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const linkClass = "flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-[#dce7f1] transition hover:bg-[#12365c] hover:text-white";
  const item = (href: string) => `${linkClass}${pathname === href || pathname.startsWith(`${href}/`) ? " bg-[#163e6e] text-white" : ""}`;
  const countBadge = "ml-auto rounded-full bg-[#2f7fc0] px-2 py-0.5 text-xs font-semibold text-white";

  return (
    <>
      {/* Barra superior: solo en móvil */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:hidden">
        <Link href="/dashboard" className="flex items-center" onClick={close}>
          <ZenziaLogo className="h-7 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg border border-line p-2 text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Fondo oscuro para cerrar el cajón al tocar fuera (solo móvil, solo si está abierto) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 sm:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Nav: cajón deslizante en móvil, columna fija en escritorio */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col overflow-y-auto bg-[#0b2a4a] p-4 text-sm text-[#dce7f1] transition-transform duration-200 ease-out sm:sticky sm:top-0 sm:h-screen sm:z-auto sm:w-56 sm:shrink-0 sm:translate-x-0 sm:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 hidden px-1 sm:block">
          <div className="flex items-center">
            <ZenziaLogo onDark className="h-11 w-auto" />
          </div>
        </div>
        <div className="mb-4 flex items-start justify-between px-1 sm:hidden">
          <div>
            <div className="flex items-center">
              <ZenziaLogo onDark className="h-9 w-auto" />
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="rounded-lg border border-[#47678a] p-2 text-white"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {webOnly ? (
          <>
            <Link href="/dashboard" className={item("/dashboard")} onClick={close}>
              <NavIcon href="/dashboard" /> Dashboard
            </Link>
            <Link href="/mi-web" className={item("/mi-web")} onClick={close}>
              <NavIcon href="/mi-web" /> Mi web
            </Link>
            <Link href="/galeria" className={item("/galeria")} onClick={close}>
              <NavIcon href="/galeria" /> Galería
            </Link>
          </>
        ) : (
          <>
        <Link href="/dashboard" className={item("/dashboard")} onClick={close}>
          <NavIcon href="/dashboard" /> Dashboard
        </Link>
        <Link href="/contactos" className={item("/contactos")} onClick={close}>
          <NavIcon href="/contactos" /> {terms.contacts}
        </Link>
        {showStats && (
          <Link href="/estadisticas" className={item("/estadisticas")} onClick={close}>
            <NavIcon href="/estadisticas" /> Estadísticas
          </Link>
        )}

        {showAcademia && (
          <Link href="/grupos" className={item("/grupos")} onClick={close}>
            <NavIcon href="/grupos" /> Grupos
          </Link>
        )}
        {isAdmin && (
          <Link href="/clientes" className={item("/clientes")} onClick={close}>
            <NavIcon href="/clientes" /> Clientes
          </Link>
        )}
        {showNotifications && (
          <Link href="/notificaciones" className={item("/notificaciones")} onClick={close}>
            <NavIcon href="/notificaciones" />
            <span>Notificaciones</span>
            {notificationCount > 0 && (
              <span className={countBadge}>
                {notificationCount}
              </span>
            )}
          </Link>
        )}
        {modules.map((m) => (
          <Link key={m.key} href={m.href} className={item(m.href)} onClick={close}>
            <NavIcon href={m.href} /> {m.key === "agenda" ? terms.agendaLabel : m.label}
          </Link>
        ))}
        <Link href="/pagos" className={item("/pagos")} onClick={close}>
          <NavIcon href="/pagos" /> Cobros
        </Link>
        {locked.map((label) => (
          <Link
            key={label}
            href="/planes"
            className={`${linkClass} justify-between opacity-60`}
            onClick={close}
            title="Disponible en un plan superior"
          >
            <span>{label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </Link>
        ))}
        {isAdmin && (
          <Link href="/cuentas" className={item("/cuentas")} onClick={close}>
            <NavIcon href="/cuentas" /> Cuentas
          </Link>
        )}
        {isAdmin && (
          <Link href="/solicitudes" className={item("/solicitudes")} onClick={close}>
            <NavIcon href="/solicitudes" />
            <span>Solicitudes</span>
            {signupRequestCount > 0 && (
              <span className={countBadge}>
                {signupRequestCount}
              </span>
            )}
          </Link>
        )}

          </>
        )}

        {/* Soporte de Zenzia (todos los planes) */}
        <a
          href="https://wa.me/34673895732?text=Hola%2C%20necesito%20ayuda%20con%20Zenzia"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto mb-2 block rounded-xl border border-[#47678a] px-3 py-2 text-xs text-[#c5d6e6] transition hover:border-white"
          onClick={close}
        >
          <span className="block font-semibold text-white">Contactar con soporte</span>
          WhatsApp · 673 895 732
        </a>
        <div className="flex items-center justify-between gap-2 border-t border-[#2c4e70] pt-3">
          <Link href="/perfil" className={`${item("/perfil")} flex-1 px-2`} onClick={close}>
            <NavIcon href="/perfil" /> {webOnly ? "Perfil" : "Perfil del negocio"}
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
