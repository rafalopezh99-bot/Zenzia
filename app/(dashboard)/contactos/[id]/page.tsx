import { createClient } from "@/lib/supabase/server";
import { addActivity, updateContactStage, updateContactLink } from "@/lib/actions/contacts";
import { notFound } from "next/navigation";
import { Card, PageHeader, Input, Select, PrimaryButton, GhostButton } from "@/components/ui";
import { PIPELINE_STAGES, STAGE_LABEL, getStage } from "@/lib/pipeline";

export default async function ContactoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: contact } = await supabase.from("contacts").select("*").eq("id", params.id).single();
  if (!contact) notFound();

  const { data: activities } = await supabase
    .from("activities")
    .select("id, type, content, created_at")
    .eq("contact_id", params.id)
    .order("created_at", { ascending: false });

  const addActivityForContact = addActivity.bind(null, params.id);
  const updateStageForContact = updateContactStage.bind(null, params.id);
  const updateLinkForContact = updateContactLink.bind(null, params.id);
  const currentStage = getStage(contact.custom_fields);
  const demoUrl: string = contact.custom_fields?.demo_url ?? "";

  return (
    <div className="max-w-2xl">
      <PageHeader title={contact.full_name} />
      <p className="-mt-6 mb-6 text-sm text-neutral-400">
        {contact.phone} {contact.phone && contact.email && "·"} {contact.email}
        {demoUrl && (
          <>
            {" · "}
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline"
            >
              Ver demo →
            </a>
          </>
        )}
      </p>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Etapa del cliente</h2>
        <form action={updateStageForContact} className="flex flex-wrap items-center gap-2">
          <Select name="stage" defaultValue={currentStage}>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </Select>
          <GhostButton>Actualizar etapa</GhostButton>
        </form>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Enlace de la demo</h2>
        <form action={updateLinkForContact} className="flex flex-wrap items-center gap-2">
          <Input
            name="demo_url"
            type="url"
            placeholder="https://cliente-demo.netlify.app"
            defaultValue={demoUrl}
            className="flex-1"
          />
          <GhostButton>Guardar enlace</GhostButton>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Notas / resumen de conversaciones
        </h2>
        <form action={addActivityForContact} className="mb-4 flex gap-2">
          <Input name="content" placeholder="Ej: hablado por WhatsApp, interesado en el plan de 250€..." className="flex-1" />
          <PrimaryButton>Añadir</PrimaryButton>
        </form>

        <ul className="space-y-2 text-sm">
          {(activities ?? []).map((a) => (
            <li key={a.id} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-neutral-500">{new Date(a.created_at).toLocaleString("es-ES")}</span> —{" "}
              <span className="text-neutral-200">{a.content}</span>
            </li>
          ))}
          {(activities ?? []).length === 0 && <li className="text-neutral-500">Sin notas todavía.</li>}
        </ul>
      </Card>
    </div>
  );
}
