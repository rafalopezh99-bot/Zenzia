"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Módulo Tienda: productos con tallas/stock, ajustes y pedidos.
// La web pública los lee/crea vía app/api/tienda/* (funciones public_shop_*).

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const money = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

// Sube la foto al bucket "shop" dentro de la carpeta de la empresa.
async function uploadProductPhoto(companyId: string, file: File | null) {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("La foto debe ser una imagen");
  if (file.size > 8 * 1024 * 1024) throw new Error("La foto no puede pasar de 8 MB");
  const supabase = await createClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${companyId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("shop").upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

// "S:3, M:5, L:0" o "0m:2\n3m:4" → [{size, stock}]
function parseSizes(raw: string) {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => {
      const [size, stock] = s.split(":").map((x) => x.trim());
      return { size: size.slice(0, 30), stock: Math.max(0, parseInt(stock ?? "0", 10) || 0), position: i };
    })
    .filter((v) => v.size);
}

export async function saveShopSettings(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = await createClient();
  const pickup = str(formData, "pickup_points")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
  const { error } = await supabase.from("shop_settings").upsert({
    company_id: companyId,
    whatsapp: str(formData, "whatsapp").replace(/[^0-9]/g, "") || null,
    bizum_phone: str(formData, "bizum_phone") || null,
    pickup_points: pickup,
    shipping_note: str(formData, "shipping_note") || null,
    low_stock_threshold: Math.max(0, parseInt(str(formData, "low_stock_threshold") || "1", 10) || 0),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tienda");
}

export async function createProduct(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = await createClient();
  const name = str(formData, "name");
  const price = money(str(formData, "price"));
  if (!name || price === null) throw new Error("Nombre y precio son obligatorios");

  const photo_path = await uploadProductPhoto(companyId, formData.get("photo") as File | null);
  const { data, error } = await supabase
    .from("shop_products")
    .insert({
      company_id: companyId,
      name,
      category: str(formData, "category") || null,
      price,
      photo_path,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const sizes = parseSizes(str(formData, "sizes"));
  if (sizes.length) {
    const { error: vErr } = await supabase
      .from("shop_variants")
      .insert(sizes.map((v) => ({ ...v, company_id: companyId, product_id: data.id })));
    if (vErr) throw new Error(vErr.message);
  }
  revalidatePath("/tienda");
  redirect(`/tienda/${data.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = await createClient();
  const name = str(formData, "name");
  const price = money(str(formData, "price"));
  if (!name || price === null) throw new Error("Nombre y precio son obligatorios");
  const saleRaw = str(formData, "sale_price");

  const patch: Record<string, unknown> = {
    name,
    description: str(formData, "description") || null,
    category: str(formData, "category") || null,
    price,
    sale_price: saleRaw ? money(saleRaw) : null,
    is_new: formData.get("is_new") === "on",
    active: formData.get("active") === "on",
    position: parseInt(str(formData, "position") || "0", 10) || 0,
  };
  const photo = await uploadProductPhoto(companyId, formData.get("photo") as File | null);
  if (photo) patch.photo_path = photo;

  const { error } = await supabase.from("shop_products").update(patch).eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/tienda");
  revalidatePath(`/tienda/${productId}`);
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shop_products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/tienda");
  redirect("/tienda");
}

export async function addVariant(productId: string, formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = await createClient();
  const size = str(formData, "size").slice(0, 30);
  if (!size) throw new Error("Indica la talla");
  const { error } = await supabase.from("shop_variants").insert({
    company_id: companyId,
    product_id: productId,
    size,
    stock: Math.max(0, parseInt(str(formData, "stock") || "0", 10) || 0),
    position: parseInt(str(formData, "position") || "0", 10) || 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/tienda/${productId}`);
}

export async function updateVariantStock(variantId: string, productId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shop_variants")
    .update({ stock: Math.max(0, parseInt(str(formData, "stock") || "0", 10) || 0) })
    .eq("id", variantId);
  if (error) throw new Error(error.message);
  revalidatePath(`/tienda/${productId}`);
  revalidatePath("/tienda");
}

export async function deleteVariant(variantId: string, productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shop_variants").delete().eq("id", variantId);
  if (error) throw new Error(error.message);
  revalidatePath(`/tienda/${productId}`);
}

const STATUSES = ["pendiente", "pagado", "enviado", "cancelado"] as const;

export async function setOrderStatus(orderId: string, status: string) {
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) throw new Error("Estado no válido");
  const supabase = await createClient();
  const { error } = await supabase.from("shop_orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);
  revalidatePath("/tienda/pedidos");
  revalidatePath("/tienda");
}
