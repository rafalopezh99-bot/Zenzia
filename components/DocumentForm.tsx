"use client";

import { useState } from "react";
import { Card, Input, Select, Textarea, PrimaryButton } from "@/components/ui";
import { computeTotals, IRPF_OPTIONS, VAT_OPTIONS, DOC_LABEL, type DocKind, type DocLine } from "@/lib/documents";

const euro = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

// Formulario de factura / presupuesto / proforma con varias líneas y los
// totales (base, IVA, IRPF) calculados en vivo. Las líneas viajan como JSON
// en un campo oculto a createDocument.
export default function DocumentForm({
  kind,
  contacts,
  action,
  defaultVat = 21,
  defaultIrpf = 0,
}: {
  kind: DocKind;
  contacts: { id: string; full_name: string }[];
  action: (formData: FormData) => void;
  // IVA / IRPF por defecto del negocio (Perfil).
  defaultVat?: number;
  defaultIrpf?: number;
}) {
  const [lines, setLines] = useState<DocLine[]>([{ concept: "", qty: 1, price: 0, vat: defaultVat }]);
  const [irpf, setIrpf] = useState(defaultIrpf);
  const t = computeTotals(lines, irpf);

  const update = (i: number, patch: Partial<DocLine>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select name="contact_id" required defaultValue="" className="w-full">
            <option value="" disabled>
              Cliente
            </option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Input name="issue_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full" />
        </div>
      </Card>

      <Card>
        <div className="mb-2 hidden grid-cols-[1fr_70px_100px_100px_32px] gap-2 text-xs font-semibold uppercase tracking-wide text-slate sm:grid">
          <span>Concepto</span>
          <span>Cant.</span>
          <span>Precio €</span>
          <span>IVA</span>
          <span />
        </div>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_70px_100px_100px_32px]">
              <Input
                placeholder="Concepto (ej. Sesión de nutrición)"
                value={l.concept}
                onChange={(e) => update(i, { concept: e.target.value })}
                required
                className="col-span-2 sm:col-span-1"
              />
              <Input type="number" min="0" step="1" value={l.qty} onChange={(e) => update(i, { qty: Number(e.target.value) })} />
              <Input type="number" min="0" step="0.01" value={l.price} onChange={(e) => update(i, { price: Number(e.target.value) })} />
              <Select value={l.vat} onChange={(e) => update(i, { vat: Number(e.target.value) })}>
                {VAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls))}
                className="text-slate hover:text-red-600"
                aria-label="Quitar línea"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLines((ls) => [...ls, { concept: "", qty: 1, price: 0, vat: ls[ls.length - 1]?.vat ?? 21 }])}
          className="mt-3 text-sm font-semibold text-brand hover:underline"
        >
          + Añadir línea
        </button>
      </Card>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-xs text-slate">
              Retención IRPF
              <Select name="irpf_rate" value={irpf} onChange={(e) => setIrpf(Number(e.target.value))} className="mt-1 w-full">
                {IRPF_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r === 0 ? "Sin retención" : `${r} %`}
                  </option>
                ))}
              </Select>
            </label>
            <Textarea name="notes" rows={3} placeholder="Notas (forma de pago, validez...)" className="w-full" />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate">
              <span>Base imponible</span>
              <span>{euro(t.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate">
              <span>IVA</span>
              <span>{euro(t.vatTotal)}</span>
            </div>
            {irpf > 0 && (
              <div className="flex justify-between text-slate">
                <span>Retención IRPF ({irpf} %)</span>
                <span>-{euro(t.irpfAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-lg font-bold text-ink">
              <span>Total</span>
              <span>{euro(t.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      <PrimaryButton>Crear {DOC_LABEL[kind].toLowerCase()}</PrimaryButton>
    </form>
  );
}
