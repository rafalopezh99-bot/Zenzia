import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAcademiaFields } from "@/lib/terminology";
import { appLocalParts, fromAppLocalInput } from "@/lib/timezone";
import LiveClock from "@/components/LiveClock";

export default async function DashboardPage() {
  const supabase = createClient();
  // getCurrentCompanyProfile() está cacheada por petición (ver lib/company.ts):
  // el layout ya la llamó justo antes, así que esto no repite el viaje a
  // Supabase, solo reutiliza el resultado.
  const { fullName, vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const appointmentsLower = terms.appointments.toLowerCase();

  // Procesa las clases de academia ya terminadas (marca completadas y
  // descuenta las horas del bono) antes de leer nada, para que las cifras
  // de abajo estén al día sin esperar al ciclo diario.
  if (showsAcademiaFields(vertical)) {
    await supabase.rpc("complete_finished_academia_appointments");
  }

  // Rango del mes actual en hora de Sevilla/Madrid (no la del servidor),
  // para sumar lo cobrado "este mes" tal y como lo entiende el usuario.
  const nowParts = appLocalParts(new Date());
  const monthStart = fromAppLocalInput(`${nowParts.year}-${String(nowParts.month).padStart(2, "0")}-01T00:00`);
  const nextMonth = nowParts.month === 12 ? { year: nowParts.year + 1, month: 1 } : { year: nowParts.year, month: nowParts.month + 1 };
  const monthEnd = fromAppLocalInput(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}-01T00:00`);

  // Las consultas de aquí abajo son independientes entre sí, así que se
  // lanzan todas a la vez en vez de una detrás de otra — antes el
  // dashboard tardaba la suma de todas, ahora tarda lo que tarda la más
  // lenta.
  const [{ count: contactCount }, { count: newNotifications }, { data: upcoming }, { data: paidThisMonth }] =
    await Promise.all([
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "nueva"),
      supabase
        .from("appointments")
        .select("id, starts_at, contacts(full_name)")
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5),
      supabase
        .from("invoices")
        .select("amount")
        .eq("status", "pagada")
        .gte("paid_at", monthStart.toISOString())
        .lt("paid_at", monthEnd.toISOString()),
    ]);

  const earnedThisMonth = (paidThisMonth ?? []).reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={fullName ? `¡Hola, ${fullName}!` : "Panel de control"}
        action={<LiveClock />}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:max-w-3xl sm:grid-cols-4">
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
        <Card>
          <div className="text-2xl font-semibold text-emerald-600">{earnedThisMonth.toFixed(2)} €</div>
          <div className="text-sm text-slate">Ganado este mes</div>
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
