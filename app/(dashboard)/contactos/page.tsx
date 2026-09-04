import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PageHeader, primaryButtonClass, Badge, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { STAGE_LABEL, STAGE_TONE, getStage } from "@/lib/pipeline";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAgencyPipeline, showsAcademiaFields } from "@/lib/terminology";

const contactIconLinkClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-full border border-line transition hover:border-brand";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="#25D366" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24M8.53 6.9c-.16 0-.42.06-.64.31s-.85.83-.85 2.02.87 2.35.99 2.51c.12.16 1.7 2.63 4.19 3.63 2.07.83 2.49.67 2.94.63.45-.04 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.71-1.67-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47Z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="#EA4335" aria-hidden="true">
      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
    </svg>
  );
}

export default async function ContactosPage() {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  // El pipeline de ventas (etapa, tipo de negocio, enlace de demo) es una
  // herramienta de RL Digital Studios para captar clientes nuevos — no
  // tiene sentido para una empresa real gestionando sus propios contactos.
  const showPipeline = showsAgencyPipeline(vertical);
  const showAcademia = showsAcademiaFields(vertical);

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, status, custom_fields, contact_number, created_at, phone, email")
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
              <th className={thEl}>ID</th>
              <th className={thEl}>Nombre</th>
              <th className={thEl}>Contacto</th>
              {showAcademia && (
                <>
                  <th className={thEl}>Curso</th>
                  <th className={thEl}>Asignaturas</th>
                </>
              )}
              <th className={thEl}>Alta</th>
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
              const curso: string = c.custom_fields?.curso ?? "";
              const subjectList: string[] = c.custom_fields?.subjects ?? [];
              const whatsappDigits: string = (c.phone ?? "").replace(/[^\d]/g, "");
              return (
                <tr key={c.id} className={trEl}>
                  <td className={tdEl}>
                    <span className="text-slate/70">#{c.contact_number ?? "—"}</span>
                  </td>
                  <td className={tdEl}>
                    <Link href={`/contactos/${c.id}`} className="text-ink hover:text-brand">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className={tdEl}>
                    <div className="flex items-center gap-1.5">
                      {c.phone && (
                        <a
                          href={`https://wa.me/${whatsappDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          className={contactIconLinkClass}
                        >
                          <WhatsAppIcon />
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} title="Email" className={contactIconLinkClass}>
                          <EmailIcon />
                        </a>
                      )}
                      {!c.phone && !c.email && <span className="text-slate/50">—</span>}
                    </div>
                  </td>
                  {showAcademia && (
                    <>
                      <td className={tdEl}>{curso || <span className="text-slate/50">—</span>}</td>
                      <td className={tdEl}>
                        {subjectList.length ? subjectList.join(", ") : <span className="text-slate/50">—</span>}
                      </td>
                    </>
                  )}
                  <td className={tdEl}>
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })
                      : "—"}
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
