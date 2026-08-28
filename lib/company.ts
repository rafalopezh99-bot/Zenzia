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
