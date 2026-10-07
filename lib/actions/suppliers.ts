"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";

// Proveedores: ficha simple (sin custom_fields, sin pipeline, sin citas) —
// a diferencia de /contactos, que es multi-vertical y lleva un montón de
// campos condicionales. Un proveedor es siempre lo mismo para cualquier
// tipo de negocio: a quién le compras, cómo le contactas, para qué.
export async function createSupplier(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("El nombre es obligatorio");

  const { error } = await supabase.from("suppliers").insert({
    company_id: companyId,
    name,
    contact_person: String(formData.get("contact_person") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    tax_id: String(formData.get("tax_id") ?? "").trim() || null,
    category: String(formData.get("category") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/proveedores");
}

export async function updateSupplier(supplierId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("El nombre es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({
      name,
      contact_person: String(formData.get("contact_person") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      tax_id: String(formData.get("tax_id") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", supplierId);
  if (error) throw new Error(error.message);

  revalidatePath("/proveedores");
}

export async function deleteSupplier(supplierId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", supplierId);
  if (error) throw new Error(error.message);

  revalidatePath("/proveedores");
}
