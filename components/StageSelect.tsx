"use client";

import { useState, useTransition } from "react";
import { PIPELINE_STAGES, STAGE_LABEL, type PipelineStage } from "@/lib/pipeline";

// Desplegable de etapa que se guarda solo al cambiarlo, sin botón ni
// formulario — para el listado de contactos, donde Rafa quería poder mover
// la etapa de un lead sin tener que entrar en su ficha. `updateStage` es la
// server action (updateContactStageInline) pasada como prop desde la página.
export default function StageSelect({
  contactId,
  stage,
  updateStage,
}: {
  contactId: string;
  stage: PipelineStage;
  updateStage: (contactId: string, stage: string) => Promise<void>;
}) {
  const [value, setValue] = useState<string>(stage);
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        startTransition(async () => {
          await updateStage(contactId, next);
        });
      }}
      className="rounded-full border border-line bg-paper-deep px-2 py-1 text-xs font-medium text-ink focus:border-brand focus:outline-none disabled:opacity-50"
    >
      {PIPELINE_STAGES.map((s) => (
        <option key={s} value={s}>
          {STAGE_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
