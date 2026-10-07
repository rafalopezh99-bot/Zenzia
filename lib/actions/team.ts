"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCompanyProfile } from "@/lib/company";
import { PLAN_USERS } from "@/lib/plans";

const back = (msg: string, ok = false) => redirect(`/perfil?tab=equipo&${ok ? "ok=1" : `error=${encodeURIComponent(msg)}`}`);

async function assertOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { companyId, plan } = await getCurrentCompanyProfile();
  const { data: me } = await supabase.from("company_users").select("role").eq("user_id", user!.id).eq("company_id", companyId).single();
  if (!me || me.role === "member") back("Solo el titular de la cuenta puede gestionar el equipo");
  return { companyId, plan, userId: user!.id };
}

// Alta de un compañero: se crea su usuario con una contraseña temporal que
// el titular le pasa (puede cambiarla luego con "¿Olvidaste tu contraseña?").
export async function addTeamMember(formData: FormData) {
  const { companyId, plan } = await assertOwner();
  const name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || password.length < 8) back("Nombre, email y contraseña de al menos 8 caracteres");

  const db = createAdminClient();
  const { count } = await db.from("company_users").select("id", { count: "exact", head: true }).eq("company_id", companyId);
  const max = PLAN_USERS[plan];
  if (max !== null && (count ?? 0) >= max) back(`Tu plan permite ${max} usuario${max === 1 ? "" : "s"}. Mejora tu plan para añadir más.`);

  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) back(error?.message ?? "No se pudo crear el usuario");
  await db.from("company_users").insert({ company_id: companyId, user_id: data.user!.id, role: "member", full_name: name });
  revalidatePath("/perfil");
  back("", true);
}

export async function removeTeamMember(memberId: string) {
  const { companyId, userId } = await assertOwner();
  const db = createAdminClient();
  const { data: m } = await db.from("company_users").select("user_id").eq("id", memberId).eq("company_id", companyId).single();
  if (!m || m.user_id === userId) back("No puedes quitarte a ti mismo");
  await db.from("company_users").delete().eq("id", memberId);
  await db.auth.admin.deleteUser(m!.user_id);
  revalidatePath("/perfil");
  back("", true);
}
