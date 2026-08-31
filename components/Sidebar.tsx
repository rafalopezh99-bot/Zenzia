import Link from "next/link";
import type { ModuleDef } from "@/lib/modules";

// El sidebar no sabe nada de "fisio" ni "taller": solo pinta los módulos
// que llegan activados. Añadir o quitar una ventana para un cliente es
// activar/desactivar una fila en company_modules, no tocar este componente.
export default function Sidebar({ modules }: { modules: ModuleDef[] }) {
  const linkClass =
    "block rounded-xl px-3 py-2 text-neutral-400 transition hover:bg-white/5 hover:text-neutral-100";

  return (
    <nav className="w-56 shrink-0 border-r border-white/10 bg-[#070a12] p-4 text-sm">
      <div className="mb-6 flex items-center gap-2 px-1">
        <span className="h-2 w-2 rounded-full bg-gradient-to-br from-emerald-400 to-violet-400" />
        <span className="bg-gradient-to-r from-emerald-300 to-violet-400 bg-clip-text text-base font-bold tracking-tight text-transparent">
          Zenzia
        </span>
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
