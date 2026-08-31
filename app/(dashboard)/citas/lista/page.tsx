import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PageHeader, primaryButtonClass, Badge, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE } from "@/lib/appointmentStatus";

export default async function CitasListaPage() {
  const supabase = createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, status, contacts(full_name)")
    .order("starts_at", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Agenda · Lista"
        action={
          <div className="flex gap-2">
            <Link
              href="/citas"
              className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              Ver semana
            </Link>
            <Link
              href="/citas/calendario"
              className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              Ver mes
            </Link>
            <Link href="/citas/nueva" className={primaryButtonClass}>
              Nueva cita
            </Link>
          </div>
        }
      />

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Fecha</th>
              <th className={thEl}>Contacto</th>
              <th className={thEl}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(appointments ?? []).map((a: any) => (
              <tr key={a.id} className={trEl}>
                <td className={tdEl}>{new Date(a.starts_at).toLocaleString("es-ES")}</td>
                <td className={tdEl}>{a.contacts?.full_name}</td>
                <td className={tdEl}>
                  <Badge tone={APPOINTMENT_STATUS_TONE[a.status] ?? "neutral"}>
                    {APPOINTMENT_STATUS_LABEL[a.status] ?? a.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
