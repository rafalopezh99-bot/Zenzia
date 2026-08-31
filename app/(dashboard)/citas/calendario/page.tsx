import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, primaryButtonClass } from "@/components/ui";
import { APPOINTMENT_STATUS_TONE } from "@/lib/appointmentStatus";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const CHIP_TONE_CLASS: Record<string, string> = {
  green: "bg-emerald-400/10 text-emerald-300",
  amber: "bg-amber-400/10 text-amber-200",
  red: "bg-red-400/10 text-red-300 line-through",
  neutral: "bg-white/5 text-neutral-300",
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
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, status, contacts(full_name)")
    .gte("starts_at", firstOfMonth.toISOString())
    .lt("starts_at", firstOfNextMonth.toISOString())
    .order("starts_at", { ascending: true });

  const byDay = new Map<number, any[]>();
  (appointments ?? []).forEach((a: any) => {
    const day = new Date(a.starts_at).getDate();
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
    "rounded-full border border-white/15 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-emerald-400/50 hover:text-emerald-300";

  return (
    <div>
      <PageHeader
        title="Calendario"
        action={
          <div className="flex gap-2">
            <Link
              href="/citas"
              className="inline-block rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-emerald-400/50 hover:text-emerald-300"
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
          <div className="text-sm font-semibold text-neutral-100">
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
            <div key={w} className="px-1 py-1 text-center text-[11px] font-medium uppercase tracking-wide text-neutral-500">
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
                  isToday ? "border-emerald-400/50 bg-emerald-400/5" : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className={`mb-1 text-right text-[11px] ${isToday ? "font-semibold text-emerald-300" : "text-neutral-500"}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((a: any) => (
                    <div
                      key={a.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] ${
                        CHIP_TONE_CLASS[APPOINTMENT_STATUS_TONE[a.status] ?? "neutral"]
                      }`}
                    >
                      {new Date(a.starts_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}{" "}
                      {a.contacts?.full_name}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-[10px] text-neutral-500">+{dayAppointments.length - 3} más</div>
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
