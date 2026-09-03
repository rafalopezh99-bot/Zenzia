import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateAppointment, deleteAppointment } from "@/lib/actions/appointments";
import { Card, PageHeader, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/ui";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/appointmentStatus";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";

export default async function EditarCitaPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, contact_id, starts_at, ends_at, status, notes")
    .eq("id", params.id)
    .single();
  if (!appointment) notFound();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, custom_fields")
    .order("full_name");
  const contactOptions = (contacts ?? []).map((c: any) => ({
    id: c.id,
    full_name: c.full_name,
    curso: c.custom_fields?.curso ?? null,
  }));

  // datetime-local no lleva zona horaria: se reconstruye a partir de los
  // mismos componentes UTC con los que createAppointment/updateAppointment
  // guardan la fecha, para que reabrir y guardar sin tocar nada no mueva
  // la hora.
  const startsAtLocal = new Date(appointment.starts_at).toISOString().slice(0, 16);
  const durationHours =
    (new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 3600000;

  const updateThisAppointment = updateAppointment.bind(null, appointment.id);
  const deleteThisAppointment = deleteAppointment.bind(null, appointment.id);

  return (
    <div>
      <PageHeader title={`Editar ${terms.appointment.toLowerCase()}`} />
      <Card className="max-w-sm">
        <form action={updateThisAppointment} className="space-y-3">
          <Select name="contact_id" required defaultValue={appointment.contact_id} className="w-full">
            {contactOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
                {c.curso ? ` — ${c.curso}` : ""}
              </option>
            ))}
          </Select>
          <Input name="starts_at" type="datetime-local" required defaultValue={startsAtLocal} className="w-full" />
          <Input
            name="duration_hours"
            type="number"
            step="0.5"
            min="0.5"
            defaultValue={durationHours}
            placeholder="Duración de la clase (horas)"
            className="w-full"
          />
          <Select name="status" defaultValue={appointment.status} className="w-full">
            {Object.entries(APPOINTMENT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Textarea name="notes" placeholder="Notas" defaultValue={appointment.notes ?? ""} className="w-full" />
          <PrimaryButton>Guardar cambios</PrimaryButton>
        </form>
        <form action={deleteThisAppointment} className="mt-3 border-t border-line pt-3">
          <GhostButton>Eliminar {terms.appointment.toLowerCase()}</GhostButton>
        </form>
      </Card>
    </div>
  );
}
