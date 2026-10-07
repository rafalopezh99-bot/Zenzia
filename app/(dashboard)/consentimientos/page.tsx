import { createClient } from "@/lib/supabase/server";
import { createConsent, markConsentSigned } from "@/lib/actions/consents";
import { Card, PageHeader, Input, Select, PrimaryButton, GhostButton, Badge, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";

export default async function ConsentimientosPage() {
  const supabase = await createClient();
  // Independientes entre sí: se piden a la vez en vez de una detrás de otra.
  const [{ data: contacts }, { data: consents }] = await Promise.all([
    supabase.from("contacts").select("id, full_name").order("full_name"),
    supabase
      .from("consents")
      .select("id, title, signed, signed_at, sign_token, contacts(full_name, phone)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader moduleHeader title="Consentimientos" />

      <Card className="mb-6">
        <form action={createConsent} className="flex flex-wrap items-end gap-2 text-sm">
          <Select name="contact_id" required>
            <option value="">Cliente</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Input name="title" placeholder="Documento (ej. Consentimiento tratamiento)" required />
          <textarea
            name="body"
            rows={3}
            placeholder="Texto que firmará el paciente (opcional)"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
          />
          <PrimaryButton>Añadir documento</PrimaryButton>
        </form>
      </Card>

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Cliente</th>
              <th className={thEl}>Documento</th>
              <th className={thEl}>Estado</th>
              <th className={thEl}></th>
            </tr>
          </thead>
          <tbody>
            {(consents ?? []).map((c: any) => {
              const sign = markConsentSigned.bind(null, c.id);
              return (
                <tr key={c.id} className={trEl}>
                  <td className={tdEl}>{c.contacts?.full_name}</td>
                  <td className={tdEl}>{c.title}</td>
                  <td className={tdEl}>
                    <Badge tone={c.signed ? "green" : "amber"}>
                      {c.signed ? `Firmado (${new Date(c.signed_at).toLocaleDateString()})` : "Pendiente de firma"}
                    </Badge>
                  </td>
                  <td className={tdEl}>
                    {!c.signed && (
                      <a
                        href={`https://wa.me/${(c.contacts?.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Por favor, firma este documento: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.zenzia.es"}/consentimiento/${c.sign_token}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-2 text-xs font-semibold text-brand hover:underline"
                      >
                        Enviar para firmar
                      </a>
                    )}
                    {!c.signed && (
                      <form action={sign}>
                        <GhostButton>Marcar firmado</GhostButton>
                      </form>
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
