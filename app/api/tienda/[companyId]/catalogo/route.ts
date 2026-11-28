import { NextResponse } from "next/server";
import { anonClient, CORS, UUID_RE } from "@/lib/shopPublic";

// Catálogo público de la tienda: productos visibles, tallas (solo si hay o no
// stock, nunca las unidades) y los ajustes que necesita la web.
export async function GET(_req: Request, props: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await props.params;
  if (!UUID_RE.test(companyId)) return NextResponse.json({ error: "No encontrado" }, { status: 404, headers: CORS });

  const supabase = anonClient();
  const { data, error } = await supabase.rpc("public_shop_catalog", { p_company: companyId });
  if (error) return NextResponse.json({ error: "No disponible" }, { status: 500, headers: CORS });
  if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404, headers: CORS });

  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/shop/`;
  const catalog = data as { products: { photo_path: string | null; photo?: string | null }[] };
  for (const p of catalog.products) p.photo = p.photo_path ? base + p.photo_path : null;

  return NextResponse.json(catalog, {
    headers: { ...CORS, "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120" },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
