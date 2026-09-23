"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Se llama directamente desde el cliente (no como action de un <form>) para
// poder mostrar el error de credenciales sin recargar la página — ver
// app/login/page.tsx, que hace router.push("/dashboard") a mano si no hay
// error.
export async function signIn(formData: FormData): Promise<{ error: string | null }> {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? error.message : null };
}

// Cierra la sesión del usuario actual. Al llamarse desde un Server Action
// (no un Server Component), createClient() sí puede escribir cookies, así
// que esto borra la cookie de sesión de verdad, no solo en el cliente.
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
