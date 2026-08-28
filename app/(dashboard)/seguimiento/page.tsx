import { createClient } from "@/lib/supabase/server";
import { addProgress } from "@/lib/actions/progress";

// Módulo "seguimiento": entradas de progreso genéricas (peso, dolor,
// medidas...) — cada vertical usa la métrica que necesita sin tocar código.
export default async function SeguimientoPage() {
  const supabase = createClient();
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: entries } = await supabase
    .from("activities")
    .select("id, created_at, custom_fields, contacts(full_name)")
    .eq("type", "progress")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Seguimiento de progreso</h1>

      <form action={addProgress} className="mb-6 flex flex-wrap items-end gap-2 text-sm">
        <select name="contact_id" required className="rounded bg-neutral-800 p-2">
          <option value="">Contacto</option>
          {(contacts ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
        <input name="label" placeholder="Métrica (ej. peso, dolor)" required className="rounded bg-neutral-800 p-2" />
        <input name="value" placeholder="Valor" required className="w-24 rounded bg-neutral-800 p-2" />
        <button className="rounded bg-neutral-100 px-3 py-2 font-medium text-neutral-900">Añadir</button>
      </form>

      <ul className="space-y-2 text-sm">
        {(entries ?? []).map((e: any) => (
          <li key={e.id} className="border-b border-neutral-800 pb-2">
            <span className="text-neutral-500">{new Date(e.created_at).toLocaleString("es-ES")}</span>{" — "}
            <span className="font-medium">{e.contacts?.full_name}</span>: {e.custom_fields?.label} ={" "}
            {e.custom_fields?.value}
          </li>
        ))}
        {(entries ?? []).length === 0 && <li className="text-neutral-500">Sin entradas todavía.</li>}
      </ul>
    </div>
  );
}
