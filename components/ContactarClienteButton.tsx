"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markProspectContacted } from "@/lib/actions/prospects";
import { buildContactEmail } from "@/lib/emailTemplate";
import { PrimaryButton } from "@/components/ui";

// Botón "Contactar" de la pestaña Clientes. No manda ningún email: genera
// el asunto y el mensaje a partir de los datos del cliente potencial para
// que Rafa los copie y los pegue en su propio correo.
export default function ContactarClienteButton({
  id,
  contactName,
  businessName,
  businessType,
  serviceOffer,
  alreadyContacted,
}: {
  id: string;
  contactName: string;
  businessName: string;
  businessType: string;
  serviceOffer: string;
  alreadyContacted: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const { subject, body } = buildContactEmail({
    contactName,
    businessName,
    businessType,
    serviceOffer,
  });

  function handleOpen() {
    setOpen(true);
    if (!alreadyContacted) {
      startTransition(async () => {
        await markProspectContacted(id);
        router.refresh();
      });
    }
  }

  async function copy(text: string, which: "subject" | "body") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // API de portapapeles bloqueada por el navegador — el texto sigue
      // visible en pantalla para copiarlo a mano con Ctrl/Cmd+C.
    }
  }

  if (!open) {
    return (
      <PrimaryButton onClick={handleOpen} className="px-3 py-1.5 text-xs">
        Contactar
      </PrimaryButton>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-2 rounded-xl border border-line bg-paper-deep p-3 text-xs sm:w-80">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-semibold text-ink">Asunto</span>
          <button type="button" onClick={() => copy(subject, "subject")} className="text-brand hover:underline">
            {copied === "subject" ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        <div className="rounded-lg border border-line bg-white p-2 text-slate">{subject}</div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-semibold text-ink">Mensaje</span>
          <button type="button" onClick={() => copy(body, "body")} className="text-brand hover:underline">
            {copied === "body" ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg border border-line bg-white p-2 font-sans text-slate">
          {body}
        </pre>
      </div>
      <button type="button" onClick={() => setOpen(false)} className="text-slate/70 hover:text-ink">
        Cerrar
      </button>
    </div>
  );
}
