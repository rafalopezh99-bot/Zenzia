"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyProfile } from "@/lib/company";
import { stripe, priceFor } from "@/lib/stripe";
import type { PlanKey } from "@/lib/plans";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function customerId(companyId: string, name: string) {
  const supabase = createClient();
  const { data } = await supabase.from("companies").select("stripe_customer_id, email").eq("id", companyId).single();
  if (data?.stripe_customer_id) return data.stripe_customer_id as string;
  const customer = await stripe("customers", { name, email: data?.email ?? undefined, metadata: { company_id: companyId } });
  await supabase.from("companies").update({ stripe_customer_id: customer.id }).eq("id", companyId);
  return customer.id as string;
}

// Contratar o cambiar de plan. Con suscripción activa se cambia el precio
// (Stripe prorratea); si no, se abre Stripe Checkout (cuota + implantación).
export async function choosePlan(plan: PlanKey) {
  const { companyId, companyName } = await getCurrentCompanyProfile();
  const supabase = createClient();
  const { data: co } = await supabase
    .from("companies")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", companyId)
    .single();
  const price = priceFor(plan);
  if (!price.monthly) throw new Error(`Falta STRIPE_PRICE_${plan.toUpperCase()}`);

  if (co?.stripe_subscription_id && ["active", "trialing", "past_due"].includes(co.subscription_status ?? "")) {
    const sub = await stripe(`subscriptions/${co.stripe_subscription_id}`, undefined, "GET");
    await stripe(`subscriptions/${co.stripe_subscription_id}`, {
      items: { 0: { id: sub.items.data[0].id, price: price.monthly } },
      proration_behavior: "create_prorations",
      ...(price.setup ? { add_invoice_items: { 0: { price: price.setup } } } : {}),
    });
    redirect("/planes?ok=1");
  }

  const session = await stripe("checkout/sessions", {
    mode: "subscription",
    customer: await customerId(companyId, companyName),
    client_reference_id: companyId,
    line_items: {
      0: { price: price.monthly, quantity: 1 },
      ...(price.setup ? { 1: { price: price.setup, quantity: 1 } } : {}),
    },
    subscription_data: { metadata: { company_id: companyId } },
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/planes?ok=1`,
    cancel_url: `${SITE_URL}/planes`,
  });
  redirect(session.url);
}

// Portal de Stripe: tarjeta, facturas de Zenzia y cancelación.
export async function openBillingPortal() {
  const { companyId, companyName } = await getCurrentCompanyProfile();
  const portal = await stripe("billing_portal/sessions", {
    customer: await customerId(companyId, companyName),
    return_url: `${SITE_URL}/planes`,
  });
  redirect(portal.url);
}
