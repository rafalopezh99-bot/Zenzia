"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createContact(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) throw new Error("El nombre es obligatorio");

  const demo_url = String(formData.get("demo_url") ?? "").trim();

  const { error } = await supabase.from("contacts").insert({
    company_id: companyId,
    full_name,
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    status: "active",
    custom_fields: demo_url ? { demo_url } : {},
  });
  if (error) throw new Error(error.message);

  revalidatePath("/contactos");
  redirect("/contactos");
}

// Cambia la etapa del pipeline de venta (nuevo lead → contactado →
// propuesta enviada → negociación → cliente/perdido). Se guarda en
// custom_fields para no tocar el esquema — no todos los verticales lo usan.
export async function updateContactStage(contactId: string, formData: FormData) {
  const stage = String(formData.get("stage") ?? "");
  const supabase = createClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("custom_fields")
    .eq("id", contactId)
    .single();

  const custom_fields = { ...(contact?.custom_fields ?? {}), pipeline_stage: stage };

  const { error } = await supabase.from("contacts").update({ custom_fields }).eq("id", contactId);
  if (error) throw new Error(error.message);

  revalidatePath(`/contactos/${contactId}`);
  revalidatePath("/contactos");
}

// Enlace libre asociado al contacto (demo, propuesta, drive...). Se guarda
// en custom_fields, igual que la etapa del pipeline.
export async function updateContactLink(contactId: string, formData: FormData) {
  const demo_url = String(formData.get("demo_url") ?? "").trim();
  const supabase = createClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("custom_fields")
    .eq("id", contactId)
    .single();

  const custom_fields = { ...(contact?.custom_fields ?? {}), demo_url };

  const { error } = await supabase.from("contacts").update({ custom_fields }).eq("id", contactId);
  if (error) throw new Error(error.message);

  revalidatePath(`/contactos/${contactId}`);
}

// Nota de historial ligada a un contacto concreto. El id del contacto se
// pasa con .bind(null, contactId) al usar esta acción como form action.
export async function addActivity(contactId: string, formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const { error } = await supabase.from("activities").insert({
    company_id: companyId,
    contact_id: contactId,
    type: "note",
    content,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/contactos/${contactId}`);
}
