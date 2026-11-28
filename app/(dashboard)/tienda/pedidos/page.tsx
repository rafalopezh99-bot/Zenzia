import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { setOrderStatus } from "@/lib/actions/shop";
import { Card, PageHeader, Badge, GhostButton, ghostLinkClass } from "@/components/ui";

const eur = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
const TONE = { pendiente: "amber", pagado: "green", enviado: "violet", cancelado: "red" } as const;
const NEXT: Record<string, { to: string; label: string }[]> = {
  pendiente: [
    { to: "pagado", label: "Marcar pagado" },
    { to: "cancelado", label: "Cancelar" },
  ],
  pagado: [
    { to: "enviado", label: "Marcar enviado" },
    { to: "cancelado", label: "Cancelar" },
  ],
  enviado: [],
  cancelado: [],
};

type Order = {
  id: string;
  number: number;
  status: keyof typeof TONE;
  customer_name: string;
  customer_phone: string;
  delivery: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  total: number;
  created_at: string;
  shop_order_items: { name: string; size: string; qty: number; unit_price: number }[];
};

// Pedidos de la tienda. Al marcar "pagado" (al recibir el Bizum) se descuenta
// el stock automáticamente; si se cancela un pedido ya pagado, se devuelve.
export default async function PedidosPage(props: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await props.searchParams;
  const supabase = await createClient();
  let q = supabase
    .from("shop_orders")
    .select("*, shop_order_items(name, size, qty, unit_price)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (estado && estado in TONE) q = q.eq("status", estado);
  const { data } = await q;
  const orders = (data ?? []) as Order[];

  const filters = ["", "pendiente", "pagado", "enviado", "cancelado"];

  return (
    <div>
      <PageHeader title="Pedidos" action={<Link href="/tienda" className={ghostLinkClass}>← Productos</Link>} />

      <div className="mb-5 flex flex-wrap gap-2 text-sm">
        {filters.map((f) => (
          <Link
            key={f || "todos"}
            href={f ? `/tienda/pedidos?estado=${f}` : "/tienda/pedidos"}
            className={`rounded-full border px-3 py-1 ${(estado ?? "") === f ? "border-ink bg-ink text-white" : "border-line"}`}
          >
            {f ? f[0].toUpperCase() + f.slice(1) : "Todos"}
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {orders.map((o) => (
          <Card key={o.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-ink">#{o.number}</span>
                  <Badge tone={TONE[o.status]}>{o.status}</Badge>
                </div>
                <div className="text-xs text-slate">
                  {new Date(o.created_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-ink">{eur(Number(o.total))}</div>
              </div>
            </div>

            <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
              <ul className="space-y-1">
                {o.shop_order_items.map((i, k) => (
                  <li key={k}>
                    {i.qty}× {i.name} <span className="text-slate">· talla {i.size}</span> — {eur(Number(i.unit_price) * i.qty)}
                  </li>
                ))}
              </ul>
              <div className="text-slate">
                <div className="font-medium text-ink">{o.customer_name}</div>
                <a className="underline" href={`https://wa.me/${o.customer_phone.replace(/[^0-9]/g, "").replace(/^(?=[6-9]\d{8}$)/, "34")}`} target="_blank" rel="noopener">
                  {o.customer_phone}
                </a>
                <div>
                  {o.delivery === "envio"
                    ? `Envío: ${[o.address, o.postal_code, o.city].filter(Boolean).join(", ")}`
                    : `Recogida: ${o.delivery}`}
                </div>
              </div>
            </div>

            {NEXT[o.status].length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                {NEXT[o.status].map((n) => (
                  <form key={n.to} action={setOrderStatus.bind(null, o.id, n.to)}>
                    <GhostButton>{n.label}</GhostButton>
                  </form>
                ))}
              </div>
            )}
          </Card>
        ))}
        {orders.length === 0 && <Card>No hay pedidos{estado ? ` ${estado}s` : ""} todavía.</Card>}
      </div>
    </div>
  );
}
