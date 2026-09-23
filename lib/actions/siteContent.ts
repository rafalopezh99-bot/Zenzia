"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";

// Un único formulario con un único botón "Guardar", mismo criterio que
// /perfil: todo el contenido "fijo" de la web (encabezado, hero, nosotros,
// contacto, pie) se guarda de una vez en la columna `data` (jsonb). Los
// servicios (lista repetible) tienen sus propias acciones más abajo porque
// añadir/quitar uno no debería obligar a re-guardar todo el formulario.
export async function updateSiteContent(formData: FormData) {
  const supabase = createClient();
  const companyId = await getCurrentCompanyId();

  const { data: existing } = await supabase
    .from("site_content")
    .select("data")
    .eq("company_id", companyId)
    .maybeSingle();

  const current = (existing?.data as Record<string, unknown>) ?? {};
  const services = (current.services as unknown[]) ?? [];

  const accent_color = String(formData.get("accent_color") ?? "#2E6D83");

  const newData = {
    ...current,
    brand: String(formData.get("brand") ?? "").trim(),
    heroTitle: String(formData.get("heroTitle") ?? "").trim(),
    heroSub: String(formData.get("heroSub") ?? "").trim(),
    heroCta: String(formData.get("heroCta") ?? "").trim(),
    about: String(formData.get("about") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    instagram: String(formData.get("instagram") ?? "").trim(),
    copyright: String(formData.get("copyright") ?? "").trim(),
    services,
  };

  const { error } = await supabase.from("site_content").upsert(
    {
      company_id: companyId,
      accent_color,
      data: newData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/mi-web");
}

export async function addService(formData: FormData) {
  const supabase = createClient();
  const companyId = await getCurrentCompanyId();

  const name = String(formData.get("service_name") ?? "").trim();
  const desc = String(formData.get("service_desc") ?? "").trim();
  if (!name) throw new Error("El servicio necesita un nombre");

  const { data: existing } = await supabase
    .from("site_content")
    .select("data, accent_color")
    .eq("company_id", companyId)
    .maybeSingle();

  const current = (existing?.data as Record<string, unknown>) ?? {};
  const services = ((current.services as { name: string; desc: string }[]) ?? []).concat([{ name, desc }]);

  const { error } = await supabase.from("site_content").upsert(
    {
      company_id: companyId,
      accent_color: existing?.accent_color ?? "#2E6D83",
      data: { ...current, services },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/mi-web");
}

export async function removeService(formData: FormData) {
  const supabase = createClient();
  const companyId = await getCurrentCompanyId();
  const index = Number(formData.get("index"));

  const { data: existing } = await supabase
    .from("site_content")
    .select("data, accent_color")
    .eq("company_id", companyId)
    .maybeSingle();

  const current = (existing?.data as Record<string, unknown>) ?? {};
  const services = ((current.services as unknown[]) ?? []).filter((_, i) => i !== index);

  const { error } = await supabase.from("site_content").upsert(
    {
      company_id: companyId,
      accent_color: existing?.accent_color ?? "#2E6D83",
      data: { ...current, services },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/mi-web");
}

// Publicar/despublicar: mientras no esté publicado, la vista pública
// (/sitio/[companyId]) no puede leer la fila por RLS (ver policy "public
// reads published site_content" en la migración 2026-09-14), así que el
// cliente puede dejar cambios a medias sin que se vean fuera hasta que
// decida publicar.
export async function toggleSitePublished(formData: FormData) {
  const supabase = createClient();
  const companyId = await getCurrentCompanyId();
  const published = formData.get("published") === "true";

  const { error } = await supabase
    .from("site_content")
    .update({ published })
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);

  revalidatePath("/mi-web");
}
