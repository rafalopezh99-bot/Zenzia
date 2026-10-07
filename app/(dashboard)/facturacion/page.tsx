import { createClient } from "@/lib/supabase/server";
import { markInvoicePaid, deleteInvoice } from "@/lib/actions/invoices";
import { convertQuote, deleteQuote } from "@/lib/actions/documents";
import { Card, PageHeader, Select, GhostButton, ghostLinkClass, primaryButtonClass, Badge, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS } from "@/lib/paymentMethod";
import DeleteInvoiceButton from "@/components/DeleteInvoiceButton";
import Link from "next/link";

const TABS = [
  { key: "facturas", label: "Facturas", kind: "factura" },
  { key: "presupuestos", label: "Presupuestos", kind: "presupuesto" },
  { key: "proformas", label: "Proformas", kind: "proforma" },
] as const;

const euro = (n: number) => `${Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const fecha = (d: string | null) => (d ? new Date(d).toLocaleDateString("es-ES") : "—");

// Facturación: facturas, presupuestos y proformas en pestañas (?tab=...).
// Crear lleva a /facturacion/nuevo?tipo=...; cada documento se descarga en
// PDF con los datos fiscales y el logo del negocio.
export default async function FacturacionPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0];
  const supabase = createClient();

  const isInvoices = tab.key === "facturas";
  const { data: rows } = isInvoices
    ? await supabase
        .from("invoices")
        .select("id, doc_number, issue_date, concept, amount, status, due_date, contacts(full_name)")
        .order("created_at", { ascending: false })
    : await supabase
        .from("quotes")
        .select("id, doc_number, issue_date, title, amount, status, contacts(full_name)")
        .eq("kind", tab.kind)
        .order("created_at", { ascending: false });

  const list = (rows ?? []) as any[];
  const total = list.reduce((s, i) => s + Number(i.amount), 0);
  const pendiente = list.filter((i) => i.status === "pendiente").reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div>
      <PageHeader
        title="Facturación"
        action={
          <div className="flex flex-wrap gap-2">
            {isInvoices && (
              <Link
                href="/pagos"
                className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
              >
                Historial de pagos
              </Link>
            )}
            <Link href={`/facturacion/nuevo?tipo=${tab.kind}`} className={primaryButtonClass}>
              {tab.kind === "presupuesto" ? "+ Nuevo presupuesto" : `+ Nueva ${tab.kind}`}
            </Link>
          </div>
        }
      />

      <div className="mb-6 inline-flex rounded-full border border-line p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/facturacion?tab=${t.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              t.key === tab.key ? "bg-brand text-white" : "text-slate hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid max-w-md grid-cols-2 gap-4">
        <Card>
          <div className="text-2xl font-semibold text-ink">{euro(total)}</div>
          <div className="text-sm text-slate">{isInvoices ? "Total facturado" : "Total presupuestado"}</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-amber-600">{euro(pendiente)}</div>
          <div className="text-sm text-slate">{isInvoices ? "Pendiente de cobro" : "Pendiente de aceptar"}</div>
        </Card>
      </div>

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Nº</th>
              <th className={thEl}>Fecha</th>
              <th className={thEl}>Cliente</th>
              <th className={`${thEl} hidden sm:table-cell`}>Concepto</th>
              <th className={thEl}>Total</th>
              <th className={thEl}>Estado</th>
              <th className={thEl}></th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => {
              const vencida = i.status === "pendiente" && i.due_date && new Date(i.due_date) < new Date();
              const pdfHref = isInvoices ? `/api/facturas/${i.id}/pdf` : `/api/presupuestos/${i.id}/pdf`;
              return (
                <tr key={i.id} className={trEl}>
                  <td className={`${tdEl} whitespace-nowrap font-medium`}>{i.doc_number ?? "—"}</td>
                  <td className={tdEl}>{fecha(i.issue_date)}</td>
                  <td className={tdEl}>{i.contacts?.full_name}</td>
                  <td className={`${tdEl} hidden sm:table-cell`}>{i.concept ?? i.title}</td>
                  <td className={`${tdEl} whitespace-nowrap`}>{euro(i.amount)}</td>
                  <td className={tdEl}>
                    {i.status === "pagada" ? (
                      <Badge tone="green">Pagada</Badge>
                    ) : i.status === "aceptado" ? (
                      <Badge tone="green">Aceptado</Badge>
                    ) : i.status === "rechazado" ? (
                      <Badge tone="red">Rechazado</Badge>
                    ) : (
                      <Badge tone={vencida ? "red" : "amber"}>{vencida ? "Vencida" : "Pendiente"}</Badge>
                    )}
                  </td>
                  <td className={`${tdEl} flex flex-wrap items-center gap-2`}>
                    <a href={pdfHref} target="_blank" rel="noopener noreferrer" className={ghostLinkClass}>
                      PDF
                    </a>
                    {isInvoices && i.status === "pendiente" && (
                      <form action={markInvoicePaid.bind(null, i.id)} className="flex items-center gap-1">
                        <Select name="payment_method" required className="!py-1 !text-xs">
                          <option value="">Método</option>
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {PAYMENT_METHOD_LABEL[m]}
                            </option>
                          ))}
                        </Select>
                        <GhostButton>Cobrada</GhostButton>
                      </form>
                    )}
                    {tab.key === "presupuestos" && i.status === "pendiente" && (
                      <form action={convertQuote.bind(null, i.id, "proforma")}>
                        <GhostButton>→ Proforma</GhostButton>
                      </form>
                    )}
                    {!isInvoices && i.status !== "rechazado" && (
                      <form action={convertQuote.bind(null, i.id, "factura")}>
                        <GhostButton>→ Factura</GhostButton>
                      </form>
                    )}
                    {isInvoices ? (
                      <DeleteInvoiceButton
                        invoiceId={i.id}
                        invoiceLabel={`${i.doc_number ?? i.concept} · ${i.contacts?.full_name ?? ""}`}
                        deleteInvoice={deleteInvoice}
                      />
                    ) : (
                      <form action={deleteQuote.bind(null, i.id)}>
                        <GhostButton>Borrar</GhostButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className={`${tdEl} text-center text-slate`}>
                  Todavía no hay {tab.label.toLowerCase()}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
