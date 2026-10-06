import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSupplier, deleteSupplier } from "@/lib/actions/suppliers";
import { Card, PageHeader, Input, Textarea, PrimaryButton, GhostButton } from "@/components/ui";

export default async function ProveedorPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", params.id).single();
  if (!supplier) notFound();

  const saveSupplier = updateSupplier.bind(null, supplier.id);
  const removeSupplier = deleteSupplier.bind(null, supplier.id);

  return (
    <div>
      <PageHeader eyebrow="Proveedor" title={supplier.name} />

      <Card className="max-w-xl">
        <form action={saveSupplier} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Nombre / empresa</label>
            <Input name="name" defaultValue={supplier.name} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Persona de contacto</label>
            <Input name="contact_person" defaultValue={supplier.contact_person ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Teléfono</label>
              <Input name="phone" defaultValue={supplier.phone ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Email</label>
              <Input name="email" type="email" defaultValue={supplier.email ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">CIF / NIF</label>
              <Input name="tax_id" defaultValue={supplier.tax_id ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Categoría</label>
              <Input name="category" defaultValue={supplier.category ?? ""} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Notas</label>
            <Textarea name="notes" rows={4} defaultValue={supplier.notes ?? ""} />
          </div>
          <div className="pt-2">
            <PrimaryButton>Guardar cambios</PrimaryButton>
          </div>
        </form>
        <form action={removeSupplier} className="mt-4 border-t border-line pt-4">
          <GhostButton>Borrar proveedor</GhostButton>
        </form>
      </Card>
    </div>
  );
}
