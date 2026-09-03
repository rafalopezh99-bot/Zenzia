"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";

export async function addProgress(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  if (!contact_id) throw new Error("Faltan datos de seguimiento");

  // Academia manda "asignatura" (formulario específico de clase); el resto
  // de verticales sigue mandando "label"/"value" (métrica libre). Se guarda
  // en custom_fields con la forma que corresponda, sin tocar el esquema.
  const asignatura = String(formData.get("asignatura") ?? "").trim();

  let custom_fields: Record<string, unknown>;
  if (asignatura) {
    const tema = String(formData.get("tema") ?? "").trim();
    const valoracion = String(formData.get("valoracion") ?? "").trim();
    const notas = String(formData.get("notas") ?? "").trim();
    if (!tema) throw new Error("Falta el tema visto en la clase");
    custom_fields = { asignatura, tema, valoracion, notas };
  } else {
    const label = String(formData.get("label") ?? "").trim();
    const value = String(formData.get("value") ?? "").trim();
    if (!label || !value) throw new Error("Faltan datos de seguimiento");
    custom_fields = { label, value };
  }

  const { error } = await supabase.from("activities").insert({
    company_id: companyId,
    contact_id,
    type: "progress",
    custom_fields,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/seguimiento");
}
