"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";

// Catálogo de servicios (Perfil > Servicios): nombre, duración, precio e IVA.
// Se usan al crear citas (duración y precio) y al facturarlas con un clic.
export async function createService(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("El servicio necesita un nombre");
  const { error } = await supabase.from("services").insert({
    company_id: await getCurrentCompanyId(),
    name,
    duration_min: Number(formData.get("duration_min")) || 60,
    price: Number(formData.get("price")) || 0,
    vat: Number(formData.get("vat") ?? 21),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/perfil");
  redirect("/perfil?tab=servicios&ok=1");
}

// Los servicios no se borran (hay citas que los usan): se archivan.
export async function archiveService(serviceId: string) {
  const supabase = await createClient();
  await supabase.from("services").update({ active: false }).eq("id", serviceId);
  revalidatePath("/perfil");
}
