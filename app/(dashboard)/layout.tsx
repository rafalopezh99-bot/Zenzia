import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getEnabledModules } from "@/lib/modules";
import { getCurrentCompanyProfile, ZENZIA_ADMIN_COMPANY_ID } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { stripeEnabled } from "@/lib/stripe";
import { MODULE_CATALOG } from "@/lib/modules";
import { filterModulesByPlan, planAllowsNotifications } from "@/lib/plans";

// Todo lo que cuelga de este layout depende de la sesión y de los módulos
// activados por empresa — nunca se prerenderiza estático.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentCompanyProfile();

  // Empresa recién dada de alta que todavía no pasó por el asistente de
  // configuración inicial: no hay nombre, ni vertical, ni módulos
  // decididos, así que no tiene sentido enseñar el panel todavía.
  if (!profile.onboarded) redirect("/onboarding");

  const isAdmin = profile.companyId === ZENZIA_ADMIN_COMPANY_ID;

  // Verificación en dos pasos: si la cuenta la tiene activada y esta sesión
  // aún no ha metido el código, al segundo paso del login.
  const { data: aal } = await (await createClient()).auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect("/login/mfa");

  // Sin suscripción activa (Stripe configurado), solo se puede entrar a
  // /planes para pagar y a /perfil. La cuenta de Zenzia (admin) no paga.
  const currentPath = (await headers()).get("x-pathname") ?? "";
  if (stripeEnabled() && !isAdmin && !["/planes", "/perfil"].some((p) => currentPath.startsWith(p))) {
    const { data: sub } = await (await createClient())
      .from("companies")
      .select("subscription_status")
      .eq("id", profile.companyId)
      .single();
    if (!["active", "trialing", "past_due"].includes(sub?.subscription_status ?? "")) redirect("/planes?pagar=1");
  }

  // Estas consultas no dependen una de otra (solo del companyId, que ya
  // tenemos), así que se lanzan a la vez en vez de esperar a que termine
  // una para pedir la siguiente — la página tarda lo que tarda la más
  // lenta, no la suma de todas. "Solicitudes" solo existe para la empresa
  // de Rafa, así que esa consulta ni se hace para el resto.
  const supabase = await createClient();
  const [allModules, { count: notificationCount }, signupRequestCount] = await Promise.all([
    getEnabledModules(profile.companyId),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "nueva"),
    isAdmin
      ? supabase
          .from("signup_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pendiente")
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
  ]);

  // El plan contratado recorta los módulos activados (ver lib/plans.ts).
  // Además de ocultarlos del menú, se bloquea la ruta: escribir la URL a
  // mano de algo que el plan no incluye lleva al dashboard.
  // Presupuestos (y proformas) están dentro de Facturación: sin enlace propio en el menú.
  const modules = filterModulesByPlan(allModules, profile.plan);
  const menuModules = modules.filter((m) => m.key !== "presupuestos");
  const pathname = (await headers()).get("x-pathname") ?? "";
  const inPath = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const blockedModule = MODULE_CATALOG.some((m) => inPath(m.href) && !modules.some((x) => x.key === m.key));
  const showNotifications = planAllowsNotifications(profile.plan);
  if (
    blockedModule ||
    (inPath("/notificaciones") && !showNotifications)
  )
    redirect("/dashboard");

  // Lo que su sector tendría pero su plan no incluye: sale en el menú con
  // candado y lleva a /planes (el "gusanillo" para mejorar de plan).
  // Start: menú limpio (Dashboard, Clientes, Calendario, Facturación, Perfil),
  // sin apartados con candado. En Smart solo se enseña lo que es de Pro.
  const locked = profile.plan === "start" ? [] : [
    ...allModules.filter((m) => !modules.includes(m) && m.key !== "presupuestos").map((m) => m.label),
    ...(showNotifications ? [] : ["Notificaciones"]),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink sm:flex-row">
      <Sidebar
        modules={menuModules}
        notificationCount={notificationCount ?? 0}
        isAdmin={isAdmin}
        signupRequestCount={signupRequestCount}
        vertical={profile.vertical}
        showStats={profile.plan !== "start"}
        showNotifications={showNotifications}
        locked={locked}
      />
      <main className="flex-1 overflow-x-hidden p-4 sm:p-8">{children}</main>
    </div>
  );
}
