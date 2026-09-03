import { createClient } from "@/lib/supabase/server";
import { addProgress } from "@/lib/actions/progress";
import { Card, PageHeader, Input, Select, Textarea, PrimaryButton } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAcademiaFields } from "@/lib/terminology";

const VALORACIONES = ["Excelente", "Bien", "Regular", "Floja"];

// Módulo "seguimiento": en academia es una entrada por clase (asignatura +
// tema visto + valoración + deberes/notas); el resto de verticales sigue
// con la métrica genérica de siempre (peso, dolor, medidas...).
export default async function SeguimientoPage() {
  const supabase = createClient();
  const { companyId, vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const showAcademia = showsAcademiaFields(vertical);
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: entries } = await supabase
    .from("activities")
    .select("id, created_at, custom_fields, contacts(full_name)")
    .eq("type", "progress")
    .order("created_at", { ascending: false })
    .limit(50);

  let subjects: { id: string; name: string }[] = [];
  if (showAcademia) {
    const { data: subjectRows } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("company_id", companyId)
      .order("name");
    subjects = subjectRows ?? [];
  }

  return (
    <div>
      <PageHeader title="Seguimiento de progreso" />

      <Card className="mb-6">
        {showAcademia ? (
          <form action={addProgress} className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <Select name="contact_id" required>
              <option value="">{terms.contact}</option>
              {(contacts ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </Select>
            <Select name="asignatura" required defaultValue="">
              <option value="" disabled>
                Asignatura
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Input name="tema" placeholder="Tema visto en la clase" required className="sm:col-span-2" />
            <Select name="valoracion" defaultValue="">
              <option value="" disabled>
                Valoración
              </option>
              {VALORACIONES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
            <Textarea name="notas" placeholder="Deberes / notas (opcional)" className="sm:col-span-2" rows={2} />
            <PrimaryButton className="sm:col-start-2 sm:justify-self-start">Añadir</PrimaryButton>
          </form>
        ) : (
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
        )}
      </Card>

      <Card>
        <ul className="space-y-2 text-sm">
          {(entries ?? []).map((e: any) => (
            <li key={e.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
              <span className="text-slate/70">{new Date(e.created_at).toLocaleString("es-ES")}</span>{" — "}
              <span className="font-medium text-ink">{e.contacts?.full_name}</span>:{" "}
              {e.custom_fields?.asignatura ? (
                <span className="text-slate">
                  {e.custom_fields.asignatura} — {e.custom_fields.tema}
                  {e.custom_fields.valoracion ? ` (${e.custom_fields.valoracion})` : ""}
                  {e.custom_fields.notas ? `. ${e.custom_fields.notas}` : ""}
                </span>
              ) : (
                <span className="text-slate">
                  {e.custom_fields?.label} = {e.custom_fields?.value}
                </span>
              )}
            </li>
          ))}
          {(entries ?? []).length === 0 && <li className="text-slate/70">Sin entradas todavía.</li>}
        </ul>
      </Card>
    </div>
  );
}
