import { createClient } from "@/lib/supabase/server";

// Módulo "historial_clinico": vista global de sesiones/notas de todos los
// contactos. La ficha por contacto individual vive en /contactos/[id].
export default async function HistorialPage() {
  const supabase = createClient();
  const { data: activities } = await supabase
    .from("activities")
    .select("id, type, content, created_at, contacts(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Historial</h1>
      <ul className="space-y-2 text-sm">
        {(activities ?? []).map((a: any) => (
          <li key={a.id} className="border-b border-neutral-800 pb-2">
            <span className="text-neutral-500">{new Date(a.created_at).toLocaleString("es-ES")}</span>{" — "}
            <span className="font-medium">{a.contacts?.full_name}</span>: {a.content}
          </li>
        ))}
        {(activities ?? []).length === 0 && <li className="text-neutral-500">Sin registros todavía.</li>}
      </ul>
    </div>
  );
}
