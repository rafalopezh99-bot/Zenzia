import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PageHeader, primaryButtonClass, Badge, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { STAGE_LABEL, STAGE_TONE, getStage } from "@/lib/pipeline";

export default async function ContactosPage() {
  const supabase = createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, status, custom_fields")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Contactos"
        action={
          <Link href="/contactos/nuevo" className={primaryButtonClass}>
            Nuevo contacto
          </Link>
        }
      />

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Nombre</th>
              <th className={thEl}>Tipo de negocio</th>
              <th className={thEl}>Etapa</th>
              <th className={thEl}>Demo</th>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
