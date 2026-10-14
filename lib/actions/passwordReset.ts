"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Paso 1: email con el enlace para cambiar la contraseña. Siempre se responde
// lo mismo (exista o no la cuenta) para no revelar qué emails están dados de alta.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) {
    const h = await headers();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/nueva-contrasena` });
  }
  redirect("/recuperar?enviado=1");
}

// Paso 2: con la sesión que abre el enlace del email, guardar la contraseña nueva.
export async function setNewPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const repeat = String(formData.get("repeat") ?? "");
  if (password.length < 8) redirect("/nueva-contrasena?error=La contraseña debe tener al menos 8 caracteres");
  if (password !== repeat) redirect("/nueva-contrasena?error=Las contraseñas no coinciden");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/nueva-contrasena?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}
