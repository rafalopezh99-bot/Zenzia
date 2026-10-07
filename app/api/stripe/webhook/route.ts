import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForPrice, verifyStripeSignature } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Webhook de Stripe: mantiene companies.plan y subscription_status al día.
// Eventos: customer.subscription.created / updated / deleted.
export async function POST(req: Request) {
  const payload = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return new NextResponse("Firma no válida", { status: 400 });
  }

  const event = JSON.parse(payload);
  if (!event.type?.startsWith("customer.subscription.")) return NextResponse.json({ received: true });

  const sub = event.data.object;
  const companyId = sub.metadata?.company_id;
  if (!companyId) return NextResponse.json({ received: true });

  const plan = planForPrice(sub.items?.data?.[0]?.price?.id ?? "");
  const deleted = event.type === "customer.subscription.deleted";
  const update: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    subscription_status: deleted ? "canceled" : sub.status,
  };
  if (plan && !deleted) update.plan = plan;

  await createAdminClient().from("companies").update(update).eq("id", companyId);
  return NextResponse.json({ received: true });
}
