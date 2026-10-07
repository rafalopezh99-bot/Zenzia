import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cancelAppointmentByToken } from "@/lib/actions/publicAppointment";

export const dynamic = "force-dynamic";

// Enlace del email de recordatorio: el cliente ve su cita y puede cancelarla
// (con al menos 2 h de antelación) para liberar el hueco.
export default async function CitaPublicaPage(props: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ cancelada?: string; error?: string }>;
}) {
  const { token } = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: a } = await supabase.rpc("public_appointment", { p_token: token });
  if (!a) notFound();
  const when = new Date(a.starts_at).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 text-ink">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate">{a.company}</div>
        <h1 className="mt-1 text-xl font-bold">Tu cita</h1>
        <p className="mt-3 capitalize">{when}</p>
        {a.service && <p className="text-sm text-slate">{a.service}</p>}
        {searchParams.error && <p className="mt-4 text-sm text-red-600">{searchParams.error}</p>}
        {a.status === "cancelled" || searchParams.cancelada ? (
          <>
            <p className="mt-4 font-semibold text-red-600">Cita cancelada</p>
            <a href={`/reservar/${a.company_id}`} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
              Reservar otra cita →
            </a>
          </>
        ) : a.status === "scheduled" ? (
          <form action={cancelAppointmentByToken.bind(null, token)} className="mt-5">
            <button className="w-full rounded-xl border border-red-300 py-2.5 text-sm font-semibold text-red-600">
              Cancelar la cita
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
