"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function cancelAppointmentByToken(token: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("public_cancel_appointment", { p_token: token });
  redirect(`/cita/${token}?${error ? `error=${encodeURIComponent(error.message)}` : "cancelada=1"}`);
}
