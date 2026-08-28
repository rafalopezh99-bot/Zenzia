import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();

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
      <h1 className="mb-6 text-xl font-semibold">Dashboard</h1>

      <div className="mb-8 grid max-w-md grid-cols-2 gap-4">
        <div className="rounded border border-neutral-800 p-4">
          <div className="text-2xl font-semibold">{contactCount ?? 0}</div>
          <div className="text-sm text-neutral-400">Contactos activos</div>
        </div>
        <div className="rounded border border-neutral-800 p-4">
          <div className="text-2xl font-semibold">{upcoming?.length ?? 0}</div>
          <div className="text-sm text-neutral-400">Próximas citas</div>
        </div>
      </div>

      <h2 className="mb-2 font-medium">Próximas citas</h2>
      <ul className="space-y-1 text-sm text-neutral-300">
        {(upcoming ?? []).map((a: any) => (
          <li key={a.id}>
            {new Date(a.starts_at).toLocaleString("es-ES")} — {a.contacts?.full_name}
          </li>
        ))}
        {(upcoming ?? []).length === 0 && <li className="text-neutral-500">Sin citas próximas.</li>}
      </ul>
    </div>
  );
}
