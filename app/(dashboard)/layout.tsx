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

  const modules = await getEnabledModules(profile.companyId);

  const supabase = createClient();
  const { count: notificationCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("status", "nueva");

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <Sidebar modules={modules} notificationCount={notificationCount ?? 0} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
