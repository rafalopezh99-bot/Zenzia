import { UsersIcon, CalendarClockIcon, BellIcon, WalletIcon, TruckIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, Badge } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAcademiaFields } from "@/lib/terminology";
import { appLocalParts, fromAppLocalInput, formatAppTime } from "@/lib/timezone";
import LiveClock from "@/components/LiveClock";
import { PIPELINE_STAGES, STAGE_LABEL, STAGE_TONE, getStage } from "@/lib/pipeline";
import { getWidgetCatalog, resolveEnabledWidgets } from "@/lib/widgets";
import DashboardWidgetsEditor from "@/components/DashboardWidgetsEditor";
import { StatCard } from "@/components/StatCard";
import { BillingBarChart } from "@/components/charts/BillingBarChart";
import { TopRankingCard } from "@/components/TopRankingCard";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default async function DashboardPage() {
  const supabase = createClient();
  // getCurrentCompanyProfile() está cacheada por petición (ver lib/company.ts):
  // el layout ya la llamó justo antes, así que esto no repite el viaje a
  // Supabase, solo reutiliza el resultado.
  const { fullName, vertical, logoUrl, dashboardWidgets } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const appointmentsLower = terms.appointments.toLowerCase();
  const isAcademia = showsAcademiaFields(vertical);
  const widgetCatalog = getWidgetCatalog(isAcademia);
  const enabledWidgets = resolveEnabledWidgets(dashboardWidgets, isAcademia);
  const show = (key: (typeof widgetCatalog)[number]["key"]) => enabledWidgets.has(key);

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
  const [{ count: contactCount }, { data: paidThisMonth }, { count: supplierCount }] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("invoices")
      .select("amount")
      .eq("status", "pagada")
      .gte("paid_at", monthStart.toISOString())
      .lt("paid_at", monthEnd.toISOString()),
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
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

  // Gráficas nuevas — cada una solo lanza su consulta si está activada en
  // "Editar panel", para no pagar el coste de traer facturas/presupuestos
  // de empresas que no las tienen puestas en su dashboard.
  let monthlyBilling: { label: string; total: number }[] = [];
  if (show("chart_facturacion_mensual")) {
    const yearStart = fromAppLocalInput(`${nowParts.year}-01-01T00:00`);
    const yearEnd = fromAppLocalInput(`${nowParts.year + 1}-01-01T00:00`);
    const { data: paidThisYear } = await supabase
      .from("invoices")
      .select("amount, paid_at")
      .eq("status", "pagada")
      .gte("paid_at", yearStart.toISOString())
      .lt("paid_at", yearEnd.toISOString());
    monthlyBilling = MONTH_LABELS.map((label) => ({ label, total: 0 }));
    for (const inv of paidThisYear ?? []) {
      const idx = appLocalParts(new Date((inv as any).paid_at)).month - 1;
      if (idx >= 0 && idx < 12) monthlyBilling[idx].total += Number((inv as any).amount);
    }
  }

  let yearlyBilling: { label: string; total: number }[] = [];
  if (show("chart_facturacion_anual")) {
    const firstYear = nowParts.year - 4;
    const rangeStart = fromAppLocalInput(`${firstYear}-01-01T00:00`);
    const { data: paidLastYears } = await supabase
      .from("invoices")
      .select("amount, paid_at")
      .eq("status", "pagada")
      .gte("paid_at", rangeStart.toISOString());
    const yearlyMap = new Map<number, number>();
    for (let y = firstYear; y <= nowParts.year; y++) yearlyMap.set(y, 0);
    for (const inv of paidLastYears ?? []) {
      const y = appLocalParts(new Date((inv as any).paid_at)).year;
      if (yearlyMap.has(y)) yearlyMap.set(y, (yearlyMap.get(y) ?? 0) + Number((inv as any).amount));
    }
    yearlyBilling = Array.from(yearlyMap.entries()).map(([year, total]) => ({ label: String(year), total }));
  }

  // "Potenciales" = presupuestos (quotes) todavía pendientes de aprobar o
  // rechazar: es el negocio que podría cerrarse pero aún no está ganado.
  // Zenzia no tiene catálogo de productos (es un CRM de servicios), así
  // que "servicios potenciales" agrupa esos presupuestos por su título.
  let topClients: { id: string; label: string; sublabel?: string; value: number; badge: string }[] = [];
  let topServices: { id: string; label: string; sublabel?: string; value: number; badge: string }[] = [];
  if (show("top_clientes_potenciales") || show("top_servicios_potenciales")) {
    const { data: pendingQuotes } = await supabase
      .from("quotes")
      .select("contact_id, title, amount, contacts(full_name, custom_fields)")
      .eq("status", "pendiente");

    if (show("top_clientes_potenciales")) {
      const clientTotals = new Map<string, { name: string; stage: string; total: number }>();
      for (const q of pendingQuotes ?? []) {
        const contact = (q as any).contacts;
        if (!contact) continue;
        const stage = getStage(contact.custom_fields);
        if (stage === "ganado" || stage === "perdido") continue;
        const prev = clientTotals.get((q as any).contact_id);
        clientTotals.set((q as any).contact_id, {
          name: contact.full_name,
          stage,
          total: (prev?.total ?? 0) + Number((q as any).amount),
        });
      }
      topClients = Array.from(clientTotals.entries())
        .map(([id, v]) => ({
          id,
          label: v.name,
          sublabel: STAGE_LABEL[v.stage as keyof typeof STAGE_LABEL],
          value: v.total,
          badge: `${v.total.toFixed(0)} €`,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    }

    if (show("top_servicios_potenciales")) {
      const serviceTotals = new Map<string, { total: number; count: number }>();
      for (const q of pendingQuotes ?? []) {
        const key = ((q as any).title || "Sin título").trim();
        const prev = serviceTotals.get(key);
        serviceTotals.set(key, { total: (prev?.total ?? 0) + Number((q as any).amount), count: (prev?.count ?? 0) + 1 });
      }
      topServices = Array.from(serviceTotals.entries())
        .map(([title, v]) => ({
          id: title,
          label: title,
          sublabel: `${v.count} ${v.count === 1 ? "presupuesto" : "presupuestos"}`,
          value: v.total,
          badge: `${v.total.toFixed(0)} €`,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    }
  }

  const statWidgetsShown = [
    show("stat_contactos"),
    show("stat_citas") && !isAcademia,
    show("stat_notificaciones") && !isAcademia,
    show("stat_ganado_mes"),
    show("stat_proveedores"),
  ].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={fullName ? `¡Hola, ${fullName}!` : "Panel de control"}
        action={
          <div className="flex items-center gap-3">
            <LiveClock />
            <DashboardWidgetsEditor catalog={widgetCatalog} enabledKeys={Array.from(enabledWidgets)} />
          </div>
        }
        logoUrl={logoUrl}
      />

      {statWidgetsShown > 0 && (
        <div
          className="mb-8 grid grid-cols-1 gap-4 sm:max-w-4xl"
          style={{ gridTemplateColumns: `repeat(${Math.min(statWidgetsShown, 4)}, minmax(0, 1fr))` }}
        >
          {show("stat_contactos") && (
            <StatCard icon={UsersIcon} tone="brand" value={contactCount ?? 0} label={`${terms.contacts} activos`} />
          )}
          {!isAcademia && show("stat_citas") && (
            <StatCard icon={CalendarClockIcon} tone="mint" value={upcoming.length} label={`Próximas ${appointmentsLower}`} />
          )}
          {!isAcademia && show("stat_notificaciones") && (
            <StatCard icon={BellIcon} tone="amber" value={newNotifications} label="Notificaciones nuevas" />
          )}
          {show("stat_ganado_mes") && (
            <StatCard icon={WalletIcon} tone="money" value={`${earnedThisMonth.toFixed(2)} €`} label="Ganado este mes" />
          )}
          {show("stat_proveedores") && (
            <StatCard icon={TruckIcon} tone="slate" value={supplierCount ?? 0} label="Proveedores dados de alta" />
          )}
        </div>
      )}

      {isAcademia ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {show("clases_hoy") && (
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
          )}
          {show("clases_manana") && (
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
          )}
        </div>
      ) : (
        <>
          {show("leads_pipeline") && (
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
          )}

          {show("proximas_citas") && (
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
          )}
        </>
      )}

      {(show("chart_facturacion_mensual") ||
        show("chart_facturacion_anual") ||
        show("top_clientes_potenciales") ||
        show("top_servicios_potenciales")) && (
        <div className="mt-8 space-y-4">
          {(show("chart_facturacion_mensual") || show("chart_facturacion_anual")) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {show("chart_facturacion_mensual") && (
                <Card>
                  <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate">Facturación mensual</h2>
                  <p className="mb-3 text-xs text-slate/70">Cobrado mes a mes en {nowParts.year}</p>
                  <BillingBarChart data={monthlyBilling} />
                </Card>
              )}
              {show("chart_facturacion_anual") && (
                <Card>
                  <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate">Facturación anual</h2>
                  <p className="mb-3 text-xs text-slate/70">Cobrado año tras año</p>
                  <BillingBarChart data={yearlyBilling} />
                </Card>
              )}
            </div>
          )}

          {(show("top_clientes_potenciales") || show("top_servicios_potenciales")) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {show("top_clientes_potenciales") && (
                <TopRankingCard
                  title="Top 5 clientes potenciales"
                  emptyLabel="Sin presupuestos pendientes por ahora."
                  rows={topClients}
                />
              )}
              {show("top_servicios_potenciales") && (
                <TopRankingCard
                  title="Top 5 servicios potenciales"
                  emptyLabel="Sin presupuestos pendientes por ahora."
                  rows={topServices}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
