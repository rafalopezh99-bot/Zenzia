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

export async function markInvoicePaid(invoiceId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("invoices").update({ status: "pagada" }).eq("id", invoiceId);
  if (error) throw new Error(error.message);
  revalidatePath("/facturacion");
}
