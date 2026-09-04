// Zona horaria fija de la app (Sevilla/Madrid). Toda creación, edición y
// visualización de citas/clases se maneja en esta hora, con el cambio de
// horario de verano/invierno resuelto automáticamente vía Intl — en vez de
// depender de la zona horaria del servidor (Netlify corre en UTC).
export const APP_TIMEZONE = "Europe/Madrid";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function offsetMinutesAt(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) === 24 ? 0 : Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

// Convierte un valor de <input type="datetime-local"> ("YYYY-MM-DDTHH:mm"),
// interpretado como hora de Sevilla/Madrid, al instante real (UTC) que
// representa.
export function fromAppLocalInput(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number);
  const utcGuess = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  const offset = offsetMinutesAt(new Date(utcGuess), APP_TIMEZONE);
  return new Date(utcGuess - offset * 60000);
}

// Componentes (año, mes, día, hora, minuto, día de la semana) de un
// instante ya convertidos a hora de Sevilla/Madrid.
export function appLocalParts(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });
  const parts = dtf.formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) === 24 ? 0 : Number(map.hour),
    minute: Number(map.minute),
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0, // 0=domingo … 6=sábado, como Date#getDay()
  };
}

// Valor listo para el defaultValue de un <input type="datetime-local">,
// mostrando el instante en hora de Sevilla/Madrid.
export function toAppLocalInput(date: Date | string): string {
  const p = appLocalParts(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatAppTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIMEZONE });
}

export function formatAppDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("es-ES", { timeZone: APP_TIMEZONE });
}
