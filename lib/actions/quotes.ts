"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createQuote(formData: FormData) {
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);

  if (!contact_id || !title) throw new Error("Cliente y título son obligatorios");

  const { error } = await supabase.from("quotes").insert({ contact_id, title, amount });
  if (error) throw new Error(error.message);

  revalidatePath("/presupuestos");
  redirect("/presupuestos");
}

const NEXT_STATUS: Record<string, string> = {
  pendiente: "aprobado",
  aprobado: "completado",
};

export async function advanceQuoteStatus(quoteId: string, currentStatus: string) {
  const next = NEXT_STATUS[currentStatus];
  if (!next) return;

  const supabase = createClient();
  const { error } = await supabase.from("quotes").update({ status: next }).eq("id", quoteId);
  if (error) throw new Error(error.message);
  revalidatePath("/presupuestos");
}

export async function rejectQuote(quoteId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("quotes").update({ status: "rechazado" }).eq("id", quoteId);
  if (error) throw new Error(error.message);
  revalidatePath("/presupuestos");
}
