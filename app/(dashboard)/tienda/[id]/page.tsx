import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariantStock,
  deleteVariant,
} from "@/lib/actions/shop";
import { Card, PageHeader, Input, Textarea, PrimaryButton, GhostButton, ghostLinkClass } from "@/components/ui";

const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate";

export default async function ProductoPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("shop_products")
    .select("*, shop_variants(id, size, stock, position)")
    .eq("id", id)
    .single();
  if (!p) notFound();

  const variants = ((p.shop_variants ?? []) as { id: string; size: string; stock: number; position: number }[]).sort(
    (a, b) => a.position - b.position || a.size.localeCompare(b.size),
  );
  const photo = p.photo_path ? supabase.storage.from("shop").getPublicUrl(p.photo_path).data.publicUrl : null;
  const save = updateProduct.bind(null, p.id);
  const remove = deleteProduct.bind(null, p.id);
  const add = addVariant.bind(null, p.id);

  return (
    <div>
      <PageHeader title={p.name} action={<Link href="/tienda" className={ghostLinkClass}>← Volver a la tienda</Link>} />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <form action={save} className="space-y-4 text-sm">
            <div className="flex gap-4">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-36 w-28 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="grid h-36 w-28 shrink-0 place-items-center rounded-xl bg-paper-deep text-xs text-slate">Sin foto</div>
              )}
              <div className="flex-1">
                <label className={label}>Cambiar foto</label>
                <Input name="photo" type="file" accept="image/*" />
              </div>
            </div>
            <div>
              <label className={label}>Nombre</label>
              <Input name="name" defaultValue={p.name} required />
            </div>
            <div>
              <label className={label}>Descripción</label>
              <Textarea name="description" rows={3} defaultValue={p.description ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Categoría</label>
                <Input name="category" defaultValue={p.category ?? ""} />
              </div>
              <div>
                <label className={label}>Orden en el catálogo</label>
                <Input name="position" type="number" defaultValue={p.position ?? 0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Precio (€)</label>
                <Input name="price" inputMode="decimal" defaultValue={String(p.price).replace(".", ",")} required />
              </div>
              <div>
                <label className={label}>Precio rebajado (€)</label>
                <Input
                  name="sale_price"
                  inputMode="decimal"
                  placeholder="Vacío = sin oferta"
                  defaultValue={p.sale_price != null ? String(p.sale_price).replace(".", ",") : ""}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="active" defaultChecked={p.active} /> Visible en la web
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_new" defaultChecked={p.is_new} /> Marcar como novedad
              </label>
            </div>
            <PrimaryButton>Guardar cambios</PrimaryButton>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Tallas y stock</h2>
            <div className="space-y-2 text-sm">
              {variants.map((v) => {
                const setStock = updateVariantStock.bind(null, v.id, p.id);
                const delVariant = deleteVariant.bind(null, v.id, p.id);
                return (
                  <div key={v.id} className="flex items-center gap-2">
                    <span className="w-16 font-medium text-ink">{v.size}</span>
                    <form action={setStock} className="flex items-center gap-2">
                      <Input name="stock" type="number" min={0} defaultValue={v.stock} className="w-20" />
                      <GhostButton>Guardar</GhostButton>
                    </form>
                    <form action={delVariant}>
                      <GhostButton>Quitar</GhostButton>
                    </form>
                    {v.stock === 0 && <span className="text-xs text-red-700">Agotada</span>}
                  </div>
                );
              })}
              {variants.length === 0 && <p className="text-slate">Añade al menos una talla para poder venderlo.</p>}
            </div>
            <form action={add} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4 text-sm">
              <div>
                <label className={label}>Talla</label>
                <Input name="size" placeholder="6m" className="w-24" required />
              </div>
              <div>
                <label className={label}>Unidades</label>
                <Input name="stock" type="number" min={0} defaultValue={1} className="w-20" />
              </div>
              <input type="hidden" name="position" value={variants.length} />
              <PrimaryButton>Añadir talla</PrimaryButton>
            </form>
          </Card>

          <Card>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate">Eliminar producto</h2>
            <p className="mb-3 text-sm text-slate">Si solo quieres quitarlo de la web un tiempo, desmarca «Visible en la web».</p>
            <form action={remove}>
              <GhostButton>Eliminar definitivamente</GhostButton>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
