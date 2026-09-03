import { createClient } from "@/lib/supabase/server";
import { createPackage, usePackageSession } from "@/lib/actions/packages";
import { Card, PageHeader, Input, Select, PrimaryButton, GhostButton, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";

export default async function BonosPage() {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: packages } = await supabase
    .from("packages")
    .select("id, name, total_sessions, used_sessions, contacts(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Bonos / paquetes de sesiones" />

      <Card className="mb-6">
        <form action={createPackage} className="flex flex-wrap items-end gap-2 text-sm">
          <Select name="contact_id" required>
            <option value="">{terms.contact}</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Input name="name" placeholder="Nombre del bono (ej. Bono 10 sesiones)" required />
          <Input name="total_sessions" type="number" placeholder="Nº sesiones" required className="w-28" />
          <PrimaryButton>Crear bono</PrimaryButton>
        </form>
      </Card>

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>{terms.contact}</th>
              <th className={thEl}>Bono</th>
              <th className={thEl}>Uso</th>
              <th className={thEl}></th>
            </tr>
          </thead>
          <tbody>
            {(packages ?? []).map((p: any) => {
              const useSession = usePackageSession.bind(null, p.id, p.used_sessions);
              const agotado = p.used_sessions >= p.total_sessions;
              return (
                <tr key={p.id} className={trEl}>
                  <td className={tdEl}>{p.contacts?.full_name}</td>
                  <td className={tdEl}>{p.name}</td>
                  <td className={tdEl}>
                    {p.used_sessions} / {p.total_sessions}
                  </td>
                  <td className={tdEl}>
                    <form action={useSession}>
                      <GhostButton disabled={agotado}>Usar sesión</GhostButton>
                    </form>
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
