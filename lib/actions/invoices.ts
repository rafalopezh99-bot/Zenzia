"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInvoice(formData: FormData) {
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const concept = String(formData.get("concept") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);

  if (!contact_id || !concept || !amount) throw new Error("Cliente, concepto e importe son obligatorios");

  const { error } = await supabase.from("invoices").insert({ contact_id, concept, amount });
  if (error) throw new Error(error.message);

  revalidatePath("/facturacion");
  redirect("/facturacion");
}

export async function markInvoicePaid(invoiceId: string, formData: FormData) {
  const supabase = createClient();
  const payment_method = String(formData.get("payment_method") ?? "");
  if (!payment_method) throw new Error("Indica el método de pago");

  const { error } = await supabase
    .from("invoices")
    .update({ status: "pagada", payment_method, paid_at: new Date().toISOString() })
    .eq("id", invoiceId);
  if (error) throw new Error(error.message);
  revalidatePath("/facturacion");
  revalidatePath("/pagos");
  revalidatePath("/dashboard");
}
