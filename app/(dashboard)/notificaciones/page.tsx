import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { convertNotificationToContact, dismissNotification } from "@/lib/actions/notifications";
import {
  PageHeader,
  Badge,
  GhostButton,
  PrimaryButton,
  secondaryLinkClass,
  tableWrap,
  tableEl,
  theadEl,
  thEl,
  tdEl,
  trEl,
} from "@/components/ui";

// Bandeja de entrada de dos tipos de aviso, distinguidos por "kind":
// - "lead" (de siempre): formulario de zenzia.es/rldigitalstudios.com y, en
//   el futuro, DMs de Instagram/TikTok. Al pulsar "Contactar" se crea el
//   contacto de verdad — ver lib/actions/notifications.ts.
// - "cobro_pendiente" (vertical academia): lo genera solo el ciclo diario
//   de facturación (notify_unpaid_invoices, ver migración de facturación
//   recurrente) cuando un bono lleva más de 5 días vencido sin pagar. El
//   alumno ya existe, así que aquí no hay "Contactar": se enlaza a su ficha.
const SOURCE_LABEL: Record<string, string> = {
  formulario_web: "Formulario web",
  instagram_dm: "Instagram DM",
  tiktok_dm: "TikTok DM",
  facturacion: "Facturación",
};

const SOURCE_TONE: Record<string, "neutral" | "green" | "amber" | "red" | "violet"> = {
  formulario_web: "neutral",
  instagram_dm: "violet",
  tiktok_dm: "red",
  facturacion: "amber",
};

const STATUS_LABEL: Record<string, string> = {
  nueva: "Nueva",
  contactada: "Contactada",
  descartada: "Descartada",
};

const STATUS_TONE: Record<string, "neutral" | "green" | "amber" | "red" | "violet"> = {
  nueva: "amber",
  contactada: "green",
  descartada: "neutral",
};

export default async function NotificacionesPage() {
  const supabase = createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, source, full_name, email, phone, handle, message, status, contact_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const nuevas = (notifications ?? []).filter((n: any) => n.status === "nueva").length;

  return (
    <div>
      <PageHeader eyebrow={nuevas > 0 ? `${nuevas} sin leer` : "Al día"} title="Notificaciones" />

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Origen</th>
              <th className={thEl}>Quién</th>
              <th className={thEl}>Mensaje</th>
              <th className={thEl}>Fecha</th>
              <th className={thEl}>Estado</th>
              <th className={thEl}></th>
            </tr>
          </thead>
          <tbody>
            {(notifications ?? []).map((n: any) => {
              const contactar = convertNotificationToContact.bind(null, n.id);
              const descartar = dismissNotification.bind(null, n.id);
              return (
                <tr key={n.id} className={trEl}>
                  <td className={tdEl}>
                    <Badge tone={SOURCE_TONE[n.source] ?? "neutral"}>{SOURCE_LABEL[n.source] ?? n.source}</Badge>
                  </td>
                  <td className={tdEl}>
                    <div className="text-ink">{n.full_name || n.handle || "—"}</div>
                    <div className="text-xs text-slate/70">{n.email || n.phone || n.handle || ""}</div>
                  </td>
                  <td className={`${tdEl} max-w-xs`}>
                    <span className="text-slate">{n.message || "—"}</span>
                  </td>
                  <td className={tdEl}>
                    <span className="text-slate/70">{new Date(n.created_at).toLocaleString("es-ES")}</span>
                  </td>
                  <td className={tdEl}>
                    <Badge tone={STATUS_TONE[n.status] ?? "neutral"}>{STATUS_LABEL[n.status] ?? n.status}</Badge>
                  </td>
                  <td className={tdEl}>
                    {n.status === "nueva" && (
                      <div className="flex items-center gap-2">
                        {n.kind === "cobro_pendiente" ? (
                          n.contact_id && (
                            <Link href={`/contactos/${n.contact_id}`} className={secondaryLinkClass}>
                              Ver alumno
                            </Link>
                          )
                        ) : (
                          <form action={contactar}>
                            <PrimaryButton className="px-3 py-1.5 text-xs">Contactar</PrimaryButton>
                          </form>
                        )}
                        <form action={descartar}>
                          <GhostButton>Descartar</GhostButton>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {(notifications ?? []).length === 0 && (
              <tr className={trEl}>
                <td className={tdEl} colSpan={6}>
                  <span className="text-slate/70">Sin notificaciones todavía.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
