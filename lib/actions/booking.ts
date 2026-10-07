"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Reserva desde la página pública: toda la validación (hueco libre, plan,
// reservas activadas) la hace la función public_book en la base de datos.
export async function bookAppointment(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const startsAt = String(formData.get("starts_at") ?? "");
  const { error } = await supabase.rpc("public_book", {
    p_company: companyId,
    p_name: String(formData.get("name") ?? ""),
    p_phone: String(formData.get("phone") ?? ""),
    p_email: String(formData.get("email") ?? ""),
    p_starts_at: startsAt,
    p_service: String(formData.get("service_id") ?? "") || null,
  });
  if (error) redirect(`/reservar/${companyId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/reservar/${companyId}?ok=${encodeURIComponent(startsAt)}`);
}
