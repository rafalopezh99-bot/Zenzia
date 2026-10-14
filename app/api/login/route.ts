import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Login como ruta normal: sigue funcionando aunque la página de login se
// abriera con una versión anterior de la app (las server actions cambian de id).
export async function POST(req: Request) {
  const form = await req.formData();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  return NextResponse.json({ error: error ? error.message : null });
}
