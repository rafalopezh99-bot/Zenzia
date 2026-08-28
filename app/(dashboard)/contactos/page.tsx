import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ContactosPage() {
  const supabase = createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, phone, status")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contactos</h1>
        <Link
          href="/contactos/nuevo"
          className="rounded bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900"
        >
          Nuevo contacto
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-neutral-400">
          <tr>
            <th className="py-2">Nombre</th>
            <th className="py-2">Teléfono</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {(contacts ?? []).map((c) => (
            <tr key={c.id} className="border-t border-neutral-800">
              <td className="py-2">
                <Link href={`/contactos/${c.id}`} className="hover:underline">
                  {c.full_name}
                </Link>
              </td>
              <td className="py-2">{c.phone}</td>
              <td className="py-2">{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
