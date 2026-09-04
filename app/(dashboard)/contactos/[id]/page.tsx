import { createClient } from "@/lib/supabase/server";
import { addActivity, updateContactStage, updateContactLink, updateContactBusinessType } from "@/lib/actions/contacts";
import { notFound } from "next/navigation";
import { Card, PageHeader, Input, Select, PrimaryButton, GhostButton } from "@/components/ui";
import { PIPELINE_STAGES, STAGE_LABEL, getStage } from "@/lib/pipeline";
import { getCurrentCompanyProfile } from "@/lib/company";
import { showsAgencyPipeline, showsAcademiaFields } from "@/lib/terminology";

export default async function ContactoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const showPipeline = showsAgencyPipeline(vertical);
  const showAcademia = showsAcademiaFields(vertical);

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
  const updateBusinessTypeForContact = updateContactBusinessType.bind(null, params.id);
  const currentStage = getStage(contact.custom_fields);
  const demoUrl: string = contact.custom_fields?.demo_url ?? "";
  const businessType: string = contact.custom_fields?.business_type ?? "";
  const curso: string = contact.custom_fields?.curso ?? "";
  const subjectList: string[] = contact.custom_fields?.subjects ?? [];
  // wa.me solo admite dígitos: se limpian espacios/guiones/+ del teléfono
  // tal cual esté guardado.
  const whatsappDigits = (contact.phone ?? "").replace(/[^\d]/g, "");

  return (
    <div className="max-w-2xl">
      <PageHeader title={`#${contact.contact_number ?? "—"} · ${contact.full_name}`} />
      <div className="-mt-6 mb-6 text-sm text-slate">
        <p>
          {showPipeline && businessType && <span className="text-ink">{businessType}</span>}
          {showPipeline && businessType && (contact.phone || contact.email) && " · "}
          {contact.phone && (
            <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              {contact.phone}
            </a>
          )}
          {contact.phone && contact.email && " · "}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-brand hover:underline">
              {contact.email}
            </a>
          )}
          {" · "}
          <span className="text-slate/70">
            Alta: {new Date(contact.created_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}
          </span>
          {showPipeline && demoUrl && (
            <>
              {" · "}
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                Ver demo →
              </a>
            </>
          )}
        </p>
        {showAcademia && (curso || subjectList.length > 0) && (
          <p>
            {curso && <span className="text-ink">{curso}</span>}
            {curso && subjectList.length > 0 && " · "}
            {subjectList.join(", ")}
          </p>
        )}
      </div>

      {showPipeline && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Etapa del cliente</h2>
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
      )}

      {showPipeline && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Tipo de negocio</h2>
          <form action={updateBusinessTypeForContact} className="flex flex-wrap items-center gap-2">
            <Input
              name="business_type"
              placeholder="Ej: centro de estética"
              defaultValue={businessType}
              className="flex-1"
            />
            <GhostButton>Guardar</GhostButton>
          </form>
        </Card>
      )}

      {showPipeline && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Enlace de la demo</h2>
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
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">
          Notas / resumen de conversaciones
        </h2>
        <form action={addActivityForContact} className="mb-4 flex gap-2">
          <Input name="content" placeholder="Ej: hablado por WhatsApp, interesado en el plan de 250€..." className="flex-1" />
          <PrimaryButton>Añadir</PrimaryButton>
        </form>

        <ul className="space-y-2 text-sm">
          {(activities ?? []).map((a) => (
            <li key={a.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
              <span className="text-slate/70">{new Date(a.created_at).toLocaleString("es-ES")}</span> —{" "}
              <span className="text-ink">{a.content}</span>
            </li>
          ))}
          {(activities ?? []).length === 0 && <li className="text-slate/70">Sin notas todavía.</li>}
        </ul>
      </Card>
    </div>
  );
}
