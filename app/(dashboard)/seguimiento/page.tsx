import { createClient } from "@/lib/supabase/server";
import { addProgress } from "@/lib/actions/progress";
import { Card, PageHeader, Input, Select, PrimaryButton } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";

// Módulo "seguimiento": entradas de progreso genéricas (peso, dolor,
// medidas...) — cada vertical usa la métrica que necesita sin tocar código.
export default async function SeguimientoPage() {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: entries } = await supabase
    .from("activities")
    .select("id, created_at, custom_fields, contacts(full_name)")
    .eq("type", "progress")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader title="Seguimiento de progreso" />

      <Card className="mb-6">
        <form action={addProgress} className="flex flex-wrap items-end gap-2 text-sm">
          <Select name="contact_id" required>
            <option value="">{terms.contact}</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Input name="label" placeholder="Métrica (ej. peso, dolor)" required />
          <Input name="value" placeholder="Valor" required className="w-24" />
          <PrimaryButton>Añadir</PrimaryButton>
        </form>
      </Card>

      <Card>
        <ul className="space-y-2 text-sm">
          {(entries ?? []).map((e: any) => (
            <li key={e.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
              <span className="text-slate/70">{new Date(e.created_at).toLocaleString("es-ES")}</span>{" — "}
              <span className="font-medium text-ink">{e.contacts?.full_name}</span>:{" "}
              <span className="text-slate">
                {e.custom_fields?.label} = {e.custom_fields?.value}
              </span>
            </li>
          ))}
          {(entries ?? []).length === 0 && <li className="text-slate/70">Sin entradas todavía.</li>}
        </ul>
      </Card>
    </div>
  );
}
