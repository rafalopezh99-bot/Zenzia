import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookAppointment } from "@/lib/actions/booking";
import { bookableDays, freeSlots, parseBooking } from "@/lib/booking";
import { formatAppTime, fromAppLocalInput } from "@/lib/timezone";

export const dynamic = "force-dynamic";

// Reservas online (Smart y Pro): página pública donde el cliente elige día y
// hora libres y deja nombre y teléfono. Sin cuenta ni login.
export default async function ReservarPage(
  props: {
    params: Promise<{ companyId: string }>;
    searchParams: Promise<{ day?: string; at?: string; ok?: string; error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const supabase = await createClient();
  const { data: info } = await supabase.rpc("public_booking_info", { p_company: params.companyId });
  if (!info) notFound();

  const settings = parseBooking(info.booking);
  const days = bookableDays(settings);
  const day = days.includes(searchParams.day ?? "") ? searchParams.day! : days[0];
  const from = fromAppLocalInput(`${day}T00:00`);
  const to = new Date(from.getTime() + 86400000);
  const { data: busy } = await supabase.rpc("public_busy_slots", {
    p_company: params.companyId,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  const slots = freeSlots(settings, day, busy ?? []);
  const logoUrl = info.logo_path ? supabase.storage.from("logos").getPublicUrl(info.logo_path).data.publicUrl : null;
  const book = bookAppointment.bind(null, params.companyId);
  const base = `/reservar/${params.companyId}`;
  const dayLabel = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-paper px-4 py-10 text-ink">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 rounded-xl object-contain" />}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate">Reserva tu cita</div>
            <h1 className="text-2xl font-bold">{info.name}</h1>
          </div>
        </div>

        {searchParams.ok ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center">
            <div className="text-3xl">✓</div>
            <p className="mt-2 font-semibold">¡Cita reservada!</p>
            <p className="mt-1 text-sm text-slate">
              {new Date(searchParams.ok).toLocaleString("es-ES", {
                timeZone: "Europe/Madrid",
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <>
            {searchParams.error && (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</p>
            )}

            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => (
                <Link
                  key={d}
                  href={`${base}?day=${d}`}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-sm capitalize ${
                    d === day ? "border-brand bg-brand text-white" : "border-line bg-surface"
                  }`}
                >
                  {dayLabel(d)}
                </Link>
              ))}
            </div>

            <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s) => {
                const iso = s.toISOString();
                return (
                  <Link
                    key={iso}
                    href={`${base}?day=${day}&at=${encodeURIComponent(iso)}`}
                    className={`rounded-xl border py-2 text-center text-sm font-medium ${
                      searchParams.at === iso ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand"
                    }`}
                  >
                    {formatAppTime(iso)}
                  </Link>
                );
              })}
              {slots.length === 0 && <p className="col-span-full text-sm text-slate">No quedan huecos libres este día.</p>}
            </div>

            {searchParams.at && (
              <form action={book} className="space-y-3 rounded-2xl border border-line bg-surface p-5">
                <input type="hidden" name="starts_at" value={searchParams.at} />
                <p className="text-sm font-semibold">
                  {dayLabel(day)} · {formatAppTime(searchParams.at)} ({settings.duration} min)
                </p>
                <input name="name" required placeholder="Nombre y apellidos" className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
                <input name="phone" type="tel" required placeholder="Teléfono" className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
                <input name="email" type="email" placeholder="Email (para el recordatorio)" className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
                <button className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Confirmar reserva</button>
              </form>
            )}
          </>
        )}
        <p className="mt-10 text-center text-xs text-slate">Reservas con Zenzia</p>
      </div>
    </div>
  );
}
