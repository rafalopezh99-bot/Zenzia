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
  const instagram_handle = String(formData.get("instagram_handle") ?? "")
    .trim()
    .replace(/^@/, "");
  const contacted_via = String(formData.get("contacted_via") ?? "").trim();
  const stage = String(formData.get("stage") ?? "").trim();
  const curso = String(formData.get("curso") ?? "").trim();
  const bono_type_id = String(formData.get("bono_type_id") ?? "").trim();
  // Datos de facturación del cliente: para poder emitir factura/presupuesto
  // en PDF con sus datos fiscales sin tener que pedirlos cada vez.
  const tax_id = String(formData.get("tax_id") ?? "").trim();
  const billing_address = String(formData.get("billing_address") ?? "").trim();
  const postal_code = String(formData.get("postal_code") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const billing_frequency = String(formData.get("billing_frequency") ?? "").trim();
  // Casillas de asignatura: pueden llegar 0, 1 o varias con el mismo name.
  const subjects = formData
    .getAll("subjects")
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (subjects.length > 7) throw new Error("Como máximo se pueden elegir 7 asignaturas");

  const custom_fields: Record<string, unknown> = {};
  if (demo_url) custom_fields.demo_url = demo_url;
  if (business_type) custom_fields.business_type = business_type;
  if (instagram_handle) custom_fields.instagram_handle = instagram_handle;
  if (contacted_via) custom_fields.contacted_via = contacted_via;
  // La etapa se elige ya al dar de alta — antes quedaba fija en "nuevo
  // lead" hasta que alguien entraba a la ficha a cambiarla a mano.
  if (stage) custom_fields.pipeline_stage = stage;
  if (curso) custom_fields.curso = curso;
  if (subjects.length) custom_fields.subjects = subjects;
  if (tax_id) custom_fields.tax_id = tax_id;
  if (billing_address) custom_fields.billing_address = billing_address;
  if (postal_code) custom_fields.postal_code = postal_code;
  if (province) custom_fields.province = province;
  if (country) custom_fields.country = country;
  if (billing_frequency) custom_fields.billing_frequency = billing_frequency;

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
  // después desde /bonos, pero sin ese paso extra. Al quedar enlazado a la
  // tarifa (bono_type_id) entra también en el cobro recurrente: se genera
  // ya la primera factura pendiente de este periodo, y el ciclo diario se
  // encargará de las siguientes mientras el bono siga activo.
  if (bono_type_id && contact) {
    const { data: bonoType } = await supabase
      .from("bono_types")
      .select("name, sessions")
      .eq("id", bono_type_id)
      .single();

    if (bonoType) {
      const { data: pkg, error: packageError } = await supabase
        .from("packages")
        .insert({
          contact_id: contact.id,
          name: bonoType.name,
          total_sessions: bonoType.sessions,
          bono_type_id,
        })
        .select("id")
        .single();
      if (packageError) throw new Error(packageError.message);

      if (pkg) {
        const { error: invoiceError } = await supabase.rpc("generate_invoice_for_package", {
          p_package_id: pkg.id,
        });
        if (invoiceError) throw new Error(invoiceError.message);
      }
    }
  }

  revalidatePath("/contactos");
  revalidatePath("/bonos");
  revalidatePath("/facturacion");
  redirect("/contactos");
}

// Cambia solo la etapa del pipeline, para el desplegable en línea del
// listado de contactos (Rafa quería poder mover la etapa sin entrar en la
// ficha de cada contacto). No redirige: la fila ya está en /contactos,
// revalidar el path basta para que la tabla refleje el cambio.
export async function updateContactStageInline(contactId: string, stage: string) {
  const supabase = createClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("custom_fields")
    .eq("id", contactId)
    .single();

  const custom_fields = { ...(contact?.custom_fields ?? {}), pipeline_stage: stage };
  const { error } = await supabase.from("contacts").update({ custom_fields }).eq("id", contactId);
  if (error) throw new Error(error.message);

  revalidatePath("/contactos");
}

// Guarda toda la ficha del contacto de una vez: nombre/teléfono/email
// (columnas reales) y el resto de campos libres del pipeline
// (business_type, instagram_handle, contacted_via, pipeline_stage,
// demo_url), que van en custom_fields. Antes había una acción y un botón
// "Guardar" distinto por cada bloque de la ficha; ahora todo vive en un
// único <form> con un único botón al final, y al terminar vuelve al
// listado de contactos en vez de quedarse en la misma ficha.
export async function updateContact(contactId: string, formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) throw new Error("El nombre es obligatorio");
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("contacts")
    .select("custom_fields")
    .eq("id", contactId)
    .single();

  const business_type = String(formData.get("business_type") ?? "").trim();
  const instagram_handle = String(formData.get("instagram_handle") ?? "")
    .trim()
    .replace(/^@/, "");
  const contacted_via = String(formData.get("contacted_via") ?? "").trim();
  const stage = String(formData.get("stage") ?? "").trim();
  const demo_url = String(formData.get("demo_url") ?? "").trim();
  const tax_id = String(formData.get("tax_id") ?? "").trim();
  const billing_address = String(formData.get("billing_address") ?? "").trim();
  const postal_code = String(formData.get("postal_code") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const billing_frequency = String(formData.get("billing_frequency") ?? "").trim();

  // Se parte de lo que ya había en custom_fields (para no perder curso /
  // subjects del vertical academia, que este formulario no toca) y se
  // sobreescriben solo los campos del pipeline y de facturación.
  const custom_fields: Record<string, unknown> = { ...(existing?.custom_fields ?? {}) };
  custom_fields.business_type = business_type;
  custom_fields.instagram_handle = instagram_handle;
  custom_fields.contacted_via = contacted_via;
  custom_fields.demo_url = demo_url;
  if (stage) custom_fields.pipeline_stage = stage;
  custom_fields.tax_id = tax_id;
  custom_fields.billing_address = billing_address;
  custom_fields.postal_code = postal_code;
  custom_fields.province = province;
  custom_fields.country = country;
  custom_fields.billing_frequency = billing_frequency;

  const { error } = await supabase
    .from("contacts")
    .update({ full_name, phone: phone || null, email: email || null, custom_fields })
    .eq("id", contactId);
  if (error) throw new Error(error.message);

  revalidatePath(`/contactos/${contactId}`);
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
  redirect(`/contactos/${contactId}`);
}
