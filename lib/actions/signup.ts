"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VERTICAL_PACKS } from "@/lib/modules";
import { toPlanKey } from "@/lib/plans";

const fail = (msg: string) => redirect(`/registro?error=${encodeURIComponent(msg)}`);

// Alta en autoservicio: usuario (Supabase Auth) + empresa + membresía +
// módulos de su sector. La empresa y la membresía se crean con service_role
// porque el usuario recién creado aún no pertenece a ninguna empresa (RLS).
// El plan elegido se guarda como "pendiente de pago" (subscription_status
// null) y se paga en /planes al terminar el asistente inicial.
export async function selfSignup(formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const business_name = String(formData.get("business_name") ?? "").trim();
  const vertical = String(formData.get("vertical") ?? "");
  const plan = toPlanKey(formData.get("plan"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!full_name || !business_name || !email) fail("Rellena todos los campos");
  if (!VERTICAL_PACKS[vertical]) fail("Elige a qué te dedicas");
  if (password.length < 8) fail("La contraseña debe tener al menos 8 caracteres");

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login` },
  });
  if (error || !data.user) fail(error?.message ?? "No se pudo crear la cuenta");
  // Email ya registrado: Supabase devuelve un usuario sin identidades.
  if (data.user!.identities?.length === 0) fail("Ese email ya tiene cuenta. Inicia sesión.");

  const db = createAdminClient();
  const { data: company, error: companyError } = await db
    .from("companies")
    .insert({ name: business_name, vertical, business_type: "autonomo", plan, email, onboarded: false })
    .select("id")
    .single();
  if (companyError || !company) fail("No se pudo crear tu negocio");

  await db.from("company_users").insert({ company_id: company!.id, user_id: data.user!.id, role: "owner", full_name });
  await db
    .from("company_modules")
    .insert((VERTICAL_PACKS[vertical] ?? []).map((module_key) => ({ company_id: company!.id, module_key, enabled: true })));

  // Con confirmación de email activada no hay sesión todavía.
  redirect(data.session ? "/onboarding" : "/registro/enviado");
}
