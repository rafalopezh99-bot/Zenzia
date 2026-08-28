import { createClient } from "@/lib/supabase/server";
import { createVehicle } from "@/lib/actions/assets";

export default async function VehiculosPage() {
  const supabase = createClient();
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: vehicles } = await supabase
    .from("assets")
    .select("id, custom_fields, contacts(full_name)")
    .eq("type", "vehicle")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Vehículos</h1>

      <form action={createVehicle} className="mb-6 flex flex-wrap items-end gap-2 text-sm">
        <select name="contact_id" required className="rounded bg-neutral-800 p-2">
          <option value="">Cliente</option>
          {(contacts ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
        <input name="plate" placeholder="Matrícula" required className="rounded bg-neutral-800 p-2" />
        <input name="model" placeholder="Marca y modelo" className="rounded bg-neutral-800 p-2" />
        <button className="rounded bg-neutral-100 px-3 py-2 font-medium text-neutral-900">Añadir vehículo</button>
      </form>

      <table className="w-full text-left text-sm">
        <thead className="text-neutral-400">
          <tr>
            <th className="py-2">Cliente</th>
            <th className="py-2">Matrícula</th>
            <th className="py-2">Modelo</th>
          </tr>
        </thead>
        <tbody>
          {(vehicles ?? []).map((v: any) => (
            <tr key={v.id} className="border-t border-neutral-800">
              <td className="py-2">{v.contacts?.full_name}</td>
              <td className="py-2">{v.custom_fields?.plate}</td>
              <td className="py-2">{v.custom_fields?.model}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
