import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";

export default async function DashboardPage() {
  const supabase = createClient();
  const { fullName } = await getCurrentCompanyProfile();

  const { count: contactCount } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { data: upcoming } = await supabase
    .from("appointments")
    .select("id, starts_at, contacts(full_name)")
    .eq("status", "scheduled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={fullName ? `¡Bienvenido a tu CRM, ${fullName}!` : "Panel de control"}
      />

      <div className="mb-8 grid max-w-md grid-cols-2 gap-4">
        <Card>
          <div className="text-2xl font-semibold text-neutral-100">{contactCount ?? 0}</div>
          <div className="text-sm text-neutral-400">Contactos activos</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-neutral-100">{upcoming?.length ?? 0}</div>
          <div className="text-sm text-neutral-400">Próximas citas</div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Próximas citas</h2>
        <ul className="space-y-2 text-sm text-neutral-300">
          {(upcoming ?? []).map((a: any) => (
            <li key={a.id} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
              {new Date(a.starts_at).toLocaleString("es-ES")} — {a.contacts?.full_name}
            </li>
          ))}
          {(upcoming ?? []).length === 0 && <li className="text-neutral-500">Sin citas próximas.</li>}
        </ul>
      </Card>
    </div>
  );
}
