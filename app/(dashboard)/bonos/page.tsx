import { createClient } from "@/lib/supabase/server";
import { createPackage, usePackageSession } from "@/lib/actions/packages";

export default async function BonosPage() {
  const supabase = createClient();
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: packages } = await supabase
    .from("packages")
    .select("id, name, total_sessions, used_sessions, contacts(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Bonos / paquetes de sesiones</h1>

      <form action={createPackage} className="mb-6 flex flex-wrap items-end gap-2 text-sm">
        <select name="contact_id" required className="rounded bg-neutral-800 p-2">
          <option value="">Contacto</option>
          {(contacts ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
        <input name="name" placeholder="Nombre del bono (ej. Bono 10 sesiones)" required className="rounded bg-neutral-800 p-2" />
        <input name="total_sessions" type="number" placeholder="Nº sesiones" required className="w-28 rounded bg-neutral-800 p-2" />
        <button className="rounded bg-neutral-100 px-3 py-2 font-medium text-neutral-900">Crear bono</button>
      </form>

      <table className="w-full text-left text-sm">
        <thead className="text-neutral-400">
          <tr>
            <th className="py-2">Contacto</th>
            <th className="py-2">Bono</th>
            <th className="py-2">Uso</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {(packages ?? []).map((p: any) => {
            const useSession = usePackageSession.bind(null, p.id, p.used_sessions);
            const agotado = p.used_sessions >= p.total_sessions;
            return (
              <tr key={p.id} className="border-t border-neutral-800">
                <td className="py-2">{p.contacts?.full_name}</td>
                <td className="py-2">{p.name}</td>
                <td className="py-2">
                  {p.used_sessions} / {p.total_sessions}
                </td>
                <td className="py-2">
                  <form action={useSession}>
                    <button
                      className="text-neutral-400 underline hover:text-neutral-200 disabled:cursor-not-allowed disabled:text-neutral-700 disabled:no-underline"
                      disabled={agotado}
                    >
                      Usar sesión
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
