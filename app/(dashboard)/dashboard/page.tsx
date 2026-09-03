import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";

export default async function DashboardPage() {
  const supabase = createClient();
  // getCurrentCompanyProfile() está cacheada por petición (ver lib/company.ts):
  // el layout ya la llamó justo antes, así que esto no repite el viaje a
  // Supabase, solo reutiliza el resultado.
  const { fullName, vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const appointmentsLower = terms.appointments.toLowerCase();

  // Las tres consultas de aquí abajo son independientes entre sí, así que
  // se lanzan las tres a la vez en vez de una detrás de otra — antes el
  // dashboard tardaba la suma de las tres, ahora tarda lo que tarda la más
  // lenta.
  const [{ count: contactCount }, { count: newNotifications }, { data: upcoming }] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "nueva"),
    supabase
      .from("appointments")
      .select("id, starts_at, contacts(full_name)")
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(5),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={fullName ? `¡Bienvenido a tu CRM, ${fullName}!` : "Panel de control"}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:max-w-2xl sm:grid-cols-3">
        <Card>
          <div className="text-2xl font-semibold text-ink">{contactCount ?? 0}</div>
          <div className="text-sm text-slate">{terms.contacts} activos</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-ink">{upcoming?.length ?? 0}</div>
          <div className="text-sm text-slate">Próximas {appointmentsLower}</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-ink">{newNotifications ?? 0}</div>
          <div className="text-sm text-slate">Notificaciones nuevas</div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Próximas {appointmentsLower}</h2>
        <ul className="space-y-2 text-sm text-slate">
          {(upcoming ?? []).map((a: any) => (
            <li key={a.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
              {new Date(a.starts_at).toLocaleString("es-ES")} — {a.contacts?.full_name}
            </li>
          ))}
          {(upcoming ?? []).length === 0 && <li className="text-slate/70">Sin {appointmentsLower} próximas.</li>}
        </ul>
      </Card>
    </div>
  );
}
