import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PageHeader, primaryButtonClass, Badge, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { STAGE_LABEL, STAGE_TONE, getStage } from "@/lib/pipeline";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAgencyPipeline } from "@/lib/terminology";

export default async function ContactosPage() {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  // El pipeline de ventas (etapa, tipo de negocio, enlace de demo) es una
  // herramienta de RL Digital Studios para captar clientes nuevos — no
  // tiene sentido para una empresa real gestionando sus propios contactos.
  const showPipeline = showsAgencyPipeline(vertical);

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, status, custom_fields")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title={terms.contacts}
        action={
          <Link href="/contactos/nuevo" className={primaryButtonClass}>
            {terms.newContact}
          </Link>
        }
      />

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Nombre</th>
              {showPipeline && (
                <>
                  <th className={thEl}>Tipo de negocio</th>
                  <th className={thEl}>Etapa</th>
                  <th className={thEl}>Demo</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {(contacts ?? []).map((c: any) => {
              const stage = getStage(c.custom_fields);
              const demoUrl: string = c.custom_fields?.demo_url ?? "";
              return (
                <tr key={c.id} className={trEl}>
                  <td className={tdEl}>
                    <Link href={`/contactos/${c.id}`} className="text-ink hover:text-brand">
                      {c.full_name}
                    </Link>
                  </td>
                  {showPipeline && (
                    <>
                      <td className={tdEl}>
                        {c.custom_fields?.business_type || <span className="text-slate/50">—</span>}
                      </td>
                      <td className={tdEl}>
                        <Badge tone={STAGE_TONE[stage]}>{STAGE_LABEL[stage]}</Badge>
                      </td>
                      <td className={tdEl}>
                        {demoUrl ? (
                          <a
                            href={demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand hover:underline"
                          >
                            Ver demo →
                          </a>
                        ) : (
                          <span className="text-slate/50">—</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
