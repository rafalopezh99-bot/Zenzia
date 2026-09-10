"use client";

import { useState } from "react";
import Link from "next/link";
import type { ModuleDef } from "@/lib/modules";
import { getTerminology, showsAcademiaFields } from "@/lib/terminology";
import ThemeToggle from "@/components/ThemeToggle";

// El sidebar no sabe nada de "fisio" ni "taller": solo pinta los módulos
// que llegan activados. Añadir o quitar una ventana para un cliente es
// activar/desactivar una fila en company_modules, no tocar este componente.
//
// En móvil no cabe un sidebar fijo de 224px junto al contenido, así que
// aquí mismo se convierte en una barra superior con botón de menú que abre
// el nav como un cajón deslizante; en escritorio (sm y superior) vuelve a
// ser el sidebar fijo de siempre.
export default function Sidebar({
  modules,
  notificationCount = 0,
  isAdmin = false,
  signupRequestCount = 0,
  vertical = null,
}: {
  modules: ModuleDef[];
  notificationCount?: number;
  isAdmin?: boolean;
  signupRequestCount?: number;
  vertical?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const terms = getTerminology(vertical);
  const showAcademia = showsAcademiaFields(vertical);
  const linkClass = "block rounded-xl px-3 py-2 text-slate transition hover:bg-paper-deep hover:text-ink";
  const close = () => setOpen(false);

  return (
    <>
      {/* Barra superior: solo en móvil */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:hidden">
        <Link href="/dashboard" className="flex items-center" onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zenzia-wordmark.png" alt="Zenzia" width={122} height={24} className="h-6 w-auto" />
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col overflow-y-auto border-r border-line bg-surface p-4 text-sm transition-transform duration-200 ease-out sm:static sm:z-auto sm:w-56 sm:shrink-0 sm:translate-x-0 sm:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 hidden px-1 sm:block">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/zenzia-wordmark.png" alt="Zenzia" width={153} height={30} className="h-[30px] w-auto" />
          </div>
        </div>
        <div className="mb-4 flex items-start justify-between px-1 sm:hidden">
          <div>
            <div className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/zenzia-wordmark.png" alt="Zenzia" width={142} height={28} className="h-7 w-auto" />
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="rounded-lg border border-line p-2 text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <Link href="/dashboard" className={linkClass} onClick={close}>
          Dashboard
        </Link>
        <Link href="/contactos" className={linkClass} onClick={close}>
          {terms.contacts}
        </Link>
        {showAcademia && (
          <Link href="/grupos" className={linkClass} onClick={close}>
            Grupos
          </Link>
        )}
        {isAdmin && (
          <Link href="/clientes" className={linkClass} onClick={close}>
            Clientes
          </Link>
        )}
        <Link href="/notificaciones" className={`${linkClass} flex items-center justify-between`} onClick={close}>
          <span>Notificaciones</span>
          {notificationCount > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </Link>
        {modules.map((m) => (
          <Link key={m.key} href={m.href} className={linkClass} onClick={close}>
            {m.key === "agenda" ? terms.agendaLabel : m.label}
          </Link>
        ))}
        {isAdmin && (
          <Link href="/solicitudes" className={`${linkClass} flex items-center justify-between`} onClick={close}>
            <span>Solicitudes</span>
            {signupRequestCount > 0 && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                {signupRequestCount}
              </span>
            )}
          </Link>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <Link href="/perfil" className={`${linkClass} flex-1 px-2`} onClick={close}>
            Perfil del negocio
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
