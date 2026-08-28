"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAppointment(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const starts_at = String(formData.get("starts_at") ?? "");
  const duration_minutes = Number(formData.get("duration_minutes") ?? 30);

  if (!contact_id || !starts_at) throw new Error("Contacto y fecha son obligatorios");

  const start = new Date(starts_at);
  const end = new Date(start.getTime() + duration_minutes * 60000);

  const { error } = await supabase.from("appointments").insert({
    company_id: companyId,
    contact_id,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    notes: String(formData.get("notes") ?? "") || null,
  });
  if (error) throw new Error(error.message);

  // Aquí es donde engancharía el recordatorio automático (WhatsApp/email) —
  // ej. una función programada que revise appointments.reminder_sent.
  revalidatePath("/citas");
  redirect("/citas");
}

export async function markAppointmentStatus(appointmentId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/citas");
}
