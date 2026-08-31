"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProspect(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const contact_name = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const instagram_handle = String(formData.get("instagram_handle") ?? "")
    .trim()
    .replace(/^@/, "");
  const business_type = String(formData.get("business_type") ?? "").trim();
  const business_name = String(formData.get("business_name") ?? "").trim();
  const service_offer = String(formData.get("service_offer") ?? "").trim();

  if (!contact_name) throw new Error("El nombre de contacto es obligatorio");
  if (!email && !instagram_handle) throw new Error("Necesitas al menos un email o un Instagram de contacto");

  const { error } = await supabase.from("prospects").insert({
    company_id: companyId,
    contact_name,
    email: email || null,
    instagram_handle: instagram_handle || null,
    business_type: business_type || null,
    business_name: business_name || null,
    service_offer: service_offer || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/clientes");
  redirect("/clientes");
}

// Se llama al abrir la plantilla de contacto (ver
// components/ContactarClienteButton.tsx) — no manda ningún email, solo
// deja constancia de que ya generaste el mensaje para este cliente.
export async function markProspectContacted(prospectId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("prospects").update({ status: "contactado" }).eq("id", prospectId);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}
