import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Calendario suscribible (ICS) para Google Calendar / iPhone / Outlook.
// Solo lectura: las citas se siguen gestionando en Zenzia.
export async function GET(_req: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_calendar", { p_token: token.replace(/\.ics$/, "") });
  const stamp = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[,;\\]/g, (m) => `\\${m}`);
  const events = ((data ?? []) as any[]).map((a) =>
    [
      "BEGIN:VEVENT",
      `UID:${a.id}@zenzia.es`,
      `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(a.starts_at)}`,
      `DTEND:${stamp(a.ends_at)}`,
      `SUMMARY:${esc(`${a.contact}${a.service ? ` · ${a.service}` : ""}`)}`,
      "END:VEVENT",
    ].join("\r\n")
  );
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Zenzia//ES", "X-WR-CALNAME:Zenzia", ...events, "END:VCALENDAR"].join("\r\n");
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
}
