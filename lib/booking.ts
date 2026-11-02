import { fromAppLocalInput, appLocalParts } from "@/lib/timezone";

// Horario de un día: mañana (a–b) y tarde (c–d). La tarde puede ir vacía.
export interface DayHours {
  open: boolean;
  a: string;
  b: string;
  c: string;
  d: string;
}

export interface BookingSettings {
  enabled: boolean;
  duration: number; // minutos
  gap: number; // descanso entre sesiones, en minutos
  weeks: number; // con cuánta antelación se puede reservar
  hours: Record<number, DayHours>; // 1 = lunes … 7 = domingo
  priceOn: boolean;
  price: string;
  notesOn: boolean;
  notesLabel: string;
  notesHelp: string;
  // Formato anterior: se sigue guardando para no romper nada que lo lea.
  days: number[];
  start: string;
  end: string;
}

export const DEFAULT_NOTES_LABEL = "¿Qué te trae a consulta?";
export const DEFAULT_NOTES_HELP = "Cuéntanos qué te ocurre y desde cuándo. Así prepararemos tu sesión y aprovecharemos mejor el tiempo.";

// Admite también el formato anterior (days + start + end, un solo tramo por
// día), de modo que las clínicas que ya tenían reservas no notan cambios.
export function parseBooking(raw: unknown): BookingSettings {
  const b = (raw ?? {}) as Record<string, any>;
  const days: number[] = Array.isArray(b.days) ? b.days.map(Number) : [1, 2, 3, 4, 5];
  const start = typeof b.start === "string" ? b.start : "09:00";
  const end = typeof b.end === "string" ? b.end : "19:00";
  const hours: Record<number, DayHours> = {};
  for (let d = 1; d <= 7; d++) {
    const saved = b.hours?.[d];
    hours[d] = saved
      ? { open: !!saved.open, a: saved.a ?? "", b: saved.b ?? "", c: saved.c ?? "", d: saved.d ?? "" }
      : { open: days.includes(d), a: start, b: end, c: "", d: "" };
  }
  return {
    enabled: !!b.enabled,
    duration: Number(b.duration) > 0 ? Number(b.duration) : 60,
    gap: Number(b.gap) > 0 ? Number(b.gap) : 0,
    weeks: Number(b.weeks) > 0 ? Number(b.weeks) : 8,
    hours,
    priceOn: !!b.priceOn,
    price: typeof b.price === "string" ? b.price : "",
    notesOn: b.notesOn !== false,
    notesLabel: b.notesLabel || DEFAULT_NOTES_LABEL,
    notesHelp: b.notesHelp || DEFAULT_NOTES_HELP,
    days,
    start,
    end,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const toMin = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const keyOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const fromKey = (key: string) => new Date(`${key}T00:00:00Z`);

// Hoy en hora de Madrid, como "YYYY-MM-DD".
export function todayKey() {
  const n = appLocalParts(new Date());
  return `${n.year}-${pad(n.month)}-${pad(n.day)}`;
}
export function addDaysKey(key: string, days: number) {
  return keyOf(new Date(fromKey(key).getTime() + days * 86400000));
}
// 1 = lunes … 7 = domingo.
export function weekdayOf(key: string) {
  return ((fromKey(key).getUTCDay() + 6) % 7) + 1;
}

// Huecos libres de un día, según su horario, la duración y el descanso:
// que no choquen con citas existentes ni hayan pasado ya.
export function freeSlots(s: BookingSettings, day: string, busy: { starts_at: string; ends_at: string }[]): Date[] {
  const h = s.hours[weekdayOf(day)];
  if (!h?.open || s.duration <= 0) return [];
  const slots: Date[] = [];
  const now = Date.now();
  const gapMs = s.gap * 60000;
  for (const [from, to] of [[h.a, h.b], [h.c, h.d]]) {
    const a = toMin(from);
    const b = toMin(to);
    if (a === null || b === null) continue;
    for (let m = a; m + s.duration <= b; m += s.duration + s.gap) {
      const start = fromAppLocalInput(`${day}T${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
      const end = new Date(start.getTime() + s.duration * 60000);
      if (start.getTime() <= now) continue;
      const clash = busy.some(
        (x) => new Date(x.starts_at).getTime() < end.getTime() + gapMs && new Date(x.ends_at).getTime() > start.getTime() - gapMs
      );
      if (!clash) slots.push(start);
    }
  }
  return slots;
}
