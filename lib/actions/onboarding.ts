"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { VERTICAL_PACKS } from "@/lib/modules";

// Guarda las respuestas del asistente inicial: nombre de quien gestiona la
// cuenta, nombre del negocio, si es autónomo o empresa, y el tipo de
// negocio (vertical). Con el vertical elegido, activa de una vez el pack de
// módulos común para ese tipo de negocio en company_modules — así el
// cliente entra directo al dashboard con lo que necesita ya encendido.
export async function completeOnboarding(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!membership) redirect("/login");

  const full_name = String(formData.get("full_name") ?? "").trim();
  const company_name = String(formData.get("company_name") ?? "").trim();
  const business_type = String(formData.get("business_type") ?? "");
  const vertical = String(formData.get("vertical") ?? "");

  if (!full_name || !company_name) throw new Error("Faltan datos por completar");
  if (business_type !== "autonomo" && business_type !== "empresa") {
    throw new Error("Indica si eres autónomo o empresa");
  }
  if (!VERTICAL_PACKS[vertical]) throw new Error("Selecciona un tipo de negocio válido");

  const { error: companyError } = await supabase
    .from("companies")
    .update({ name: company_name, vertical, business_type, onboarded: true })
    .eq("id", membership.company_id);
  if (companyError) throw new Error(companyError.message);

  const { error: userError } = await supabase
    .from("company_users")
    .update({ full_name })
    .eq("user_id", user.id)
    .eq("company_id", membership.company_id);
  if (userError) throw new Error(userError.message);

  const modulePack = VERTICAL_PACKS[vertical] ?? [];
  if (modulePack.length > 0) {
    const rows = modulePack.map((key) => ({
      company_id: membership.company_id,
      module_key: key,
      enabled: true,
    }));
    const { error: modulesError } = await supabase
      .from("company_modules")
      .upsert(rows, { onConflict: "company_id,module_key" });
    if (modulesError) throw new Error(modulesError.message);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
