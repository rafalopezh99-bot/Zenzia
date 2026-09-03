import { createClient } from "@/lib/supabase/server";
import { createInvoice, markInvoicePaid } from "@/lib/actions/invoices";
import { Card, PageHeader, Input, Select, PrimaryButton, GhostButton, Badge, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";

export default async function FacturacionPage() {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, concept, amount, status, due_date, contacts(full_name)")
    .order("created_at", { ascending: false });

  const total = (invoices ?? []).reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  const pendiente = (invoices ?? [])
    .filter((i: any) => i.status === "pendiente")
    .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  return (
    <div>
      <PageHeader title="Facturación" />

      <div className="mb-6 grid max-w-md grid-cols-2 gap-4">
        <Card>
          <div className="text-2xl font-semibold text-ink">{total.toFixed(2)} €</div>
          <div className="text-sm text-slate">Total facturado</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-amber-600">{pendiente.toFixed(2)} €</div>
          <div className="text-sm text-slate">Pendiente de cobro</div>
        </Card>
      </div>

      <Card className="mb-6">
        <form action={createInvoice} className="flex flex-wrap items-end gap-2 text-sm">
          <Select name="contact_id" required>
            <option value="">{terms.contact}</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Input name="concept" placeholder="Concepto" required />
          <Input name="amount" type="number" step="0.01" placeholder="Importe €" required className="w-32" />
          <PrimaryButton>Crear factura</PrimaryButton>
        </form>
      </Card>

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>{terms.contact}</th>
              <th className={thEl}>Concepto</th>
              <th className={thEl}>Importe</th>
              <th className={thEl}>Vence</th>
              <th className={thEl}>Estado</th>
              <th className={thEl}></th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((i: any) => {
              const pay = markInvoicePaid.bind(null, i.id);
              const vencida = i.status === "pendiente" && i.due_date && new Date(i.due_date) < new Date();
              return (
                <tr key={i.id} className={trEl}>
                  <td className={tdEl}>{i.contacts?.full_name}</td>
                  <td className={tdEl}>{i.concept}</td>
                  <td className={tdEl}>{Number(i.amount).toFixed(2)} €</td>
                  <td className={tdEl}>
                    {i.due_date ? new Date(i.due_date).toLocaleDateString("es-ES") : <span className="text-slate/50">—</span>}
                  </td>
                  <td className={tdEl}>
                    {i.status === "pagada" ? (
                      <Badge tone="green">Pagada</Badge>
                    ) : (
                      <Badge tone={vencida ? "red" : "amber"}>{vencida ? "Vencida" : "Pendiente"}</Badge>
                    )}
                  </td>
                  <td className={tdEl}>
                    {i.status === "pendiente" && (
                      <form action={pay}>
                        <GhostButton>Marcar pagada</GhostButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
