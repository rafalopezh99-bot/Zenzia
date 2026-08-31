import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";

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
      <PageHeader title="Historial" />
      <Card>
        <ul className="space-y-2 text-sm">
          {(activities ?? []).map((a: any) => (
            <li key={a.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
              <span className="text-slate/70">{new Date(a.created_at).toLocaleString("es-ES")}</span>{" — "}
              <span className="font-medium text-ink">{a.contacts?.full_name}</span>:{" "}
              <span className="text-slate">{a.content}</span>
            </li>
          ))}
          {(activities ?? []).length === 0 && <li className="text-slate/70">Sin registros todavía.</li>}
        </ul>
      </Card>
    </div>
  );
}
