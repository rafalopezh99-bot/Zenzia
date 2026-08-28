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

  const { error } = await supabase.from("contacts").insert({
    company_id: companyId,
    full_name,
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    status: "active",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/contactos");
  redirect("/contactos");
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
