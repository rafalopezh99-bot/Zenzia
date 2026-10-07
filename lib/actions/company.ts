"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureVerifactuNif, startRepresentation } from "@/lib/verifactu/nifs";
import { getCurrentCompanyId, getCurrentCompanyProfile } from "@/lib/company";
import { MODULE_CATALOG } from "@/lib/modules";
import { planAllowsModule } from "@/lib/plans";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Guarda todo el perfil del negocio de una vez: datos básicos (nombre,
// vertical, cómo opera, quién lo gestiona), contacto/facturación, y el
// logo si se ha elegido uno nuevo — un único formulario con un único botón
// "Guardar" en /perfil, mismo criterio que la ficha de contacto.
export async function updateCompanyProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyId = await getCurrentCompanyId();

  // Perfil está dividido en pestañas y cada una envía solo sus campos: se
  // actualiza únicamente lo que llega en el formulario.
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const companyUpdate: Record<string, unknown> = {};
  if (formData.has("name")) {
    if (!text("name")) throw new Error("El nombre del negocio es obligatorio");
    companyUpdate.name = text("name");
  }
  for (const k of ["phone", "email", "tax_id", "address", "postal_code", "city"]) {
    if (formData.has(k)) companyUpdate[k] = text(k) || null;
  }
  if (formData.has("default_vat")) companyUpdate.default_vat = Number(formData.get("default_vat"));
  if (formData.has("default_irpf")) companyUpdate.default_irpf = Number(formData.get("default_irpf"));
  const vertical = text("vertical");
  const business_type = text("business_type");
  const tax_id = text("tax_id");
  // Reservas online y reseñas: solo llegan si el plan las incluye.
  if (formData.has("booking_duration")) {
    companyUpdate.booking = {
      enabled: formData.get("booking_enabled") === "on",
      duration: Number(formData.get("booking_duration")) || 60,
      days: formData.getAll("booking_days").map(Number),
      start: String(formData.get("booking_start") || "09:00"),
      end: String(formData.get("booking_end") || "19:00"),
    };
  }
  if (formData.has("google_review_url")) {
    companyUpdate.google_review_url = String(formData.get("google_review_url") ?? "").trim() || null;
  }
  if (vertical) companyUpdate.vertical = vertical;
  if (business_type) companyUpdate.business_type = business_type;

  // Logo opcional: si no se ha elegido archivo nuevo, se deja tal cual está
  // (el input queda vacío en el formulario a propósito, no se reenvía el
  // que ya hay). Nombre de archivo fijo (sin extensión) + upsert, para que
  // cada logo nuevo sustituya al anterior en vez de acumular huérfanos.
  const logo = formData.get("logo") as File | null;
  if (logo && logo.size > 0) {
    if (!logo.type.startsWith("image/")) throw new Error("El logo debe ser una imagen");
    if (logo.size > 4 * 1024 * 1024) throw new Error("El logo no puede pesar más de 4 MB");
    const path = `${companyId}/logo`;
    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, logo, { upsert: true, contentType: logo.type });
    if (uploadError) throw new Error(uploadError.message);
    companyUpdate.logo_path = path;
  }

  const { data: saved, error: companyError } = await supabase
    .from("companies")
    .update(companyUpdate)
    .eq("id", companyId)
    .select("name")
    .single();
  if (companyError) throw new Error(companyError.message);
  // Alta del NIF en VeriFactu (Verifacti) en cuanto hay NIF fiscal.
  if (tax_id) await ensureVerifactuNif(companyId, tax_id, saved?.name ?? "");

  if (formData.has("manager_name")) {
    const { error: memberError } = await supabase
      .from("company_users")
      .update({ full_name: text("manager_name") || null })
      .eq("user_id", user.id)
      .eq("company_id", companyId);
    if (memberError) throw new Error(memberError.message);
  }

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  redirect(`/perfil?tab=${text("tab") || "negocio"}&ok=1`);
}

// Botón "Firmar representación" de Perfil: abre la firma remota de Verifacti.
export async function signVerifactuRepresentation() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { data } = await supabase.from("companies").select("tax_id, verifactu_state").eq("id", companyId).single();
  if (!data?.tax_id) throw new Error("Añade primero tu NIF");
  const { url, error } = await startRepresentation(data.tax_id.toUpperCase().replace(/[^A-Z0-9]/g, ""));
  await supabase
    .from("companies")
    .update({ verifactu_state: { ...(data.verifactu_state ?? {}), representation_url: url, representation_error: error ?? null } })
    .eq("id", companyId);
  if (url) redirect(url);
  revalidatePath("/perfil");
}

// Perfil > Negocio > Módulos: activa o desactiva los módulos opcionales.
export async function setCompanyModules(formData: FormData) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { plan } = await getCurrentCompanyProfile();
  const wanted = new Set(formData.getAll("modules").map(String));
  const CORE = ["agenda", "facturacion", "presupuestos"];
  const optional = MODULE_CATALOG.filter((m) => !CORE.includes(m.key) && planAllowsModule(plan, m.key));
  const { data: rows } = await supabase.from("company_modules").select("module_key").eq("company_id", companyId);
  const existing = new Set((rows ?? []).map((r) => r.module_key));
  for (const m of optional) {
    const enabled = wanted.has(m.key);
    if (existing.has(m.key)) {
      await supabase.from("company_modules").update({ enabled }).eq("company_id", companyId).eq("module_key", m.key);
    } else if (enabled) {
      await supabase.from("company_modules").insert({ company_id: companyId, module_key: m.key, enabled: true });
    }
  }
  revalidatePath("/", "layout");
  redirect("/perfil?tab=negocio&ok=1");
}
