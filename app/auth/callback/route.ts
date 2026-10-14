import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicOrigin } from "@/lib/origin";

// Vuelta desde los enlaces de email de Supabase (recuperar contraseña,
// confirmar cuenta): canjea el código por una sesión y sigue a `next`.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/dashboard", publicOrigin(req)));
  }
  return NextResponse.redirect(new URL("/recuperar?error=El enlace ha caducado o ya se usó. Pide uno nuevo.", publicOrigin(req)));
}
