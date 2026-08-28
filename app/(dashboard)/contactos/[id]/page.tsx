import { createClient } from "@/lib/supabase/server";
import { addActivity } from "@/lib/actions/contacts";
import { notFound } from "next/navigation";

export default async function ContactoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: contact } = await supabase.from("contacts").select("*").eq("id", params.id).single();
  if (!contact) notFound();

  const { data: activities } = await supabase
    .from("activities")
    .select("id, type, content, created_at")
    .eq("contact_id", params.id)
    .order("created_at", { ascending: false });

  const addActivityForContact = addActivity.bind(null, params.id);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold">{contact.full_name}</h1>
      <p className="mb-6 text-sm text-neutral-400">
        {contact.phone} {contact.phone && contact.email && "·"} {contact.email}
      </p>

      <h2 className="mb-2 font-medium">Historial</h2>
      <form action={addActivityForContact} className="mb-4 flex gap-2">
        <input
          name="content"
          placeholder="Añadir nota..."
          className="flex-1 rounded bg-neutral-800 p-2 text-sm"
        />
        <button className="rounded bg-neutral-100 px-3 text-sm font-medium text-neutral-900">Añadir</button>
      </form>

      <ul className="space-y-2 text-sm">
        {(activities ?? []).map((a) => (
          <li key={a.id} className="border-b border-neutral-800 pb-2">
            <span className="text-neutral-500">{new Date(a.created_at).toLocaleString("es-ES")}</span> —{" "}
            {a.content}
          </li>
        ))}
        {(activities ?? []).length === 0 && <li className="text-neutral-500">Sin notas todavía.</li>}
      </ul>
    </div>
  );
}
