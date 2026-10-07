"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signConsent(token: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("public_sign_consent", {
    p_token: token,
    p_name: String(formData.get("name") ?? ""),
    p_signature: String(formData.get("signature") ?? ""),
  });
  redirect(`/consentimiento/${token}${error ? `?error=${encodeURIComponent(error.message)}` : ""}`);
}
