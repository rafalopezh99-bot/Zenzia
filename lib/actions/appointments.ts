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
  const duration_hours = Number(formData.get("duration_hours") ?? 0);
  const duration_minutes = duration_hours > 0 ? Math.round(duration_hours * 60) : 30;

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

// Edición de una cita/clase puntual ya creada (desde /citas/[id]/editar).
// No toca schedule_id: si la cita viene de un horario recurrente sigue
// perteneciendo a él, solo cambian sus datos concretos.
export async function updateAppointment(appointmentId: string, formData: FormData) {
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const starts_at = String(formData.get("starts_at") ?? "");
  const duration_hours = Number(formData.get("duration_hours") ?? 0);
  const duration_minutes = duration_hours > 0 ? Math.round(duration_hours * 60) : 30;
  const status = String(formData.get("status") ?? "scheduled");

  if (!contact_id || !starts_at) throw new Error("Contacto y fecha son obligatorios");

  const start = new Date(starts_at);
  const end = new Date(start.getTime() + duration_minutes * 60000);

  const { error } = await supabase
    .from("appointments")
    .update({
      contact_id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status,
      notes: String(formData.get("notes") ?? "") || null,
    })
    .eq("id", appointmentId);
  if (error) throw new Error(error.message);

  revalidatePath("/citas");
  redirect("/citas");
}

export async function deleteAppointment(appointmentId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", appointmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/citas");
  redirect("/citas");
}

// Horario recurrente: en vez de crear cada clase a mano, se define el día
// de la semana y la franja horaria una vez y el ciclo diario en Postgres
// (generate_recurring_appointments) va materializando las próximas 8
// semanas de citas automáticamente — mismo patrón que el cobro recurrente
// de bonos. Al crear el horario se genera también la primera tanda al
// momento, sin esperar al ciclo del día siguiente.
export async function createClassSchedule(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const weekday = Number(formData.get("weekday") ?? 0);
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!contact_id || !weekday || !start_time || !end_time) {
    throw new Error("Alumno, día y horario son obligatorios");
  }
  if (end_time <= start_time) throw new Error("La hora de fin debe ser posterior a la de inicio");

  const { data: schedule, error } = await supabase
    .from("class_schedules")
    .insert({
      company_id: companyId,
      contact_id,
      weekday,
      start_time,
      end_time,
      notes: notes || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (schedule) {
    const { error: genError } = await supabase.rpc("generate_appointments_for_schedule", {
      p_schedule_id: schedule.id,
    });
    if (genError) throw new Error(genError.message);
  }

  revalidatePath("/citas");
  redirect("/citas");
}
