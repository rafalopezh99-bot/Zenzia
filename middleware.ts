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

  // El layout del panel lo usa para bloquear rutas que el plan no incluye.
  request.headers.set("x-pathname", request.nextUrl.pathname);
  return await updateSession(request);
}

// Antes el matcher solo excluía estáticos de Next (_next/*, favicon,
// imágenes) y corría updateSession() — un viaje de ida y vuelta a
// Supabase para refrescar la cookie de sesión — en TODO lo demás,
// incluidos archivos sin sesión (robots.txt, sitemap.xml, el manifest),
// páginas legales estáticas, y las páginas públicas que ven los CLIENTES
// de un negocio (reservar cita, firmar un consentimiento, ver su portal o
// su web, cancelar una cita desde el email) — ninguna de ellas usa el
// login de Supabase, todas leen con la clave anónima vía RPC/policies "sin
// sesión" (ver comentarios en esas páginas). Tampoco hace falta en el
// webhook de Stripe ni en el cron de automatizaciones: ambos se
// autentican con su propio secreto (ver esos route.ts), no con cookies.
// Excluirlos del matcher les ahorra esa llamada a Supabase en cada visita
// — justo las páginas que van a usar los clientes de los dos negocios que
// entran ahora en el plan Web.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt$|sitemap\\.xml$|manifest\\.webmanifest$|aviso-legal(?:/|$)|condiciones(?:/|$)|cookies(?:/|$)|privacidad(?:/|$)|encargado(?:/|$)|reservar(?:/|$)|cita(?:/|$)|consentimiento(?:/|$)|portal(?:/|$)|sitio(?:/|$)|api/stripe/webhook(?:/|$)|api/cron/automations(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
