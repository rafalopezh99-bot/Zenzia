import { createClient } from "@/lib/supabase/server";
import { createPackage, usePackageSession } from "@/lib/actions/packages";
import { createBonoType, deleteBonoType } from "@/lib/actions/bonoTypes";
import { Card, PageHeader, Input, Select, PrimaryButton, GhostButton, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAcademiaFields } from "@/lib/terminology";

export default async function BonosPage() {
  const supabase = createClient();
  const { companyId, vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const showAcademia = showsAcademiaFields(vertical);
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: packages } = await supabase
    .from("packages")
    .select("id, name, total_sessions, used_sessions, contacts(full_name)")
    .order("created_at", { ascending: false });

  let bonoTypes: { id: string; nivel: string; name: string; unit: string; sessions: number; price_eur: number }[] = [];
  if (showAcademia) {
    const { data } = await supabase
      .from("bono_types")
      .select("id, nivel, name, unit, sessions, price_eur")
      .eq("company_id", companyId)
      .order("nivel")
      .order("sessions");
    bonoTypes = data ?? [];
  }

  return (
    <div>
      <PageHeader title="Bonos / paquetes de sesiones" />

      {showAcademia && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Tarifario (tipos de bono)</h2>
          <p className="mb-3 text-sm text-slate/70">
            Estos son los que se pueden elegir al dar de alta un {terms.contact.toLowerCase()}.
          </p>
          <form action={createBonoType} className="mb-4 flex flex-wrap items-end gap-2 text-sm">
            <Input name="nivel" placeholder="Nivel (ej. ESO)" required className="w-32" />
            <Input name="name" placeholder="Nombre (ej. Bono 4 horas)" required />
            <Select name="unit" defaultValue="horas" className="w-28">
              <option value="horas">Horas</option>
              <option value="clases">Clases</option>
            </Select>
            <Input name="sessions" type="number" min="1" placeholder="Cantidad" required className="w-24" />
            <Input name="price_eur" type="number" min="0" step="0.01" placeholder="Precio €" required className="w-24" />
            <PrimaryButton>Añadir tarifa</PrimaryButton>
          </form>
          <div className={tableWrap}>
            <table className={tableEl}>
              <thead className={theadEl}>
                <tr>
                  <th className={thEl}>Nivel</th>
                  <th className={thEl}>Nombre</th>
                  <th className={thEl}>Cantidad</th>
                  <th className={thEl}>Precio</th>
                  <th className={thEl}></th>
                </tr>
              </thead>
              <tbody>
                {bonoTypes.map((b) => {
                  const removeBonoType = deleteBonoType.bind(null, b.id);
                  return (
                    <tr key={b.id} className={trEl}>
                      <td className={tdEl}>{b.nivel}</td>
                      <td className={tdEl}>{b.name}</td>
                      <td className={tdEl}>
                        {b.sessions} {b.unit}
                      </td>
                      <td className={tdEl}>{b.price_eur} €</td>
                      <td className={tdEl}>
                        <form action={removeBonoType}>
                          <GhostButton>Borrar</GhostButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {bonoTypes.length === 0 && (
                  <tr className={trEl}>
                    <td className={tdEl} colSpan={5}>
                      Sin tarifas dadas de alta todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
