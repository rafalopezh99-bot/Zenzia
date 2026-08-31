import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, primaryButtonClass } from "@/components/ui";
import { APPOINTMENT_STATUS_TONE } from "@/lib/appointmentStatus";

const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const CHIP_TONE_CLASS: Record<string, string> = {
  green: "bg-emerald-400/10 text-emerald-300",
  amber: "bg-amber-400/10 text-amber-200",
  red: "bg-red-400/10 text-red-300 line-through",
  neutral: "bg-white/5 text-neutral-300",
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
    "rounded-full border border-white/15 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-emerald-400/50 hover:text-emerald-300";

  const rangeLabel = `${days[0].toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${days[4].toLocaleDateString(
    "es-ES",
    { day: "numeric", month: "short" }
  )}`;

  return (
    <div>
      <PageHeader
        title="Agenda"
        action={
          <div className="flex gap-2">
            <Link href="/citas/calendario" className={primaryButtonClass}>
              Ver mes
            </Link>
            <Link
              href="/citas/lista"
              className="inline-block rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-emerald-400/50 hover:text-emerald-300"
            >
              Ver lista
            </Link>
            <Link href="/citas/nueva" className={primaryButtonClass}>
              Nueva cita
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
            <div className="text-sm font-semibold text-neutral-100">{rangeLabel}</div>
            <Link href="/citas" className="text-xs text-emerald-300 hover:underline">
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
                  className={`border-b border-white/10 px-2 py-2 text-center ${isToday ? "text-emerald-300" : "text-neutral-300"}`}
                >
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                    {WEEKDAY_NAMES[(d.getDay() + 6) % 7]}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? "text-emerald-300" : "text-neutral-100"}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}

            {/* Filas por hora */}
            {HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="border-t border-white/5 px-1 py-1 text-right text-[10px] text-neutral-600">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {days.map((_, dayIdx) => (
                  <div key={dayIdx} className="min-h-[44px] border-t border-l border-white/5 p-1">
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
