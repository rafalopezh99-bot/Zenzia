import { createClient } from "@/lib/supabase/server";
import { createAppointment } from "@/lib/actions/appointments";

export default async function NuevaCitaPage() {
  const supabase = createClient();
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Nueva cita</h1>
      <form action={createAppointment} className="max-w-sm space-y-3">
        <select name="contact_id" required className="w-full rounded bg-neutral-800 p-2 text-sm">
          <option value="">Selecciona contacto</option>
          {(contacts ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
        <input name="starts_at" type="datetime-local" required className="w-full rounded bg-neutral-800 p-2 text-sm" />
        <input
          name="duration_minutes"
          type="number"
          defaultValue={30}
          className="w-full rounded bg-neutral-800 p-2 text-sm"
        />
        <textarea name="notes" placeholder="Notas" className="w-full rounded bg-neutral-800 p-2 text-sm" />
        <button className="rounded bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900">
          Guardar
        </button>
      </form>
    </div>
  );
}
