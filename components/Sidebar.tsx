import Link from "next/link";
import type { ModuleDef } from "@/lib/modules";

// El sidebar no sabe nada de "fisio" ni "taller": solo pinta los módulos
// que llegan activados. Añadir o quitar una ventana para un cliente es
// activar/desactivar una fila en company_modules, no tocar este componente.
export default function Sidebar({
  modules,
  notificationCount = 0,
}: {
  modules: ModuleDef[];
  notificationCount?: number;
}) {
  const linkClass = "block rounded-xl px-3 py-2 text-slate transition hover:bg-paper-deep hover:text-ink";

  return (
    <nav className="w-56 shrink-0 border-r border-line bg-white p-4 text-sm">
      <div className="mb-6 flex items-center gap-1 px-1">
        {/* El icono hace de "Z" inicial — el texto sigue en "enzia" para no repetirla. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zenzia-icon.png" alt="Zenzia" width={40} height={40} className="h-10 w-10" />
        <span className="text-base font-black uppercase tracking-tight text-ink">enzia</span>
      </div>
      <Link href="/dashboard" className={linkClass}>
        Dashboard
      </Link>
      <Link href="/contactos" className={linkClass}>
        Contactos
      </Link>
      <Link href="/clientes" className={linkClass}>
        Clientes
      </Link>
      <Link href="/notificaciones" className={`${linkClass} flex items-center justify-between`}>
        <span>Notificaciones</span>
        {notificationCount > 0 && (
          <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
            {notificationCount}
          </span>
        )}
      </Link>
      {modules.map((m) => (
        <Link key={m.key} href={m.href} className={linkClass}>
          {m.label}
        </Link>
      ))}
    </nav>
  );
}
