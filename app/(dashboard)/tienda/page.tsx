import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { createProduct, saveShopSettings } from "@/lib/actions/shop";
import {
  Card,
  PageHeader,
  Input,
  Textarea,
  PrimaryButton,
  Badge,
  ghostLinkClass,
  secondaryLinkClass,
  tableWrap,
  tableEl,
  theadEl,
  thEl,
  tdEl,
  trEl,
} from "@/components/ui";

const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate";
const eur = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

// Tienda: catálogo con tallas y stock. Arriba, alta rápida de producto; en la
// tabla, stock total por producto con aviso de stock bajo. Los pedidos van
// en /tienda/pedidos.
export default async function TiendaPage() {
  const companyId = await getCurrentCompanyId();
  const supabase = await createClient();
  const [{ data: products }, { data: settings }, { count: pending }] = await Promise.all([
    supabase
      .from("shop_products")
      .select("id, name, category, price, sale_price, photo_path, active, is_new, shop_variants(size, stock)")
      .order("position")
      .order("created_at", { ascending: false }),
    supabase.from("shop_settings").select("*").eq("company_id", companyId).maybeSingle(),
    supabase.from("shop_orders").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
  ]);
  const threshold = settings?.low_stock_threshold ?? 1;
  const photoUrl = (p: string | null) => (p ? supabase.storage.from("shop").getPublicUrl(p).data.publicUrl : null);
  const list = products ?? [];

  return (
    <div>
      <PageHeader
        moduleHeader
        title="Tienda"
        action={
          <Link href="/tienda/pedidos" className={secondaryLinkClass}>
            Pedidos{pending ? ` · ${pending} pendiente${pending > 1 ? "s" : ""}` : ""}
          </Link>
        }
      />

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Nuevo producto</h2>
        <form action={createProduct} className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className={label}>Nombre</label>
            <Input name="name" placeholder="Ranita de punto azul" required />
          </div>
          <div>
            <label className={label}>Categoría</label>
            <Input name="category" placeholder="Bebé, Niña, Ceremonia…" />
          </div>
          <div>
            <label className={label}>Precio (€)</label>
            <Input name="price" inputMode="decimal" placeholder="34,90" required />
          </div>
          <div className="lg:col-span-2">
            <label className={label}>Tallas y unidades</label>
            <Input name="sizes" placeholder="3m:2, 6m:4, 9m:1" />
          </div>
          <div>
            <label className={label}>Foto</label>
            <Input name="photo" type="file" accept="image/*" />
          </div>
          <div className="flex items-end">
            <PrimaryButton>Añadir producto</PrimaryButton>
          </div>
        </form>
      </Card>

      <div className={`${tableWrap} mb-8`}>
        <table className={tableEl}>
          <thead className={theadEl}>
            <tr>
              <th className={thEl}></th>
              <th className={thEl}>Producto</th>
              <th className={thEl}>Precio</th>
              <th className={thEl}>Stock</th>
              <th className={thEl}>Estado</th>
              <th className={thEl}></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const variants = (p.shop_variants ?? []) as { size: string; stock: number }[];
              const total = variants.reduce((s, v) => s + v.stock, 0);
              const low = variants.filter((v) => v.stock <= threshold);
              const url = photoUrl(p.photo_path);
              return (
                <tr key={p.id} className={trEl}>
                  <td className={tdEl}>
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="h-14 w-11 rounded-lg object-cover" />
                    ) : (
                      <div className="h-14 w-11 rounded-lg bg-paper-deep" />
                    )}
                  </td>
                  <td className={tdEl}>
                    <div className="font-medium text-ink">{p.name}</div>
                    <div className="text-xs text-slate">{p.category || "Sin categoría"}</div>
                  </td>
                  <td className={tdEl}>
                    {p.sale_price != null ? (
                      <>
                        <span className="font-medium text-red-700">{eur(Number(p.sale_price))}</span>{" "}
                        <s className="text-xs text-slate">{eur(Number(p.price))}</s>
                      </>
                    ) : (
                      eur(Number(p.price))
                    )}
                  </td>
                  <td className={tdEl}>
                    <div>{total} uds.</div>
                    {variants.length === 0 && <div className="text-xs text-amber-700">Sin tallas</div>}
                    {low.length > 0 && (
                      <div className="text-xs text-amber-700">Quedan pocas: {low.map((v) => `${v.size} (${v.stock})`).join(", ")}</div>
                    )}
                  </td>
                  <td className={tdEl}>
                    <div className="flex flex-wrap gap-1">
                      {p.active ? <Badge tone="green">Visible</Badge> : <Badge>Oculto</Badge>}
                      {p.is_new && <Badge tone="violet">Novedad</Badge>}
                    </div>
                  </td>
                  <td className={tdEl}>
                    <Link href={`/tienda/${p.id}`} className={ghostLinkClass}>
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr className={trEl}>
                <td className={tdEl} colSpan={6}>
                  Todavía no hay productos. Añade el primero arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Ajustes de la tienda</h2>
        <form action={saveShopSettings} className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <label className={label}>WhatsApp que recibe los pedidos</label>
            <Input name="whatsapp" defaultValue={settings?.whatsapp ?? ""} placeholder="34600000000" />
          </div>
          <div>
            <label className={label}>Número para el Bizum</label>
            <Input name="bizum_phone" defaultValue={settings?.bizum_phone ?? ""} placeholder="600 000 000" />
          </div>
          <div>
            <label className={label}>Puntos de recogida (uno por línea)</label>
            <Textarea
              name="pickup_points"
              rows={3}
              defaultValue={((settings?.pickup_points as string[] | null) ?? []).join("\n")}
              placeholder={"Almería · C/ Concepción Arenal, 8\nSevilla · C.C. Carrefour Camas"}
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className={label}>Texto de envíos</label>
              <Input name="shipping_note" defaultValue={settings?.shipping_note ?? ""} placeholder="Envíos 24/48 h" />
            </div>
            <div>
              <label className={label}>Avisar de stock bajo con</label>
              <Input name="low_stock_threshold" type="number" min={0} defaultValue={threshold} className="w-24" /> uds. o menos
            </div>
          </div>
          <div className="sm:col-span-2">
            <PrimaryButton>Guardar ajustes</PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
