import { createClient } from "@/lib/supabase/server";
import { createAppointment } from "@/lib/actions/appointments";
import { Card, PageHeader, Input, Select, Textarea, PrimaryButton } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";

export default async function NuevaCitaPage() {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");

  return (
    <div>
      <PageHeader title={terms.newAppointment} />
      <Card className="max-w-sm">
        <form action={createAppointment} className="space-y-3">
          <Select name="contact_id" required className="w-full">
            <option value="">Selecciona {terms.contact.toLowerCase()}</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Input name="starts_at" type="datetime-local" required className="w-full" />
          <Input name="duration_minutes" type="number" defaultValue={30} className="w-full" />
          <Textarea name="notes" placeholder="Notas" className="w-full" />
          <PrimaryButton>Guardar</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
