import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookAppointment } from "@/lib/actions/booking";
import { addDaysKey, freeSlots, parseBooking, todayKey } from "@/lib/booking";
import { formatAppTime, fromAppLocalInput } from "@/lib/timezone";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ m?: string; day?: string; at?: string; ok?: string; error?: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { companyId } = await props.params;
  const supabase = await createClient();
  const { data: info } = await supabase.rpc("public_booking_info", { p_company: companyId });
  return { title: { absolute: info?.name ? `Reserva tu cita · ${info.name}` : "Reserva tu cita" }, robots: { index: false } };
}

const inputClass = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand";
const dateLabel = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString("es-ES", { timeZone: "UTC", ...opts });

// Reservas online (Smart y Pro): página pública, sin cuenta ni login. El
// cliente elige día en un calendario mensual, luego la hora y deja sus datos.
// Todo sale de lo que la clínica configura en su perfil.
export default async function ReservarPage(props: Props) {
  const searchParams = await props.searchParams;
  const { companyId } = await props.params;
  const supabase = await createClient();
  const { data: info } = await supabase.rpc("public_booking_info", { p_company: companyId });
  if (!info) notFound();

  const settings = parseBooking(info.booking);
  const logoUrl = info.logo_path ? supabase.storage.from("logos").getPublicUrl(info.logo_path).data.publicUrl : null;
  const book = bookAppointment.bind(null, companyId);
  const base = `/reservar/${companyId}`;
  const today = todayKey();
  const lastDay = addDaysKey(today, settings.weeks * 7);
  const isKey = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const day = isKey(searchParams.day) && searchParams.day! >= today && searchParams.day! <= lastDay ? searchParams.day! : null;

  const busyBetween = async (from: string, to: string) => {
    const { data } = await supabase.rpc("public_busy_slots", {
      p_company: companyId,
      p_from: fromAppLocalInput(`${from}T00:00`).toISOString(),
      p_to: fromAppLocalInput(`${to}T00:00`).toISOString(),
    });
    return (data ?? []) as { starts_at: string; ends_at: string }[];
  };

  // Paso 2 y 3: horas del día elegido. La hora solo vale si sigue libre.
  const slots = day ? freeSlots(settings, day, await busyBetween(day, addDaysKey(day, 1))) : [];
  const at = day && slots.some((s) => s.toISOString() === searchParams.at) ? searchParams.at! : null;

  // Paso 1: calendario del mes, con los días que tienen horas libres.
  const firstMonth = today.slice(0, 7);
  const lastMonth = lastDay.slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(searchParams.m ?? "") && searchParams.m! >= firstMonth && searchParams.m! <= lastMonth ? searchParams.m! : firstMonth;
  const [yy, mm] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(yy, mm - 1, 1)).getUTCDay() + 6) % 7;
  const monthParam = (delta: number) => {
    const d = new Date(Date.UTC(yy, mm - 1 + delta, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const cells: { key: string; free: boolean }[] = [];
  if (!day && !searchParams.ok) {
    const first = `${month}-01`;
    const busy = await busyBetween(first, addDaysKey(first, daysInMonth));
    for (let n = 1; n <= daysInMonth; n++) {
      const key = `${month}-${String(n).padStart(2, "0")}`;
      cells.push({ key, free: key >= today && key <= lastDay && freeSlots(settings, key, busy).length > 0 });
    }
  }

  const step = day ? (at ? 3 : 2) : 1;
  const morning = slots.filter((s) => Number(formatAppTime(s.toISOString()).slice(0, 2)) < 14);
  const afternoon = slots.filter((s) => Number(formatAppTime(s.toISOString()).slice(0, 2)) >= 14);
  const hourGroup = (title: string, list: Date[]) =>
    list.length > 0 && (
      <div>
        <div className="mb-2 mt-4 text-xs font-semibold text-slate">{title}</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {list.map((s) => {
            const iso = s.toISOString();
            return (
              <Link
                key={iso}
                href={`${base}?day=${day}&at=${encodeURIComponent(iso)}`}
                className="rounded-xl border border-line bg-surface py-3 text-center text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white"
              >
                {formatAppTime(iso)}
              </Link>
            );
          })}
        </div>
      </div>
    );
  const backLink = (href: string, label: string) => (
    <Link href={href} className="mb-2 inline-block py-2 text-sm font-semibold text-brand hover:underline">
      ← {label}
    </Link>
  );
  const longDay = (key: string) => dateLabel(key, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-paper text-ink sm:px-4 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col overflow-hidden border-line bg-surface sm:rounded-2xl sm:border md:flex-row">
          <aside className="flex flex-col gap-5 bg-[#0b2a4a] p-5 text-[#dce7f1] md:w-72 md:shrink-0 md:p-7">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-white object-contain p-1" />}
              <h1 className="text-xl font-semibold leading-tight text-white">{info.name}</h1>
            </div>
            <ul className="hidden space-y-2 text-sm md:block">
              <li>Sesión de {settings.duration} minutos</li>
              {settings.priceOn && settings.price && <li>{settings.price}</li>}
              <li>Sin registrarte ni crear cuenta</li>
            </ul>
            {settings.priceOn && settings.price && <p className="text-sm md:hidden">{settings.price}</p>}
            {day && !searchParams.ok && (
              <div className="border-t border-[#2c4e70] pt-4 md:mt-auto">
                <div className="text-xs text-[#c5d6e6]">Tu cita</div>
                <div className="text-lg font-semibold first-letter:uppercase text-white">{longDay(day)}</div>
                <div className="text-sm text-[#c5d6e6]">{at ? `${formatAppTime(at)} · ${settings.duration} min` : "Elige una hora"}</div>
              </div>
            )}
          </aside>

          <main className="min-w-0 flex-1 p-5 sm:p-8">
            {searchParams.ok ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-pale text-2xl text-brand" aria-hidden="true">
                  ✓
                </div>
                <h2 className="text-2xl font-semibold">¡Cita reservada!</h2>
                <p className="mt-2 text-sm text-slate first-letter:uppercase">
                  {new Date(searchParams.ok).toLocaleString("es-ES", {
                    timeZone: "Europe/Madrid",
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-1 text-sm text-slate">{info.name}</p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex gap-1.5" role="img" aria-label={`Paso ${step} de 3`}>
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={`h-1 flex-1 rounded-full ${n <= step ? "bg-brand" : "bg-brand-pale"}`} />
                  ))}
                </div>
                {searchParams.error && (
                  <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {searchParams.error}
                  </p>
                )}

                {step === 1 && (
                  <>
                    <h2 className="text-2xl font-semibold">¿Qué día te viene bien?</h2>
                    <p className="mb-4 mt-1 text-sm text-slate">Los días marcados tienen horas libres.</p>
                    <div className="mb-3 flex items-center justify-between">
                      {month > firstMonth ? (
                        <Link href={`${base}?m=${monthParam(-1)}`} aria-label="Mes anterior" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-brand hover:bg-paper-deep">
                          ‹
                        </Link>
                      ) : (
                        <span className="h-11 w-11" />
                      )}
                      <strong className="font-semibold first-letter:uppercase">{dateLabel(`${month}-15`, { month: "long", year: "numeric" })}</strong>
                      {month < lastMonth ? (
                        <Link href={`${base}?m=${monthParam(1)}`} aria-label="Mes siguiente" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-brand hover:bg-paper-deep">
                          ›
                        </Link>
                      ) : (
                        <span className="h-11 w-11" />
                      )}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                        <div key={d} className="py-1 text-center text-xs font-semibold text-slate" aria-hidden="true">
                          {d}
                        </div>
                      ))}
                      {Array.from({ length: offset }, (_, i) => (
                        <div key={`e${i}`} />
                      ))}
                      {cells.map((c) => {
                        const n = Number(c.key.slice(8));
                        const ring = c.key === today ? " ring-1 ring-inset ring-brand" : "";
                        return c.free ? (
                          <Link
                            key={c.key}
                            href={`${base}?day=${c.key}`}
                            aria-label={`${longDay(c.key)}, con horas libres`}
                            className={`flex aspect-square min-h-11 items-center justify-center rounded-xl bg-brand-pale font-semibold text-brand transition hover:bg-brand hover:text-white${ring}`}
                          >
                            {n}
                          </Link>
                        ) : (
                          <span key={c.key} className={`flex aspect-square min-h-11 items-center justify-center rounded-xl text-slate/70${ring}`}>
                            {n}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}

                {step === 2 && day && (
                  <>
                    {backLink(`${base}?m=${day.slice(0, 7)}`, "Cambiar día")}
                    <h2 className="text-2xl font-semibold first-letter:uppercase">{longDay(day)}</h2>
                    <p className="mt-1 text-sm text-slate">{slots.length ? "Elige la hora que prefieras." : "Ya no quedan horas libres este día."}</p>
                    {hourGroup("Mañana", morning)}
                    {hourGroup("Tarde", afternoon)}
                  </>
                )}

                {step === 3 && day && at && (
                  <>
                    {backLink(`${base}?day=${day}`, "Cambiar hora")}
                    <h2 className="text-2xl font-semibold">Ya casi está</h2>
                    <p className="mb-5 mt-1 text-sm text-slate">Solo necesitamos unos datos para confirmar tu cita.</p>
                    <form action={book} className="space-y-4">
                      <input type="hidden" name="starts_at" value={at} />
                      <input type="hidden" name="day" value={day} />
                      <div>
                        <label htmlFor="name" className="mb-1 block text-sm font-medium">Nombre y apellidos</label>
                        <input id="name" name="name" required autoComplete="name" className={inputClass} />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="phone" className="mb-1 block text-sm font-medium">Teléfono</label>
                          <input id="phone" name="phone" type="tel" required autoComplete="tel" className={inputClass} />
                        </div>
                        <div>
                          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email <span className="font-normal text-slate">(para el recordatorio)</span></label>
                          <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
                        </div>
                      </div>
                      {settings.notesOn && (
                        <div>
                          <label htmlFor="notes" className="mb-1 block text-sm font-medium">
                            {settings.notesLabel} <span className="font-normal text-slate">(opcional)</span>
                          </label>
                          <textarea id="notes" name="notes" rows={4} maxLength={1000} className={inputClass} />
                          <p className="mt-1 text-xs text-slate">{settings.notesHelp}</p>
                        </div>
                      )}
                      <label className="flex items-start gap-2.5 text-xs text-slate">
                        <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>
                          He leído la{" "}
                          <a href="/privacidad" target="_blank" className="text-brand underline">
                            política de privacidad
                          </a>{" "}
                          y acepto que la clínica trate estos datos, incluidos los de salud, para gestionar mi cita.
                        </span>
                      </label>
                      <button className="w-full rounded-xl bg-brand py-3 font-semibold text-white">Confirmar cita</button>
                    </form>
                  </>
                )}
              </>
            )}
          </main>
        </div>
        <p className="py-4 text-center text-xs text-slate">Reservas con Zenzia</p>
      </div>
    </div>
  );
}
