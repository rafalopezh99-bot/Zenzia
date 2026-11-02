import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, Select } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS } from "@/lib/paymentMethod";
import { formatAppDateTime, appLocalParts } from "@/lib/timezone";
import { markInvoicePaid } from "@/lib/actions/invoices";
import { whatsappUrl } from "@/lib/whatsapp";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const euros = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;

// Tiempo que lleva sin pagarse: "3 días", "1 semana", "2 meses".
function elapsed(days: number) {
  if (days < 7) return days === 1 ? "1 día" : `${days} días`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return w === 1 ? "1 semana" : `${w} semanas`;
  }
  const m = Math.floor(days / 30);
  return m === 1 ? "1 mes" : `${m} meses`;
}

type Pending = { key: string; invoiceId?: string; appointmentId?: string; name: string; phone: string | null; concept: string; amount: number; days: number };

// Cobros: lo cobrado (facturas pagadas) y lo pendiente (facturas sin pagar y
// citas ya pasadas con precio que aún no se han cobrado). Filtros por URL
// (?estado=&year=&month=&contact_id=&method=), sin JS en el cliente.
export default async function PagosPage(
  props: {
    searchParams: Promise<{ estado?: string; year?: string; month?: string; contact_id?: string; method?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const estado = searchParams.estado === "pendientes" || searchParams.estado === "cobrados" ? searchParams.estado : "todos";

  let query = supabase
    .from("invoices")
    .select("id, concept, amount, payment_method, paid_at, contacts(full_name)")
    .eq("status", "pagada")
    .order("paid_at", { ascending: false });
  let pendingInvoicesQ = supabase
    .from("invoices")
    .select("id, concept, amount, due_date, created_at, contact_id, contacts(full_name, phone)")
    .eq("status", "pendiente");
  let pendingCitasQ = supabase
    .from("appointments")
    .select("id, starts_at, price, contact_id, services(name), contacts(full_name, phone)")
    .in("status", ["scheduled", "completed"])
    .lt("starts_at", new Date().toISOString())
    .gt("price", 0)
    .is("invoice_id", null)
    .is("package_id", null)
    .is("paid_method", null);

  if (searchParams.contact_id) {
    query = query.eq("contact_id", searchParams.contact_id);
    pendingInvoicesQ = pendingInvoicesQ.eq("contact_id", searchParams.contact_id);
    pendingCitasQ = pendingCitasQ.eq("contact_id", searchParams.contact_id);
  }
  if (searchParams.method) query = query.eq("payment_method", searchParams.method);

  // Independientes entre sí: se piden a la vez en vez de una detrás de otra.
  const [{ data: contacts }, { data: allPaid }, { data: pendingInvoices }, { data: pendingCitas }] = await Promise.all([
    supabase.from("contacts").select("id, full_name").order("full_name"),
    query,
    pendingInvoicesQ,
    pendingCitasQ,
  ]);

  // Año/mes se filtran en JS (hora de Sevilla/Madrid) en vez de en la
  // consulta: paid_at es un instante y el "mes" que ve el usuario depende
  // de esa zona horaria, no de la del servidor.
  const year = searchParams.year ? Number(searchParams.year) : null;
  const month = searchParams.month ? Number(searchParams.month) : null;
  const payments = (allPaid ?? []).filter((p: any) => {
    if (!p.paid_at) return false;
    const parts = appLocalParts(p.paid_at);
    if (year && parts.year !== year) return false;
    if (month && parts.month !== month) return false;
    return true;
  });
  const years = Array.from(
    new Set((allPaid ?? []).filter((p: any) => p.paid_at).map((p: any) => appLocalParts(p.paid_at).year))
  ).sort((a, b) => b - a);

  const now = appLocalParts(new Date());
  const paidThisMonth = (allPaid ?? [])
    .filter((p: any) => p.paid_at && appLocalParts(p.paid_at).year === now.year && appLocalParts(p.paid_at).month === now.month)
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  const pending: Pending[] = [
    ...(pendingInvoices ?? []).map((i: any) => ({
      key: `i${i.id}`,
      invoiceId: i.id as string,
      name: i.contacts?.full_name ?? "Sin nombre",
      phone: i.contacts?.phone ?? null,
      concept: i.concept as string,
      amount: Number(i.amount),
      days: daysSince(i.due_date ?? i.created_at),
    })),
    ...(pendingCitas ?? []).map((a: any) => ({
      key: `a${a.id}`,
      appointmentId: a.id as string,
      name: a.contacts?.full_name ?? "Sin nombre",
      phone: a.contacts?.phone ?? null,
      concept: `${a.services?.name ?? "Cita"} del ${new Date(a.starts_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "long" })}`,
      amount: Number(a.price),
      days: daysSince(a.starts_at),
    })),
  ].sort((a, b) => b.days - a.days);
  const pendingTotal = pending.reduce((sum, p) => sum + p.amount, 0);
  const oldest = pending.find((p) => p.days >= 1);

  const buildLink = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...searchParams, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return `/pagos${qs ? `?${qs}` : ""}`;
  };
  const claim = (p: Pending, cls: string) => {
    const url = whatsappUrl(p.phone, `Hola ${p.name.split(" ")[0]}, te recuerdo que tienes pendiente el pago de ${euros(p.amount)} (${p.concept}). ¡Gracias!`);
    return url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>
        Reclamar por WhatsApp
      </a>
    ) : null;
  };
  const whatsappBtn =
    "inline-flex min-h-9 items-center rounded-lg border border-green-300 bg-surface px-3 text-xs font-semibold text-green-800 transition hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950";
  const showPending = estado !== "cobrados";
  const showPaid = estado !== "pendientes";

  return (
    <div>
      <PageHeader moduleHeader
        title="Cobros"
        action={
          <Link
            href="/facturacion"
            className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            Ver facturación
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <div className="text-sm text-slate">Cobrado este mes</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-ink">{euros(paidThisMonth)}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate">Pendiente de cobro</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-ink">{euros(pendingTotal)}</div>
          <div className="text-xs text-slate">{pending.length === 1 ? "1 cobro por reclamar" : `${pending.length} cobros por reclamar`}</div>
        </Card>
      </div>

      {oldest && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <div>
            <strong className="block font-semibold">
              {oldest.name} lleva {elapsed(oldest.days)} sin pagarte
            </strong>
            {euros(oldest.amount)} · {oldest.concept}
          </div>
          {claim(oldest, whatsappBtn)}
        </div>
      )}

      <div className="mb-4 inline-flex rounded-full border border-line p-1">
        {[
          { key: "todos", label: "Todos" },
          { key: "pendientes", label: `Pendientes (${pending.length})` },
          { key: "cobrados", label: "Cobrados" },
        ].map((t) => (
          <Link
            key={t.key}
            href={buildLink({ estado: t.key === "todos" ? undefined : t.key })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${estado === t.key ? "bg-brand text-white" : "text-slate hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-2 text-sm">
          {searchParams.estado && <input type="hidden" name="estado" value={searchParams.estado} />}
          <Select name="year" defaultValue={searchParams.year ?? ""}>
            <option value="">Todos los años</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select name="month" defaultValue={searchParams.month ?? ""}>
            <option value="">Todos los meses</option>
            {MONTH_NAMES.map((label, idx) => (
              <option key={label} value={idx + 1}>
                {label}
              </option>
            ))}
          </Select>
          <Select name="contact_id" defaultValue={searchParams.contact_id ?? ""}>
            <option value="">{`Todos (${terms.contacts.toLowerCase()})`}</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Select name="method" defaultValue={searchParams.method ?? ""}>
            <option value="">Todos los métodos</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            Filtrar
          </button>
          {(searchParams.year || searchParams.month || searchParams.contact_id || searchParams.method) && (
            <Link href={searchParams.estado ? `/pagos?estado=${searchParams.estado}` : "/pagos"} className="text-xs text-brand hover:underline">
              Quitar filtros
            </Link>
          )}
        </form>
      </Card>

      <Card>
        <ul className="divide-y divide-line">
          {showPending &&
            pending.map((p) => (
              <li key={p.key} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <div className="font-medium text-ink">{p.name}</div>
                  <div className="text-xs text-slate">{p.concept}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tabular-nums text-ink">{euros(p.amount)}</span>
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">{p.days >= 1 ? `Hace ${elapsed(p.days)}` : "Sin cobrar"}</span>
                  {p.invoiceId ? (
                    <form action={markInvoicePaid.bind(null, p.invoiceId)} className="flex items-center gap-1">
                      <select name="payment_method" aria-label="Método de pago" required defaultValue="" className="min-h-9 rounded-lg border border-line bg-surface px-2 text-xs text-ink">
                        <option value="" disabled>Método</option>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
                        ))}
                      </select>
                      <button className="min-h-9 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-brand transition hover:bg-paper-deep">Marcar cobrado</button>
                    </form>
                  ) : (
                    <Link href={`/citas/${p.appointmentId}/editar`} className="inline-flex min-h-9 items-center rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-brand transition hover:bg-paper-deep">
                      Cobrar
                    </Link>
                  )}
                  {claim(p, whatsappBtn)}
                </div>
              </li>
            ))}
          {showPaid &&
            payments.map((p: any) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <div className="font-medium text-ink">{p.contacts?.full_name}</div>
                  <div className="text-xs text-slate">
                    {p.concept} · {PAYMENT_METHOD_LABEL[p.payment_method] ?? p.payment_method ?? "—"} · {p.paid_at ? formatAppDateTime(p.paid_at) : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-ink">{euros(Number(p.amount))}</span>
                  <span className="text-xs font-semibold text-green-800 dark:text-green-300">Cobrado</span>
                </div>
              </li>
            ))}
          {((!showPending || pending.length === 0) && (!showPaid || payments.length === 0)) && (
            <li className="py-3 text-sm text-slate">No hay cobros que mostrar.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
