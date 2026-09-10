"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Guarda todo el perfil del negocio de una vez: datos básicos (nombre,
// vertical, cómo opera, quién lo gestiona), contacto/facturación, y el
// logo si se ha elegido uno nuevo — un único formulario con un único botón
// "Guardar" en /perfil, mismo criterio que la ficha de contacto.
export async function updateCompanyProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyId = await getCurrentCompanyId();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("El nombre de la empresa es obligatorio");
  const vertical = String(formData.get("vertical") ?? "").trim();
  const business_type = String(formData.get("business_type") ?? "").trim();
  const manager_name = String(formData.get("manager_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const tax_id = String(formData.get("tax_id") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  const companyUpdate: Record<string, unknown> = {
    name,
    phone: phone || null,
    email: email || null,
    tax_id: tax_id || null,
    address: address || null,
  };
  if (vertical) companyUpdate.vertical = vertical;
  if (business_type) companyUpdate.business_type = business_type;

  // Logo opcional: si no se ha elegido archivo nuevo, se deja tal cual está
  // (el input queda vacío en el formulario a propósito, no se reenvía el
  // que ya hay). Nombre de archivo fijo (sin extensión) + upsert, para que
  // cada logo nuevo sustituya al anterior en vez de acumular huérfanos.
  const logo = formData.get("logo") as File | null;
  if (logo && logo.size > 0) {
    if (!logo.type.startsWith("image/")) throw new Error("El logo debe ser una imagen");
    const path = `${companyId}/logo`;
    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, logo, { upsert: true, contentType: logo.type });
    if (uploadError) throw new Error(uploadError.message);
    companyUpdate.logo_path = path;
  }

  const { error: companyError } = await supabase.from("companies").update(companyUpdate).eq("id", companyId);
  if (companyError) throw new Error(companyError.message);

  const { error: memberError } = await supabase
    .from("company_users")
    .update({ full_name: manager_name || null })
    .eq("user_id", user.id)
    .eq("company_id", companyId);
  if (memberError) throw new Error(memberError.message);

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  redirect("/perfil");
}
