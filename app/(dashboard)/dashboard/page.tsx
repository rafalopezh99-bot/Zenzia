import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, Badge } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAcademiaFields } from "@/lib/terminology";
import { appLocalParts, fromAppLocalInput, formatAppTime } from "@/lib/timezone";
import LiveClock from "@/components/LiveClock";
import { PIPELINE_STAGES, STAGE_LABEL, STAGE_TONE, getStage } from "@/lib/pipeline";

export default async function DashboardPage() {
  const supabase = createClient();
  // getCurrentCompanyProfile() está cacheada por petición (ver lib/company.ts):
  // el layout ya la llamó justo antes, así que esto no repite el viaje a
  // Supabase, solo reutiliza el resultado.
  const { fullName, vertical, logoUrl } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const appointmentsLower = terms.appointments.toLowerCase();
  const isAcademia = showsAcademiaFields(vertical);

  // Procesa las clases de academia ya terminadas (marca completadas y
  // descuenta las horas del bono) antes de leer nada, para que las cifras
  // de abajo estén al día sin esperar al ciclo diario.
  if (isAcademia) {
    await supabase.rpc("complete_finished_academia_appointments");
  }

  // Rango del día de hoy y de mañana en hora de Sevilla/Madrid (no la del
  // servidor), para las tablas de "clases de hoy" / "clases de mañana".
  const nowParts = appLocalParts(new Date());
  const todayStart = fromAppLocalInput(
    `${nowParts.year}-${String(nowParts.month).padStart(2, "0")}-${String(nowParts.day).padStart(2, "0")}T00:00`
  );
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60000);
  const dayAfterStart = new Date(todayStart.getTime() + 2 * 24 * 60 * 60000);

  // Rango del mes actual en hora de Sevilla/Madrid, para sumar lo cobrado
  // "este mes" tal y como lo entiende el usuario.
  const monthStart = fromAppLocalInput(`${nowParts.year}-${String(nowParts.month).padStart(2, "0")}-01T00:00`);
  const nextMonth = nowParts.month === 12 ? { year: nowParts.year + 1, month: 1 } : { year: nowParts.year, month: nowParts.month + 1 };
  const monthEnd = fromAppLocalInput(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}-01T00:00`);

  // Las consultas de aquí abajo son independientes entre sí, así que se
  // lanzan todas a la vez en vez de una detrás de otra. Lo que cambia según
  // el vertical (academia ve sus clases de hoy/mañana; el resto ve
  // notificaciones, próximas citas y el desglose de leads) se pide aparte
  // para no traer de Supabase datos que luego no se van a pintar.
  const [{ count: contactCount }, { data: paidThisMonth }] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("invoices")
      .select("amount")
      .eq("status", "pagada")
      .gte("paid_at", monthStart.toISOString())
      .lt("paid_at", monthEnd.toISOString()),
  ]);
  const earnedThisMonth = (paidThisMonth ?? []).reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  let classesToday: any[] = [];
  let classesTomorrow: any[] = [];
  let newNotifications = 0;
  let upcoming: any[] = [];
  let stageCounts = PIPELINE_STAGES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<(typeof PIPELINE_STAGES)[number], number>
  );

  if (isAcademia) {
    const [{ data: today }, { data: tomorrow }] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, starts_at, contacts(full_name)")
        .eq("status", "scheduled")
        .gte("starts_at", todayStart.toISOString())
        .lt("starts_at", tomorrowStart.toISOString())
        .order("starts_at", { ascending: true }),
      supabase
        .from("appointments")
        .select("id, starts_at, contacts(full_name)")
        .eq("status", "scheduled")
        .gte("starts_at", tomorrowStart.toISOString())
        .lt("starts_at", dayAfterStart.toISOString())
        .order("starts_at", { ascending: true }),
    ]);
    classesToday = today ?? [];
    classesTomorrow = tomorrow ?? [];
  } else {
    const [{ count: notifCount }, { data: upcomingData }, { data: pipelineContacts }] = await Promise.all([
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "nueva"),
      supabase
        .from("appointments")
        .select("id, starts_at, contacts(full_name)")
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5),
      // Para el desglose de leads por etapa: cuántos siguen adelante, cuántos
      // no contestan, cuántos se han perdido... de un vistazo, sin entrar a
      // /contactos a contarlos a mano.
      supabase.from("contacts").select("custom_fields"),
    ]);
    newNotifications = notifCount ?? 0;
    upcoming = upcomingData ?? [];
    for (const c of pipelineContacts ?? []) {
      const stage = getStage((c as any).custom_fields);
      stageCounts[stage] += 1;
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={fullName ? `¡Hola, ${fullName}!` : "Panel de control"}
        action={<LiveClock />}
        logoUrl={logoUrl}
      />

      <div className={`mb-8 grid grid-cols-1 gap-4 sm:max-w-3xl ${isAcademia ? "sm:grid-cols-2" : "sm:grid-cols-4"}`}>
        <Card>
          <div className="text-2xl font-semibold text-ink">{contactCount ?? 0}</div>
          <div className="text-sm text-slate">{terms.contacts} activos</div>
        </Card>
        {!isAcademia && (
          <>
            <Card>
              <div className="text-2xl font-semibold text-ink">{upcoming.length}</div>
              <div className="text-sm text-slate">Próximas {appointmentsLower}</div>
            </Card>
            <Card>
              <div className="text-2xl font-semibold text-ink">{newNotifications}</div>
              <div className="text-sm text-slate">Notificaciones nuevas</div>
            </Card>
          </>
        )}
        <Card>
          <div className="text-2xl font-semibold text-emerald-600">{earnedThisMonth.toFixed(2)} €</div>
          <div className="text-sm text-slate">Ganado este mes</div>
        </Card>
      </div>

      {isAcademia ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Clases de hoy</h2>
            <ul className="space-y-2 text-sm text-slate">
              {classesToday.map((a: any) => (
                <li key={a.id} className="flex justify-between border-b border-line pb-2 last:border-0 last:pb-0">
                  <span className="text-ink">{a.contacts?.full_name}</span>
                  <span className="tabular-nums">{formatAppTime(a.starts_at)}</span>
                </li>
              ))}
              {classesToday.length === 0 && <li className="text-slate/70">Sin clases hoy.</li>}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Clases de mañana</h2>
            <ul className="space-y-2 text-sm text-slate">
              {classesTomorrow.map((a: any) => (
                <li key={a.id} className="flex justify-between border-b border-line pb-2 last:border-0 last:pb-0">
                  <span className="text-ink">{a.contacts?.full_name}</span>
                  <span className="tabular-nums">{formatAppTime(a.starts_at)}</span>
                </li>
              ))}
              {classesTomorrow.length === 0 && <li className="text-slate/70">Sin clases mañana.</li>}
            </ul>
          </Card>
        </div>
      ) : (
        <>
          <Card className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Leads por etapa</h2>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STAGES.map((s) => (
                <div key={s} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                  <span className="text-lg font-semibold text-ink tabular-nums">{stageCounts[s]}</span>
                  <Badge tone={STAGE_TONE[s]}>{STAGE_LABEL[s]}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Próximas {appointmentsLower}</h2>
            <ul className="space-y-2 text-sm text-slate">
              {upcoming.map((a: any) => (
                <li key={a.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
                  {new Date(a.starts_at).toLocaleString("es-ES")} — {a.contacts?.full_name}
                </li>
              ))}
              {upcoming.length === 0 && <li className="text-slate/70">Sin {appointmentsLower} próximas.</li>}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
