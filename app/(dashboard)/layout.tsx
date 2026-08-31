import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getEnabledModules } from "@/lib/modules";
import { getCurrentCompanyProfile } from "@/lib/company";

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

  return (
    <div className="flex min-h-screen bg-[#05070d] text-neutral-100">
      <Sidebar modules={modules} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
