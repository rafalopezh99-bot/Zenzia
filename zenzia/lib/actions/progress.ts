"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";

export async function addProgress(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (!contact_id || !label || !value) throw new Error("Faltan datos de seguimiento");

  const { error } = await supabase.from("activities").insert({
    company_id: companyId,
    contact_id,
    type: "progress",
    custom_fields: { label, value },
  });
  if (error) throw new Error(error.message);

  revalidatePath("/seguimiento");
}
