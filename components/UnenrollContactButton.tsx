"use client";

import { useTransition } from "react";

// "Dar de baja" (vertical academia): para las clases recurrentes de un
// alumno y le quita del calendario las que ya estaban puestas a futuro,
// pero el alumno sigue en la lista — a diferencia de DeleteContactButton,
// esto no lo archiva. Mismo patrón de confirmación + useTransition.
export default function UnenrollContactButton({
  contactId,
  contactName,
  unenrollContact,
}: {
  contactId: string;
  contactName: string;
  unenrollContact: (contactId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      title="Dar de baja"
      onClick={() => {
        if (
          !window.confirm(
            `¿Dar de baja a ${contactName}? Se le quitan del calendario sus clases futuras (las ya dadas se quedan como estaban). Sigue apareciendo en la lista.`
          )
        )
          return;
        startTransition(async () => {
          await unenrollContact(contactId);
        });
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-line text-slate transition hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
        <path
          d="M3 13v-1a4 4 0 0 1 4-4h1M13 8v3M13 8l-2 2M13 8l2 2M7.5 6.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
