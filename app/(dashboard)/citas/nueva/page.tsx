import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";
import NuevaClaseForm from "@/components/NuevaClaseForm";

export default async function NuevaCitaPage() {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, custom_fields")
    .order("full_name");

  const contactOptions = (contacts ?? []).map((c: any) => ({
    id: c.id,
    full_name: c.full_name,
    curso: c.custom_fields?.curso ?? null,
  }));

  return (
    <div>
      <PageHeader title={terms.newAppointment} />
      <NuevaClaseForm contacts={contactOptions} contactLabel={terms.contact} />
    </div>
  );
}
