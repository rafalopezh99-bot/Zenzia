import Link from "next/link";
import type { ModuleDef } from "@/lib/modules";

// El sidebar no sabe nada de "fisio" ni "taller": solo pinta los módulos
// que llegan activados. Añadir o quitar una ventana para un cliente es
// activar/desactivar una fila en company_modules, no tocar este componente.
export default function Sidebar({ modules }: { modules: ModuleDef[] }) {
  return (
    <nav className="w-56 shrink-0 border-r border-neutral-800 bg-neutral-950 p-4 text-sm">
      <div className="mb-6 font-semibold text-neutral-200">Zenzia</div>
      <Link href="/dashboard" className="block rounded px-3 py-2 text-neutral-300 hover:bg-neutral-900">
        Dashboard
      </Link>
      <Link href="/contactos" className="block rounded px-3 py-2 text-neutral-300 hover:bg-neutral-900">
        Contactos
      </Link>
      {modules.map((m) => (
        <Link
          key={m.key}
          href={m.href}
          className="block rounded px-3 py-2 text-neutral-300 hover:bg-neutral-900"
        >
          {m.label}
        </Link>
      ))}
    </nav>
  );
}
