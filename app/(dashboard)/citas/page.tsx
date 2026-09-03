import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, primaryButtonClass } from "@/components/ui";
import { APPOINTMENT_STATUS_TONE } from "@/lib/appointmentStatus";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";

const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const CHIP_TONE_CLASS: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700 line-through",
  neutral: "bg-paper-deep text-slate",
};

function getMonday(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekParam(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseWeekParam(week?: string) {
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    const d = new Date(`${week}T00:00:00`);
    if (!isNaN(d.getTime())) return getMonday(d);
  }
  return getMonday(new Date());
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Vista semanal (lunes a viernes) en columnas, con franjas horarias de 24h.
// Es la vista principal de "Agenda" (/citas). Navegación por URL
// (?week=YYYY-MM-DD, el lunes de esa semana) — sin JS en el cliente, igual
// que el calendario mensual.
export default async function CitasPage({ searchParams }: { searchParams: { week?: string } }) {
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const monday = parseWeekParam(searchParams.week);
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const rangeEnd = new Date(monday);
  rangeEnd.setDate(rangeEnd.getDate() + 7);

  const supabase = createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, status, contacts(full_name)")
    .gte("starts_at", monday.toISOString())
    .lt("starts_at", rangeEnd.toISOString())
    .order("starts_at", { ascending: true });

  // grid[hora][diaIndex] = citas de esa hora ese día (0=lunes..4=viernes)
  const grid: any[][][] = HOURS.map(() => [[], [], [], [], []]);
  (appointments ?? []).forEach((a: any) => {
    const dt = new Date(a.starts_at);
    const dayIdx = (dt.getDay() + 6) % 7;
    if (dayIdx > 4) return; // fin de semana no se muestra en esta vista
    grid[dt.getHours()][dayIdx].push(a);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevWeek = new Date(monday);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(monday);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const navLinkClass =
    "rounded-full border border-line px-3 py-1.5 text-sm text-slate transition hover:border-brand hover:text-brand";

  const rangeLabel = `${days[0].toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${days[4].toLocaleDateString(
    "es-ES",
    { day: "numeric", month: "short" }
  )}`;

  return (
    <div>
      <PageHeader
        title={terms.agendaLabel}
        action={
          <div className="flex gap-2">
            <Link href="/citas/calendario" className={primaryButtonClass}>
              Ver mes
            </Link>
            <Link
              href="/citas/lista"
              className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              Ver lista
            </Link>
            <Link href="/citas/nueva" className={primaryButtonClass}>
              {terms.newAppointment}
            </Link>
          </div>
        }
      />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Link href={`/citas?week=${formatWeekParam(prevWeek)}`} className={navLinkClass}>
            ← Semana anterior
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-ink">{rangeLabel}</div>
            <Link href="/citas" className="text-xs text-brand hover:underline">
              Hoy
            </Link>
          </div>
          <Link href={`/citas?week=${formatWeekParam(nextWeek)}`} className={navLinkClass}>
            Semana siguiente →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-[56px_repeat(5,1fr)]">
            {/* Cabecera */}
            <div />
            {days.map((d) => {
              const isToday = d.getTime() === today.getTime();
              return (
                <div
                  key={d.toISOString()}
                  className={`border-b border-line px-2 py-2 text-center ${isToday ? "text-brand" : "text-slate"}`}
                >
                  <div className="text-[11px] uppercase tracking-wide text-slate/70">
                    {WEEKDAY_NAMES[(d.getDay() + 6) % 7]}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? "text-brand" : "text-ink"}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}

            {/* Filas por hora */}
            {HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="border-t border-line px-1 py-1 text-right text-[10px] text-slate/50">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {days.map((_, dayIdx) => (
                  <div key={dayIdx} className="min-h-[44px] border-t border-l border-line p-1">
                    <div className="space-y-1">
                      {grid[hour][dayIdx].map((a: any) => (
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
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
