"use client";

import { useTransition } from "react";

// "Anular" una factura ya registrada en VeriFactu: antes de nada se avisa de
// que no se borra, sino que se emite una factura rectificativa que la anula.
export default function AnnulInvoiceButton({
  invoiceId,
  invoiceLabel,
  annulInvoice,
}: {
  invoiceId: string;
  invoiceLabel: string;
  annulInvoice: (invoiceId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const ok = window.confirm(
          `¿Anular la factura ${invoiceLabel}?\n\n` +
            "Está registrada en VeriFactu (Hacienda), así que no se puede borrar. " +
            "Se emitirá una FACTURA RECTIFICATIVA (serie R) con los mismos importes en negativo, " +
            "que también se enviará a Hacienda, y la original quedará marcada como anulada.\n\n" +
            "Esta acción no se puede deshacer."
        );
        if (!ok) return;
        startTransition(async () => {
          await annulInvoice(invoiceId);
        });
      }}
      className="rounded-full border border-line px-3 py-1 text-xs font-medium text-slate transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
    >
      {isPending ? "Anulando…" : "Anular"}
    </button>
  );
}
