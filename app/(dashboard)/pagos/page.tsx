import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, Select, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS } from "@/lib/paymentMethod";
import { formatAppDateTime, appLocalParts } from "@/lib/timezone";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Historial de pagos: no es una tabla nueva, es Facturación filtrada a lo
// ya cobrado (status = "pagada"). Filtros combinables por año, mes, alumno
// y método de pago, para poder ir mirando estadísticas — todo por URL
// (?year=&month=&contact_id=&method=), sin JS en el cliente.
export default async function PagosPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string; contact_id?: string; method?: string };
}) {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);

  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");

  let query = supabase
    .from("invoices")
    .select("id, concept, amount, payment_method, paid_at, contacts(full_name)")
    .eq("status", "pagada")
    .order("paid_at", { ascending: false });

  if (searchParams.contact_id) query = query.eq("contact_id", searchParams.contact_id);
  if (searchParams.method) query = query.eq("payment_method", searchParams.method);

  const { data: allPaid } = await query;

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

  const total = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const years = Array.from(
    new Set((allPaid ?? []).filter((p: any) => p.paid_at).map((p: any) => appLocalParts(p.paid_at).year))
  ).sort((a, b) => b - a);

  const buildLink = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...searchParams, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return `/pagos${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Historial de pagos"
        action={
          <Link
            href="/facturacion"
            className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            Ver facturación
          </Link>
        }
      />

      <Card className="mb-6 max-w-xs">
        <div className="text-2xl font-semibold text-ink">{total.toFixed(2)} €</div>
        <div className="text-sm text-slate">Cobrado con estos filtros</div>
      </Card>

      <Card className="mb-6">
        <form className="flex flex-wrap items-end gap-2 text-sm">
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
            <Link href="/pagos" className="text-xs text-brand hover:underline">
              Quitar filtros
            </Link>
          )}
        </form>
      </Card>

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Fecha de cobro</th>
              <th className={thEl}>{terms.contact}</th>
              <th className={thEl}>Concepto</th>
              <th className={thEl}>Importe</th>
              <th className={thEl}>Método</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className={trEl}>
                <td className={tdEl}>{p.paid_at ? formatAppDateTime(p.paid_at) : "—"}</td>
                <td className={tdEl}>{p.contacts?.full_name}</td>
                <td className={tdEl}>{p.concept}</td>
                <td className={tdEl}>{Number(p.amount).toFixed(2)} €</td>
                <td className={tdEl}>{PAYMENT_METHOD_LABEL[p.payment_method] ?? p.payment_method ?? "—"}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td className={tdEl} colSpan={5}>
                  <span className="text-slate/70">Sin pagos con estos filtros.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
