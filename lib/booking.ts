import { fromAppLocalInput, appLocalParts } from "@/lib/timezone";

export interface BookingSettings {
  enabled: boolean;
  duration: number; // minutos
  days: number[]; // 1 = lunes … 7 = domingo
  start: string; // "09:00"
  end: string; // "19:00"
}

export const DEFAULT_BOOKING: BookingSettings = { enabled: false, duration: 60, days: [1, 2, 3, 4, 5], start: "09:00", end: "19:00" };

export function parseBooking(raw: unknown): BookingSettings {
  const b = (raw ?? {}) as Partial<BookingSettings>;
  return {
    enabled: !!b.enabled,
    duration: Number(b.duration) > 0 ? Number(b.duration) : 60,
    days: Array.isArray(b.days) ? b.days.map(Number) : DEFAULT_BOOKING.days,
    start: typeof b.start === "string" ? b.start : DEFAULT_BOOKING.start,
    end: typeof b.end === "string" ? b.end : DEFAULT_BOOKING.end,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

// Próximos `count` días laborables (según la configuración) en hora de Madrid,
// como "YYYY-MM-DD".
export function bookableDays(s: BookingSettings, count = 14): string[] {
  const out: string[] = [];
  const now = appLocalParts(new Date());
  const base = new Date(Date.UTC(now.year, now.month - 1, now.day));
  for (let i = 0; out.length < count && i < 60; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    const weekday = ((d.getUTCDay() + 6) % 7) + 1; // 1 = lunes
    if (s.days.includes(weekday)) out.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
  }
  return out;
}

// Huecos libres de un día: cada `duration` minutos dentro del horario, que
// no choquen con citas existentes ni hayan pasado ya.
export function freeSlots(s: BookingSettings, day: string, busy: { starts_at: string; ends_at: string }[]): Date[] {
  const slots: Date[] = [];
  const now = Date.now();
  for (let m = toMin(s.start); m + s.duration <= toMin(s.end); m += s.duration) {
    const start = fromAppLocalInput(`${day}T${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    const end = new Date(start.getTime() + s.duration * 60000);
    if (start.getTime() <= now) continue;
    const clash = busy.some((b) => new Date(b.starts_at) < end && new Date(b.ends_at) > start);
    if (!clash) slots.push(start);
  }
  return slots;
}
