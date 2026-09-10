import { createContact } from "@/lib/actions/contacts";
import { createSubject } from "@/lib/actions/subjects";
import { Card, PageHeader, Input, Select, PrimaryButton } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAgencyPipeline, showsAcademiaFields } from "@/lib/terminology";
import { createClient } from "@/lib/supabase/server";
import { CURSOS } from "@/lib/academia";
import { PIPELINE_STAGES, STAGE_LABEL, CONTACT_CHANNELS, CHANNEL_LABEL } from "@/lib/pipeline";
import { BILLING_FREQUENCIES, BILLING_FREQUENCY_LABEL } from "@/lib/billing";

export default async function NuevoContactoPage() {
  const { companyId, vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const showPipeline = showsAgencyPipeline(vertical);
  const showAcademia = showsAcademiaFields(vertical);

  let bonoGroups: Record<string, { id: string; name: string; price_eur: number }[]> = {};
  let subjects: { id: string; name: string }[] = [];

  if (showAcademia) {
    const supabase = createClient();
    const [{ data: bonoTypes }, { data: subjectRows }] = await Promise.all([
      supabase
        .from("bono_types")
        .select("id, nivel, name, price_eur")
        .eq("company_id", companyId)
        .order("nivel")
        .order("sessions"),
      supabase.from("subjects").select("id, name").eq("company_id", companyId).order("name"),
    ]);

    bonoGroups = (bonoTypes ?? []).reduce<typeof bonoGroups>((acc, b) => {
      (acc[b.nivel] ??= []).push({ id: b.id, name: b.name, price_eur: b.price_eur });
      return acc;
    }, {});
    subjects = subjectRows ?? [];
  }

  return (
    <div>
      <PageHeader title={terms.newContact} />
      <Card className="max-w-sm">
        <form action={createContact} className="space-y-3">
          <Input name="full_name" placeholder="Nombre completo" required className="w-full" />
          {showPipeline && (
            <Input name="business_type" placeholder="Tipo de negocio (ej. centro de estética)" className="w-full" />
          )}
          {showPipeline && (
            <Input name="instagram_handle" placeholder="Instagram (usuario, sin @)" className="w-full" />
          )}
          <Input name="phone" placeholder="Teléfono (opcional)" className="w-full" />
          <Input name="email" type="email" placeholder="Email (opcional)" className="w-full" />
          {showPipeline && (
            <Input name="demo_url" type="url" placeholder="Enlace de la demo (opcional)" className="w-full" />
          )}
          {showPipeline && (
            <Select name="contacted_via" defaultValue="" className="w-full">
              <option value="" disabled>
                Contactado a través de
              </option>
              {CONTACT_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </Select>
          )}
          {showPipeline && (
            <Select name="stage" defaultValue="nuevo_lead" className="w-full">
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </Select>
          )}

          {showAcademia && (
            <>
              <Select name="curso" defaultValue="" className="w-full">
                <option value="" disabled>
                  Curso
                </option>
                {CURSOS.map((g) => (
                  <optgroup key={g.nivel} label={g.nivel}>
                    {g.opciones.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>

              <Select name="bono_type_id" defaultValue="" className="w-full">
                <option value="">Sin bono (se puede añadir después)</option>
                {Object.entries(bonoGroups).map(([nivel, items]) => (
                  <optgroup key={nivel} label={nivel}>
                    {items.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {b.price_eur} €
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate">
                  Asignaturas (máximo 7)
                </div>
                {subjects.length === 0 && (
                  <p className="text-sm text-slate/70">Todavía no hay asignaturas dadas de alta.</p>
                )}
                <div className="space-y-1">
                  {subjects.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm text-ink">
                      <input type="checkbox" name="subjects" value={s.name} className="rounded border-line" />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate">Datos de facturación</div>
          <Input name="tax_id" placeholder="DNI / CIF" className="w-full" />
          <Input name="billing_address" placeholder="Dirección" className="w-full" />
          <div className="flex gap-2">
            <Input name="postal_code" placeholder="Código postal" className="w-24" />
            <Input name="province" placeholder="Provincia" className="flex-1" />
          </div>
          <Input name="country" placeholder="País" defaultValue="España" className="w-full" />
          <Select name="billing_frequency" defaultValue="" className="w-full">
            <option value="">Facturación (opcional)</option>
            {BILLING_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {BILLING_FREQUENCY_LABEL[f]}
              </option>
            ))}
          </Select>

          <PrimaryButton>Guardar</PrimaryButton>
        </form>
      </Card>

      {showAcademia && (
        <Card className="mt-6 max-w-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Añadir asignatura nueva</h2>
          <form action={createSubject} className="flex gap-2">
            <Input name="name" placeholder="Ej. Biología" required className="w-full" />
            <PrimaryButton>Añadir</PrimaryButton>
          </form>
        </Card>
      )}
    </div>
  );
}
