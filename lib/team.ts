import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";

// Profesionales del negocio (usuarios de la empresa) para asignar citas.
export async function getTeam() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const [{ data }, { data: auth }] = await Promise.all([
    supabase.from("company_users").select("user_id, full_name").eq("company_id", companyId).order("created_at"),
    supabase.auth.getUser(),
  ]);
  return {
    team: (data ?? []).map((m) => ({ id: m.user_id as string, name: (m.full_name as string | null) ?? "Sin nombre" })),
    me: auth.user?.id ?? null,
  };
}
