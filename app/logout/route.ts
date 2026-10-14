import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicOrigin } from "@/lib/origin";

// Cerrar sesión como enlace (/logout) en vez de server action: sigue
// funcionando aunque la página se abriera con una versión anterior de la app.
export async function GET(req: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", publicOrigin(req)), { status: 303 });
}
