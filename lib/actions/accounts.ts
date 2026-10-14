"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Activar / cambiar plan de una cuenta (solo el admin de Zenzia; lo comprueba la base de datos).
export async function updateAccount(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_company", {
    p_company: companyId,
    p_plan: String(formData.get("plan") ?? "start"),
    p_status: String(formData.get("status") ?? "trial"),
    p_trial_ends: String(formData.get("trial_ends") ?? "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/cuentas");
}
