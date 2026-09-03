"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPackage(formData: FormData) {
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const total_sessions = Number(formData.get("total_sessions") ?? 0);

  if (!contact_id || !name || !total_sessions) throw new Error("Faltan datos del bono");

  const { error } = await supabase.from("packages").insert({ contact_id, name, total_sessions });
  if (error) throw new Error(error.message);

  revalidatePath("/bonos");
  redirect("/bonos");
}

export async function usePackageSession(packageId: string, currentUsed: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("packages")
    .update({ used_sessions: currentUsed + 1 })
    .eq("id", packageId);
  if (error) throw new Error(error.message);
  revalidatePath("/bonos");
}

// Da de baja (o reactiva) el cobro recurrente de un bono de tarifa: mientras
// esté "de baja" el ciclo diario (generate_recurring_invoices) deja de
// generarle facturas nuevas, sin perder el historial de sesiones ni las
// facturas ya emitidas.
export async function togglePackageActive(packageId: string, currentActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("packages").update({ active: !currentActive }).eq("id", packageId);
  if (error) throw new Error(error.message);
  revalidatePath("/bonos");
}
