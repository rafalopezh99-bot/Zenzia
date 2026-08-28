import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CitasPage() {
  const supabase = createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, status, contacts(full_name)")
    .order("starts_at", { ascending: true });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Agenda</h1>
        <Link
          href="/citas/nueva"
          className="rounded bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900"
        >
          Nueva cita
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-neutral-400">
          <tr>
            <th className="py-2">Fecha</th>
            <th className="py-2">Contacto</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {(appointments ?? []).map((a: any) => (
            <tr key={a.id} className="border-t border-neutral-800">
              <td className="py-2">{new Date(a.starts_at).toLocaleString("es-ES")}</td>
              <td className="py-2">{a.contacts?.full_name}</td>
              <td className="py-2">{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
