import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, primaryButtonClass } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAcademiaFields } from "@/lib/terminology";
import { appLocalParts, formatAppTime } from "@/lib/timezone";
import NowLine from "@/components/NowLine";

const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Un color distinto por alumno (no por estado): antes, dos clases a la
// misma hora ocupaban el mismo hueco y solo se veía el nombre de una. Ahora
// se colocan una al lado de la otra (layoutDayAppointments) y cada alumno
// tiene siempre el mismo color en todo el calendario, para diferenciarlas
// de un vistazo.
const CONTACT_COLOR_PALETTE = [
  "bg-blue-50 text-blue-700",
  "bg-purple-50 text-purple-700",
  "bg-pink-50 text-pink-700",
  "bg-indigo-50 text-indigo-700",
  "bg-teal-50 text-teal-700",
  "bg-orange-50 text-orange-700",
  "bg-cyan-50 text-cyan-700",
  "bg-rose-50 text-rose-700",
  "bg-lime-50 text-lime-700",
  "bg-fuchsia-50 text-fuchsia-700",
];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function colorForContact(key: string) {
  return CONTACT_COLOR_PALETTE[hashString(key) % CONTACT_COLOR_PALETTE.length];
}

// Reparte en columnas las citas que se solapan en el tiempo dentro de un
// mismo día, para que ninguna tape a otra. Primero agrupa en "racimos" de
// citas conectadas por solape (recorriendo por hora de inicio y fusionando
// mientras el hueco siga abierto), y dentro de cada racimo asigna columnas
// con el clásico algoritmo greedy de intervalos (óptimo para este caso).
function layoutDayAppointments<T extends { id: string; top: number; height: number }>(items: T[]) {
  const sorted = [...items].sort((a, b) => a.top - b.top || a.height - b.height);
  const layout = new Map<string, { col: number; cols: number }>();

  let clusterItems: T[] = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (clusterItems.length === 0) return;
    const colEnds: number[] = [];
    const colOf = new Map<string, number>();
    for (const it of clusterItems) {
      let placed = false;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= it.top) {
          colEnds[c] = it.top + it.height;
          colOf.set(it.id, c);
          placed = true;
          break;
        }
      }
      if (!placed) {
        colEnds.push(it.top + it.height);
        colOf.set(it.id, colEnds.length - 1);
      }
    }
    const cols = colEnds.length;
    for (const it of clusterItems) layout.set(it.id, { col: colOf.get(it.id)!, cols });
    clusterItems = [];
  };

  for (const it of sorted) {
    if (clusterItems.length > 0 && it.top < clusterEnd) {
      clusterItems.push(it);
      clusterEnd = Math.max(clusterEnd, it.top + it.height);
    } else {
      flushCluster();
      clusterItems = [it];
      clusterEnd = it.top + it.height;
    }
  }
  flushCluster();

  return layout;
}

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

// Franja horaria visible en la agenda: 08:00–20:00. Cada fila cubre una
// hora completa (la fila "8" va de 08:00 a 09:00 ... la fila "19" va de
// 19:00 a 20:00), así que estas 12 filas cubren toda la franja.
const START_HOUR = 8;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const ROW_HEIGHT = 48; // px por hora
const COLUMN_HEIGHT = ROW_HEIGHT * HOURS.length;

// Vista semanal (lunes a viernes) en columnas, con franjas horarias de
// 08:00 a 20:00. Es la vista principal de "Agenda" (/citas). Navegación
// por URL (?week=YYYY-MM-DD, el lunes de esa semana) — sin JS en el
// cliente, igual que el calendario mensual. Cada cita se dibuja como un
// bloque posicionado y con la altura de su duración real (una clase de
// 16:00 a 17:30 ocupa toda esa franja, no solo la hora de inicio), y
// enlaza a /citas/[id]/editar.
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
  if (showsAcademiaFields(vertical)) {
    await supabase.rpc("complete_finished_academia_appointments");
  }
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, contacts(id, full_name)")
    .gte("starts_at", monday.toISOString())
    .lt("starts_at", rangeEnd.toISOString())
    .order("starts_at", { ascending: true });

  // Una lista por día (0=lunes..4=viernes) con la posición y altura ya
  // calculadas en píxeles a partir de starts_at/ends_at. Las citas fuera
  // de 08:00–20:00 no se muestran en esta vista.
  const byDay: { id: string; starts_at: string; status: string; contacts: any; top: number; height: number }[][] = [
    [],
    [],
    [],
    [],
    [],
  ];
  const visibleMinutes = (END_HOUR - START_HOUR) * 60;
  (appointments ?? []).forEach((a: any) => {
    // Posición y día calculados en hora de Sevilla/Madrid, no en la del
    // servidor (Netlify corre en UTC).
    const start = appLocalParts(a.starts_at);
    const end = appLocalParts(a.ends_at);
    const dayIdx = (start.weekday + 6) % 7;
    if (dayIdx > 4) return; // fin de semana no se muestra en esta vista

    const startMinutes = (start.hour - START_HOUR) * 60 + start.minute;
    const endMinutes = (end.hour - START_HOUR) * 60 + end.minute;
    const visibleStart = Math.max(0, startMinutes);
    const visibleEnd = Math.min(visibleMinutes, endMinutes);
    if (visibleEnd <= 0 || visibleStart >= visibleMinutes) return; // fuera de la franja

    byDay[dayIdx].push({
      ...a,
      top: (visibleStart / 60) * ROW_HEIGHT,
      height: Math.max(18, ((visibleEnd - visibleStart) / 60) * ROW_HEIGHT),
    });
  });

  // Columna/nº de columnas por cita, para las que se solapan en el tiempo.
  const dayLayouts = byDay.map((dayItems) => layoutDayAppointments(dayItems));

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

            {/* Columna de horas */}
            <div>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-t border-line px-1 py-1 text-right text-[10px] text-slate/50"
                  style={{ height: ROW_HEIGHT }}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Columnas de días: líneas de hora de fondo + bloques de cita
                posicionados por encima, con la altura de su duración real. */}
            {days.map((d, dayIdx) => (
              <div key={dayIdx} className="relative border-l border-line" style={{ height: COLUMN_HEIGHT }}>
                {HOURS.map((hour) => (
                  <div key={hour} className="border-t border-line" style={{ height: ROW_HEIGHT }} />
                ))}
                <NowLine dateStr={formatWeekParam(d)} startHour={START_HOUR} endHour={END_HOUR} rowHeight={ROW_HEIGHT} />
                {byDay[dayIdx].map((a) => {
                  const { col, cols } = dayLayouts[dayIdx].get(a.id) ?? { col: 0, cols: 1 };
                  const colorKey = a.contacts?.id ?? a.contacts?.full_name ?? a.id;
                  return (
                    <Link
                      key={a.id}
                      href={`/citas/${a.id}/editar`}
                      className={`absolute overflow-hidden rounded px-1 py-0.5 text-[10px] leading-tight transition hover:brightness-95 ${colorForContact(
                        colorKey
                      )} ${a.status === "cancelled" ? "line-through opacity-60" : a.status === "no_show" ? "opacity-60" : ""}`}
                      style={{
                        top: a.top,
                        height: a.height,
                        left: `calc(${(col / cols) * 100}% + 2px)`,
                        width: `calc(${(1 / cols) * 100}% - 4px)`,
                      }}
                    >
                      {formatAppTime(a.starts_at)} {a.contacts?.full_name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
