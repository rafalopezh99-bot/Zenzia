"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createConsent(formData: FormData) {
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!contact_id || !title) throw new Error("Cliente y título del documento son obligatorios");

  const { error } = await supabase.from("consents").insert({ contact_id, title });
  if (error) throw new Error(error.message);

  revalidatePath("/consentimientos");
  redirect("/consentimientos");
}

export async function markConsentSigned(consentId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("consents")
    .update({ signed: true, signed_at: new Date().toISOString() })
    .eq("id", consentId);
  if (error) throw new Error(error.message);
  revalidatePath("/consentimientos");
}
