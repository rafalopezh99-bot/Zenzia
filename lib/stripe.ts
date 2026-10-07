import crypto from "crypto";
import type { PlanKey } from "@/lib/plans";

// Cliente mínimo de la API de Stripe con fetch (sin el SDK, para no añadir
// dependencias). Precios en variables de entorno: STRIPE_PRICE_<PLAN> (cuota
// mensual) y STRIPE_SETUP_<PLAN> (implantación, pago único; opcional).

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;

function encode(params: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(params).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) return [];
    if (typeof v === "object") return encode(v as Record<string, unknown>, key);
    return [`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`];
  });
}

export async function stripe(path: string, params?: Record<string, unknown>, method = "POST") {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params ? encode(params).join("&") : undefined,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? `Stripe HTTP ${res.status}`);
  return body;
}

export function priceFor(plan: PlanKey) {
  return {
    monthly: process.env[`STRIPE_PRICE_${plan.toUpperCase()}`] ?? null,
    setup: process.env[`STRIPE_SETUP_${plan.toUpperCase()}`] ?? null,
  };
}

export function planForPrice(priceId: string): PlanKey | null {
  for (const p of ["start", "smart", "pro"] as PlanKey[]) {
    if (process.env[`STRIPE_PRICE_${p.toUpperCase()}`] === priceId) return p;
  }
  return null;
}

// Verificación de la firma del webhook (cabecera Stripe-Signature).
export function verifyStripeSignature(payload: string, header: string | null, secret: string) {
  if (!header) return false;
  const t = header.split(",").find((p) => p.startsWith("t="))?.slice(2);
  if (!t) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const sigs = header
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));
  const fresh = Math.abs(Date.now() / 1000 - Number(t)) < 300;
  return fresh && sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
