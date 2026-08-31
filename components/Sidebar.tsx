import Link from "next/link";
import type { ModuleDef } from "@/lib/modules";

// El sidebar no sabe nada de "fisio" ni "taller": solo pinta los módulos
// que llegan activados. Añadir o quitar una ventana para un cliente es
// activar/desactivar una fila en company_modules, no tocar este componente.
export default function Sidebar({ modules }: { modules: ModuleDef[] }) {
  const linkClass = "block rounded-xl px-3 py-2 text-slate transition hover:bg-paper-deep hover:text-ink";

  return (
    <nav className="w-56 shrink-0 border-r border-line bg-white p-4 text-sm">
      <div className="mb-6 px-1">
        <span className="text-base font-black uppercase tracking-tight text-ink">Zenzia</span>
      </div>
      <Link href="/dashboard" className={linkClass}>
        Dashboard
      </Link>
      <Link href="/contactos" className={linkClass}>
        Contactos
      </Link>
      {modules.map((m) => (
        <Link key={m.key} href={m.href} className={linkClass}>
          {m.label}
        </Link>
      ))}
    </nav>
  );
}
