import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";
import { parseBooking } from "@/lib/booking";
import { parseLines } from "@/lib/documents";

const euro = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Estadísticas de la consulta (Smart y Pro): ocupación, ausencias, ingresos
// por servicio y altas de clientes de los últimos 6 meses.
export default async function EstadisticasPage() {
  const { plan, vertical, companyId } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  if (plan === "start") {
    return (
      <div className="max-w-xl">
        <PageHeader moduleHeader title="Estadísticas" />
        <Card>
          <p className="text-sm text-slate">
            Ocupación de tu agenda, porcentaje de ausencias, ingresos por servicio y {terms.contacts.toLowerCase()} nuevos cada mes.{" "}
            <Link href="/planes" className="font-semibold text-brand hover:underline">
              Disponible en Smart →
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

  const [{ data: appts }, { data: contacts }, { data: invoices }, { data: company }] = await Promise.all([
    supabase.from("appointments").select("starts_at, ends_at, status").gte("starts_at", monthStart.toISOString()).lt("starts_at", nextMonth.toISOString()),
    supabase.from("contacts").select("created_at").gte("created_at", sixAgo.toISOString()),
    supabase.from("invoices").select("lines, concept, amount, rectifies_id, status").gte("issue_date", yearStart),
    supabase.from("companies").select("booking").eq("id", companyId).single(),
  ]);

  const list = (appts ?? []) as any[];
  const done = list.filter((a) => a.status === "completed").length;
  const noShow = list.filter((a) => a.status === "no_show").length;
  const cancelled = list.filter((a) => a.status === "cancelled").length;
  const noShowPct = done + noShow ? Math.round((noShow / (done + noShow)) * 100) : 0;

  // Ocupación: minutos citados / minutos de horario del mes (según Reservas).
  const b = parseBooking(company?.booking);
  const [sh, sm] = b.start.split(":").map(Number);
  const [eh, em] = b.end.split(":").map(Number);
  let workDays = 0;
  for (let d = new Date(monthStart); d < nextMonth; d.setDate(d.getDate() + 1)) {
    if (b.days.includes(((d.getDay() + 6) % 7) + 1)) workDays++;
  }
  const available = workDays * (eh * 60 + em - (sh * 60 + sm));
  const booked = list
    .filter((a) => a.status !== "cancelled")
    .reduce((s, a) => s + (new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000, 0);
  const occupancy = available > 0 ? Math.min(100, Math.round((booked / available) * 100)) : 0;

  // Ingresos por servicio (año en curso, facturas no anuladas).
  const byService = new Map<string, number>();
  for (const inv of (invoices ?? []) as any[]) {
    if (inv.status === "anulada" || inv.rectifies_id) continue;
    const lines = parseLines(inv.lines);
    if (lines.length) for (const l of lines) byService.set(l.concept, (byService.get(l.concept) ?? 0) + l.qty * l.price);
    else byService.set(inv.concept ?? "Otros", (byService.get(inv.concept ?? "Otros") ?? 0) + Number(inv.amount));
  }
  const services = [...byService.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6);
  const maxService = Math.max(1, ...services.map((s) => s[1]));

  // Altas por mes (últimos 6 meses).
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const newByMonth = months.map(
    (m) => ((contacts ?? []) as any[]).filter((c) => {
      const d = new Date(c.created_at);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    }).length
  );
  const maxNew = Math.max(1, ...newByMonth);

  const kpi = (label: string, value: string, hint?: string) => (
    <Card>
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="text-sm text-slate">{label}</div>
      {hint && <div className="mt-1 text-xs text-slate/70">{hint}</div>}
    </Card>
  );

  return (
    <div className="max-w-4xl">
      <PageHeader moduleHeader title="Estadísticas" />
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">Este mes</p>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi("Ocupación de la agenda", `${occupancy} %`, `${Math.round(booked / 60)} h de ${Math.round(available / 60)} h`)}
        {kpi("Citas realizadas", String(done))}
        {kpi("Ausencias", `${noShowPct} %`, `${noShow} sin avisar · ${cancelled} canceladas`)}
        {kpi(`${terms.contacts} nuevos`, String(newByMonth[5]))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate">Ingresos por servicio ({now.getFullYear()})</h2>
          <ul className="space-y-3 text-sm">
            {services.map(([name, total]) => (
              <li key={name}>
                <div className="flex justify-between">
                  <span className="truncate text-ink">{name}</span>
                  <span className="font-semibold text-ink">{euro(total)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-paper-deep">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(total / maxService) * 100}%` }} />
                </div>
              </li>
            ))}
            {services.length === 0 && <li className="text-slate">Todavía no hay facturas este año.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate">{terms.contacts} nuevos por mes</h2>
          <div className="flex h-40 items-end gap-3">
            {months.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold text-ink">{newByMonth[i]}</span>
                <div className="w-full rounded-t-lg bg-brand" style={{ height: `${(newByMonth[i] / maxNew) * 100}%`, minHeight: 4 }} />
                <span className="text-xs text-slate">{MONTHS[m.getMonth()]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
