import { createClient } from "@/lib/supabase/server";
import { createQuote, advanceQuoteStatus, rejectQuote } from "@/lib/actions/quotes";
import { Card, PageHeader, Input, Select, PrimaryButton, GhostButton, Badge, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  completado: "Completado",
};

const STATUS_TONE: Record<string, "amber" | "violet" | "red" | "green"> = {
  pendiente: "amber",
  aprobado: "violet",
  rechazado: "red",
  completado: "green",
};

const NEXT_LABEL: Record<string, string> = {
  pendiente: "Aprobar",
  aprobado: "Marcar completado",
};

export default async function PresupuestosPage() {
  const supabase = createClient();
  // Independientes entre sí: se piden a la vez en vez de una detrás de otra.
  const [{ data: contacts }, { data: quotes }] = await Promise.all([
    supabase.from("contacts").select("id, full_name").order("full_name"),
    supabase
      .from("quotes")
      .select("id, title, amount, status, contacts(full_name)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader title="Presupuestos / órdenes de trabajo" />

      <Card className="mb-6">
        <form action={createQuote} className="flex flex-wrap items-end gap-2 text-sm">
          <Select name="contact_id" required>
            <option value="">Cliente</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Input name="title" placeholder="Título (ej. Cambio de embrague)" required />
          <Input name="amount" type="number" step="0.01" placeholder="Importe €" required className="w-32" />
          <PrimaryButton>Crear presupuesto</PrimaryButton>
        </form>
      </Card>

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Cliente</th>
              <th className={thEl}>Título</th>
              <th className={thEl}>Importe</th>
              <th className={thEl}>Estado</th>
              <th className={thEl}></th>
            </tr>
          </thead>
          <tbody>
            {(quotes ?? []).map((q: any) => {
              const advance = advanceQuoteStatus.bind(null, q.id, q.status);
              const reject = rejectQuote.bind(null, q.id);
              const nextLabel = NEXT_LABEL[q.status];
              const canReject = q.status === "pendiente";
              return (
                <tr key={q.id} className={trEl}>
                  <td className={tdEl}>{q.contacts?.full_name}</td>
                  <td className={tdEl}>{q.title}</td>
                  <td className={tdEl}>{Number(q.amount).toFixed(2)} €</td>
                  <td className={tdEl}>
                    <Badge tone={STATUS_TONE[q.status]}>{STATUS_LABEL[q.status]}</Badge>
                  </td>
                  <td className={`${tdEl} flex gap-2`}>
                    {nextLabel && (
                      <form action={advance}>
                        <GhostButton>{nextLabel}</GhostButton>
                      </form>
                    )}
                    {canReject && (
                      <form action={reject}>
                        <GhostButton>Rechazar</GhostButton>
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
