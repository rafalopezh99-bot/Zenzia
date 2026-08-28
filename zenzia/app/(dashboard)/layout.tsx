import Sidebar from "@/components/Sidebar";
import { getEnabledModules } from "@/lib/modules";
import { getCurrentCompanyId } from "@/lib/company";

// Todo lo que cuelga de este layout depende de la sesión y de los módulos
// activados por empresa — nunca se prerenderiza estático.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const companyId = await getCurrentCompanyId();
  const modules = await getEnabledModules(companyId);

  return (
    <div className="flex min-h-screen bg-neutral-900 text-neutral-100">
      <Sidebar modules={modules} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
