import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getEnabledModules } from "@/lib/modules";
import { getCurrentCompanyProfile } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";

// Todo lo que cuelga de este layout depende de la sesión y de los módulos
// activados por empresa — nunca se prerenderiza estático.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentCompanyProfile();

  // Empresa recién dada de alta que todavía no pasó por el asistente de
  // configuración inicial: no hay nombre, ni vertical, ni módulos
  // decididos, así que no tiene sentido enseñar el panel todavía.
  if (!profile.onboarded) redirect("/onboarding");

  // Estas dos consultas no dependen una de otra (solo del companyId, que ya
  // tenemos), así que se lanzan a la vez en vez de esperar a que termine la
  // primera para pedir la segunda — la página tarda lo que tarda la más
  // lenta de las dos, no la suma de ambas.
  const supabase = createClient();
  const [modules, { count: notificationCount }] = await Promise.all([
    getEnabledModules(profile.companyId),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "nueva"),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink sm:flex-row">
      <Sidebar modules={modules} notificationCount={notificationCount ?? 0} companyName={profile.companyName} />
      <main className="flex-1 overflow-x-hidden p-4 sm:p-8">{children}</main>
    </div>
  );
}
