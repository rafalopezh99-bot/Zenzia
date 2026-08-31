import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Mismo despliegue de Next.js sirviendo dos dominios distintos:
// - zenzia.es        -> landing pública (app/page.tsx en "/")
// - app.zenzia.es     -> entrada directa al panel
// En vez de duplicar el proyecto, cuando alguien visita "/" en el
// subdominio "app." lo mandamos a /dashboard, que ya se encarga de
// redirigir a /login (si no hay sesión) o /onboarding (si falta el
// asistente inicial) — ver app/(dashboard)/layout.tsx y lib/company.ts.
// El resto de rutas (login, dashboard, citas...) funcionan igual en
// cualquiera de los dos dominios, así que solo hace falta este caso.
const APP_SUBDOMAIN_PREFIX = "app.";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (host.startsWith(APP_SUBDOMAIN_PREFIX) && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
