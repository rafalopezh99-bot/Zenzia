import { createClient } from "@/lib/supabase/server";
import { createVehicle } from "@/lib/actions/assets";
import { Card, PageHeader, Input, Select, PrimaryButton, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";

export default async function VehiculosPage() {
  const supabase = createClient();
  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: vehicles } = await supabase
    .from("assets")
    .select("id, custom_fields, contacts(full_name)")
    .eq("type", "vehicle")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Vehículos" />

      <Card className="mb-6">
        <form action={createVehicle} className="flex flex-wrap items-end gap-2 text-sm">
          <Select name="contact_id" required>
            <option value="">Cliente</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Input name="plate" placeholder="Matrícula" required />
          <Input name="model" placeholder="Marca y modelo" />
          <PrimaryButton>Añadir vehículo</PrimaryButton>
        </form>
      </Card>

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Cliente</th>
              <th className={thEl}>Matrícula</th>
              <th className={thEl}>Modelo</th>
            </tr>
          </thead>
          <tbody>
            {(vehicles ?? []).map((v: any) => (
              <tr key={v.id} className={trEl}>
                <td className={tdEl}>{v.contacts?.full_name}</td>
                <td className={tdEl}>{v.custom_fields?.plate}</td>
                <td className={tdEl}>{v.custom_fields?.model}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
