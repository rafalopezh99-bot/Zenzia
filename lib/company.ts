import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Toda pantalla del panel cuelga de la empresa (tenant) del usuario logueado.
// Centralizado aquí para no repetir la búsqueda de company_users en cada página.
export async function getCurrentCompanyId(): Promise<string> {
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

  return membership.company_id;
}

// Perfil completo del usuario/empresa actual: además del company_id, trae
// el nombre de quien gestiona la cuenta (para el saludo del dashboard) y si
// la empresa ya pasó por el asistente de configuración inicial. Se usa en
// el layout del panel (para redirigir a /onboarding si falta) y en la
// propia pantalla de onboarding.
export async function getCurrentCompanyProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("company_users")
    .select("company_id, full_name")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/login");

  const { data: company } = await supabase
    .from("companies")
    .select("name, onboarded")
    .eq("id", membership.company_id)
    .single();

  return {
    companyId: membership.company_id as string,
    fullName: (membership.full_name as string | null) ?? null,
    companyName: company?.name ?? "",
    onboarded: company?.onboarded ?? false,
  };
}
