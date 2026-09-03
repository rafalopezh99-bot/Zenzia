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
  const business_type = String(formData.get("business_type") ?? "").trim();
  const curso = String(formData.get("curso") ?? "").trim();
  const bono_type_id = String(formData.get("bono_type_id") ?? "").trim();
  // Casillas de asignatura: pueden llegar 0, 1 o varias con el mismo name.
  const subjects = formData
    .getAll("subjects")
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (subjects.length > 7) throw new Error("Como máximo se pueden elegir 7 asignaturas");

  const custom_fields: Record<string, unknown> = {};
  if (demo_url) custom_fields.demo_url = demo_url;
  if (business_type) custom_fields.business_type = business_type;
  if (curso) custom_fields.curso = curso;
  if (subjects.length) custom_fields.subjects = subjects;

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      company_id: companyId,
      full_name,
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      status: "active",
      custom_fields,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Si se ha elegido un bono al dar de alta (vertical academia), se activa
  // ya con sus horas listas para consumir — mismo efecto que crearlo a mano
  // después desde /bonos, pero sin ese paso extra.
  if (bono_type_id && contact) {
    const { data: bonoType } = await supabase
      .from("bono_types")
      .select("name, sessions")
      .eq("id", bono_type_id)
      .single();

    if (bonoType) {
      const { error: packageError } = await supabase.from("packages").insert({
        contact_id: contact.id,
        name: bonoType.name,
        total_sessions: bonoType.sessions,
      });
      if (packageError) throw new Error(packageError.message);
    }
  }

  revalidatePath("/contactos");
  revalidatePath("/bonos");
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

// Tipo de negocio del contacto (ej. "centro de estética"), igual que el
// enlace de la demo: se guarda en custom_fields, sin migración de esquema.
export async function updateContactBusinessType(contactId: string, formData: FormData) {
  const business_type = String(formData.get("business_type") ?? "").trim();
  const supabase = createClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("custom_fields")
    .eq("id", contactId)
    .single();

  const custom_fields = { ...(contact?.custom_fields ?? {}), business_type };

  const { error } = await supabase.from("contacts").update({ custom_fields }).eq("id", contactId);
  if (error) throw new Error(error.message);

  revalidatePath(`/contactos/${contactId}`);
  revalidatePath("/contactos");
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
