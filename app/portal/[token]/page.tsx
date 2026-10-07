import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/appointmentStatus";

export const dynamic = "force-dynamic";

const euro = (n: number) => `${Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const fecha = (d: string, time = false) =>
  new Date(d).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

// Portal del cliente (Pro): enlace privado por cliente (contacts.portal_token)
// con sus citas, su evolución/pautas y sus facturas en PDF.
export default async function PortalPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data } = await supabase.rpc("public_portal", { p_token: params.token });
  if (!data) notFound();

  const logoUrl = data.company.logo_path
    ? supabase.storage.from("logos").getPublicUrl(data.company.logo_path).data.publicUrl
    : null;
  const now = Date.now();
  const upcoming = data.appointments.filter((a: any) => new Date(a.starts_at).getTime() > now).reverse();
  const past = data.appointments.filter((a: any) => new Date(a.starts_at).getTime() <= now);
  const section = "rounded-2xl border border-line bg-surface p-5";
  const h2 = "mb-3 text-xs font-semibold uppercase tracking-wide text-slate";

  return (
    <div className="min-h-screen bg-paper px-4 py-10 text-ink">
      <div className="mx-auto max-w-xl space-y-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 rounded-xl object-contain" />}
          <div>
            <div className="text-xs text-slate">{data.company.name}</div>
            <h1 className="text-2xl font-bold">Hola, {data.contact.name}</h1>
          </div>
        </div>

        <div className={section}>
          <h2 className={h2}>Próximas citas</h2>
          {upcoming.length ? (
            <ul className="space-y-1 text-sm">
              {upcoming.map((a: any) => (
                <li key={a.starts_at} className="capitalize">{fecha(a.starts_at, true)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate">No tienes citas próximas.</p>
          )}
          <a href={`/reservar/${data.company.id}`} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
            Reservar una cita →
          </a>
        </div>

        {data.progress.length > 0 && (
          <div className={section}>
            <h2 className={h2}>Tu evolución y pautas</h2>
            <ul className="space-y-2 text-sm">
              {data.progress.map((p: any, i: number) => (
                <li key={i} className="border-b border-line pb-2 last:border-0">
                  <span className="text-xs text-slate">{fecha(p.created_at)}</span>
                  <div>
                    {p.data?.label ? `${p.data.label}: ${p.data.value}` : Object.values(p.data ?? {}).join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={section}>
          <h2 className={h2}>Facturas</h2>
          {data.invoices.length ? (
            <ul className="space-y-2 text-sm">
              {data.invoices.map((i: any) => (
                <li key={i.id} className="flex items-center justify-between gap-2">
                  <span>
                    {i.doc_number ?? "—"} · {i.issue_date ? fecha(i.issue_date) : ""}
                  </span>
                  <span className="flex items-center gap-3">
                    {euro(i.amount)}
                    <a href={`/api/portal/${params.token}/facturas/${i.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                      PDF
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate">Todavía no tienes facturas.</p>
          )}
        </div>

        {past.length > 0 && (
          <div className={section}>
            <h2 className={h2}>Historial de citas</h2>
            <ul className="space-y-1 text-sm">
              {past.map((a: any) => (
                <li key={a.starts_at} className="flex justify-between capitalize">
                  <span>{fecha(a.starts_at, true)}</span>
                  <span className="text-slate">{APPOINTMENT_STATUS_LABEL[a.status] ?? a.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
