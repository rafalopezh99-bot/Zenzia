"use client";

import { useTransition } from "react";

// Botón de "eliminar" del listado de facturas. Mismo patrón que
// DeleteContactButton: confirmación antes de nada y useTransition para que
// no se pueda disparar dos veces con un doble clic.
export default function DeleteInvoiceButton({
  invoiceId,
  invoiceLabel,
  deleteInvoice,
}: {
  invoiceId: string;
  invoiceLabel: string;
  deleteInvoice: (invoiceId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      title="Eliminar factura"
      onClick={() => {
        if (!window.confirm(`¿Eliminar la factura "${invoiceLabel}"? No se puede deshacer.`)) return;
        startTransition(async () => {
          await deleteInvoice(invoiceId);
        });
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-line text-slate transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
        <path
          d="M2.5 4h11M6 4V2.5A.5.5 0 0 1 6.5 2h3a.5.5 0 0 1 .5.5V4M6.5 7.25v4M9.5 7.25v4M3.5 4l.5 8.5a1 1 0 0 0 1 .95h6a1 1 0 0 0 1-.95L12.5 4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
