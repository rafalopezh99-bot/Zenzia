import { NextResponse } from "next/server";
import { anonClient, CORS, UUID_RE } from "@/lib/shopPublic";

// Crea un pedido "pendiente" desde la web de la tienda. Los precios y el
// stock se comprueban en la base de datos (public_shop_create_order); aquí
// solo se valida la forma y se recorta lo que llega.
export async function POST(req: Request, props: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await props.params;
  if (!UUID_RE.test(companyId)) return NextResponse.json({ error: "No encontrado" }, { status: 404, headers: CORS });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido no válido" }, { status: 400, headers: CORS });
  }
  const s = (k: string, max: number) => String(body[k] ?? "").trim().slice(0, max);
  const items = Array.isArray(body.items) ? body.items : [];
  const clean = items
    .slice(0, 50)
    .map((i) => i as { variant_id?: unknown; qty?: unknown })
    .filter((i) => typeof i.variant_id === "string" && UUID_RE.test(i.variant_id))
    .map((i) => ({ variant_id: i.variant_id as string, qty: Math.max(1, Math.min(20, Number(i.qty) || 1)) }));
  if (!clean.length) return NextResponse.json({ error: "El carrito está vacío" }, { status: 400, headers: CORS });

  const order = {
    name: s("name", 120),
    phone: s("phone", 40),
    delivery: s("delivery", 160) || "envio",
    address: s("address", 200),
    city: s("city", 120),
    postal_code: s("postal_code", 20),
    items: clean,
  };
  if (!order.name || !order.phone) {
    return NextResponse.json({ error: "Faltan nombre o teléfono" }, { status: 400, headers: CORS });
  }

  const { data, error } = await anonClient().rpc("public_shop_create_order", { p_company: companyId, p_order: order });
  if (error) return NextResponse.json({ error: error.message }, { status: 409, headers: CORS });
  return NextResponse.json(data, { headers: CORS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
