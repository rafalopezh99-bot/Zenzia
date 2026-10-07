import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createSupplier, deleteSupplier } from "@/lib/actions/suppliers";
import {
  Card,
  PageHeader,
  Input,
  PrimaryButton,
  GhostButton,
  ghostLinkClass,
  tableWrap,
  tableEl,
  theadEl,
  thEl,
  tdEl,
  trEl,
} from "@/components/ui";

// Zona de proveedores: a quién le compras, para cualquier tipo de negocio
// (material, mercancía, servicios externos...). Mismo patrón que /bonos —
// formulario de alta siempre visible + tabla con lo que ya hay dado de
// alta — porque la ficha de un proveedor es siempre la misma, sin campos
// que cambien según el vertical.
export default async function ProveedoresPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name, contact_person, phone, email, category, created_at")
    .order("name");
  const suppliers = data ?? [];

  return (
    <div>
      <PageHeader moduleHeader title="Proveedores" />

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Nuevo proveedor</h2>
        <form action={createSupplier} className="flex flex-wrap items-end gap-2 text-sm">
          <Input name="name" placeholder="Nombre / empresa" required />
          <Input name="contact_person" placeholder="Persona de contacto" />
          <Input name="phone" placeholder="Teléfono" className="w-36" />
          <Input name="email" type="email" placeholder="Email" />
          <Input name="category" placeholder="Categoría (ej. material, logística)" />
          <PrimaryButton>Añadir proveedor</PrimaryButton>
        </form>
      </Card>

      <div className={tableWrap}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}>Nombre</th>
              <th className={thEl}>Contacto</th>
              <th className={thEl}>Teléfono</th>
              <th className={thEl}>Email</th>
              <th className={thEl}>Categoría</th>
              <th className={thEl}></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => {
              const removeSupplier = deleteSupplier.bind(null, s.id);
              return (
                <tr key={s.id} className={trEl}>
                  <td className={`${tdEl} font-medium text-ink`}>{s.name}</td>
                  <td className={tdEl}>{s.contact_person || "—"}</td>
                  <td className={tdEl}>{s.phone || "—"}</td>
                  <td className={tdEl}>{s.email || "—"}</td>
                  <td className={tdEl}>{s.category || "—"}</td>
                  <td className={tdEl}>
                    <div className="flex items-center gap-2">
                      <Link href={`/proveedores/${s.id}`} className={ghostLinkClass}>
                        Editar
                      </Link>
                      <form action={removeSupplier}>
                        <GhostButton>Borrar</GhostButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {suppliers.length === 0 && (
              <tr className={trEl}>
                <td className={tdEl} colSpan={6}>
                  Sin proveedores dados de alta todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
