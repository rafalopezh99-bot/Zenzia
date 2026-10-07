import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateAppointment, deleteAppointment, setAppointmentStatus } from "@/lib/actions/appointments";
import Link from "next/link";
import { chargeAppointment, applyBonoToAppointment } from "@/lib/actions/documents";
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS } from "@/lib/paymentMethod";
import NoteTemplatePicker from "@/components/NoteTemplatePicker";
import { noteTemplatesFor } from "@/lib/noteTemplates";
import { Card, PageHeader, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/ui";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/appointmentStatus";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";
import { toAppLocalInput } from "@/lib/timezone";

export default async function EditarCitaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { vertical, plan } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);

  // Ninguna depende de la otra, así que se piden a la vez en vez de una
  // detrás de otra.
  const [{ data: appointment }, { data: contacts }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, contact_id, starts_at, ends_at, status, notes, reminder_sent, price, invoice_id, package_id, paid_method, services(name, price)")
      .eq("id", params.id)
      .single(),
    supabase.from("contacts").select("id, full_name, custom_fields").order("full_name"),
  ]);
  if (!appointment) notFound();
  const service: any = Array.isArray(appointment.services) ? appointment.services[0] : appointment.services;
  // Bono activo con sesiones libres del cliente, para "descontar del bono".
  const { data: bonos } = await supabase
    .from("packages")
    .select("id, name, used_sessions, total_sessions")
    .eq("contact_id", appointment.contact_id)
    .eq("active", true);
  const bono = (bonos ?? []).find((b: any) => Number(b.used_sessions) < Number(b.total_sessions));
  const contactOptions = (contacts ?? []).map((c: any) => ({
    id: c.id,
    full_name: c.full_name,
    curso: c.custom_fields?.curso ?? null,
  }));

  // El input se prellena en hora de Sevilla/Madrid (igual que createAppointment/
  // updateAppointment la interpretan al guardar), para que lo que se ve aquí
  // sea la hora real de la clase y reabrir sin tocar nada no la mueva.
  const startsAtLocal = toAppLocalInput(appointment.starts_at);
  const durationHours =
    (new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 3600000;

  const updateThisAppointment = updateAppointment.bind(null, appointment.id);
  const deleteThisAppointment = deleteAppointment.bind(null, appointment.id);

  return (
    <div>
      <PageHeader title={`Editar ${terms.appointment.toLowerCase()}`} />
      <Card className="mb-4 max-w-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">Asistencia</div>
        <div className="flex gap-2">
          {(["completed", "no_show"] as const).map((st) => (
            <form key={st} action={setAppointmentStatus.bind(null, appointment.id, st)} className="flex-1">
              <button
                type="submit"
                className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  appointment.status === st
                    ? st === "completed"
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-slate bg-slate text-white"
                    : "border-line text-ink hover:border-brand"
                }`}
              >
                {st === "completed" ? "✓ Asistió" : "✗ No asistió"}
              </button>
            </form>
          ))}
        </div>
        {plan !== "start" && (
          <p className="mt-3 text-xs text-slate">
            {appointment.reminder_sent ? "✓ Recordatorio enviado" : "🔔 Se enviará un recordatorio 24 h antes"}
          </p>
        )}

      </Card>
      <Card className="mb-4 max-w-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">Cobro</div>
        {appointment.invoice_id ? (
          <p className="text-sm text-ink">
            ✓ Cobrada ({PAYMENT_METHOD_LABEL[appointment.paid_method as keyof typeof PAYMENT_METHOD_LABEL] ?? appointment.paid_method}) ·{" "}
            <a href={`/api/facturas/${appointment.invoice_id}/pdf`} target="_blank" className="font-semibold text-brand hover:underline">
              Ver factura
            </a>
          </p>
        ) : appointment.package_id ? (
          <p className="text-sm text-ink">✓ Descontada del bono</p>
        ) : (
          <div className="space-y-2">
            <form action={chargeAppointment.bind(null, appointment.id)} className="flex flex-wrap items-center gap-2">
              <Input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={appointment.price ?? service?.price ?? ""}
                placeholder="Precio €"
                className="w-24"
              />
              <Select name="payment_method" required defaultValue="" className="flex-1">
                <option value="" disabled>
                  Método de pago
                </option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </option>
                ))}
              </Select>
              <PrimaryButton className="w-full">Cobrar y facturar</PrimaryButton>
            </form>
            {bono && (
              <form action={applyBonoToAppointment.bind(null, appointment.id, bono.id)}>
                <GhostButton className="w-full">
                  Descontar del bono ({Number(bono.total_sessions) - Number(bono.used_sessions)} restantes)
                </GhostButton>
              </form>
            )}
          </div>
        )}
      </Card>
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
          <NoteTemplatePicker templates={noteTemplatesFor(vertical)} />
          <Textarea
            id="session-notes"
            name="notes"
            rows={8}
            placeholder="Notas de la sesión: cómo ha ido, qué se ha trabajado, próximos pasos..."
            defaultValue={appointment.notes ?? ""}
            className="w-full"
          />
          <PrimaryButton>Guardar cambios</PrimaryButton>
        </form>
        <form action={deleteThisAppointment} className="mt-3 border-t border-line pt-3">
          <GhostButton>Eliminar {terms.appointment.toLowerCase()}</GhostButton>
        </form>
      </Card>
    </div>
  );
}
