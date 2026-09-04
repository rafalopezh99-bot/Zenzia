import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, primaryButtonClass } from "@/components/ui";
import { APPOINTMENT_STATUS_TONE } from "@/lib/appointmentStatus";
import { appLocalParts, formatAppTime } from "@/lib/timezone";
import { getCurrentCompanyProfile } from "@/lib/company";
import { showsAcademiaFields } from "@/lib/terminology";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const CHIP_TONE_CLASS: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700 line-through",
  neutral: "bg-paper-deep text-slate",
};

function parseMonthParam(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return { year: y, monthIndex: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

function formatMonthParam(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

// Calendario mensual navegable por URL (?month=YYYY-MM) — sin JS en el
// cliente, coherente con el resto del panel (todo Server Components +
// Server Actions). Anterior/Siguiente son enlaces normales.
export default async function CalendarioPage({ searchParams }: { searchParams: { month?: string } }) {
  const { year, monthIndex } = parseMonthParam(searchParams.month);

  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstOfNextMonth = new Date(year, monthIndex + 1, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo

  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  if (showsAcademiaFields(vertical)) {
    await supabase.rpc("complete_finished_academia_appointments");
  }
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, status, contacts(full_name)")
    .gte("starts_at", firstOfMonth.toISOString())
    .lt("starts_at", firstOfNextMonth.toISOString())
    .order("starts_at", { ascending: true });

  const byDay = new Map<number, any[]>();
  (appointments ?? []).forEach((a: any) => {
    // Agrupado por día en hora de Sevilla/Madrid, no la del servidor.
    const day = appLocalParts(a.starts_at).day;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(a);
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;

  const prevMonthDate = new Date(year, monthIndex - 1, 1);
  const nextMonthDate = new Date(year, monthIndex + 1, 1);
  const navLinkClass =
    "rounded-full border border-line px-3 py-1.5 text-sm text-slate transition hover:border-brand hover:text-brand";

  return (
    <div>
      <PageHeader
        title="Calendario"
        action={
          <div className="flex gap-2">
            <Link
              href="/citas"
              className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              Ver semana
            </Link>
            <Link href="/citas/lista" className={primaryButtonClass}>
              Ver como lista
            </Link>
          </div>
        }
      />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/citas/calendario?month=${formatMonthParam(prevMonthDate.getFullYear(), prevMonthDate.getMonth())}`}
            className={navLinkClass}
          >
            ← Anterior
          </Link>
          <div className="text-sm font-semibold text-ink">
            {MONTH_NAMES[monthIndex]} {year}
          </div>
          <Link
            href={`/citas/calendario?month=${formatMonthParam(nextMonthDate.getFullYear(), nextMonthDate.getMonth())}`}
            className={navLinkClass}
          >
            Siguiente →
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-1 py-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate/70">
              {w}
            </div>
          ))}
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="min-h-[92px]" />;
            const dayAppointments = byDay.get(day) ?? [];
            const isToday = isCurrentMonth && today.getDate() === day;
            return (
              <div
                key={idx}
                className={`min-h-[92px] rounded-lg border p-1.5 ${
                  isToday ? "border-brand bg-brand/5" : "border-line bg-paper-deep"
                }`}
              >
                <div className={`mb-1 text-right text-[11px] ${isToday ? "font-semibold text-brand" : "text-slate/70"}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((a: any) => (
                    <Link
                      key={a.id}
                      href={`/citas/${a.id}/editar`}
                      className={`block truncate rounded px-1 py-0.5 text-[10px] transition hover:brightness-95 ${
                        CHIP_TONE_CLASS[APPOINTMENT_STATUS_TONE[a.status] ?? "neutral"]
                      }`}
                    >
                      {formatAppTime(a.starts_at)} {a.contacts?.full_name}
                    </Link>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-[10px] text-slate/70">+{dayAppointments.length - 3} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
