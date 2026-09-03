"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";

// Tarifario de la empresa (vertical academia): nivel + nombre + horas +
// precio. Es lo que aparece para elegir en "Bono" al dar de alta un alumno
// (ver lib/actions/contacts.ts) y en el desplegable de /bonos.
export async function createBonoType(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const nivel = String(formData.get("nivel") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const sessions = Number(formData.get("sessions") ?? 0);
  const price_eur = Number(formData.get("price_eur") ?? 0);

  if (!nivel || !name || !sessions || !price_eur) throw new Error("Faltan datos de la tarifa");

  const { error } = await supabase.from("bono_types").insert({
    company_id: companyId,
    nivel,
    name,
    sessions,
    price_eur,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/bonos");
  revalidatePath("/contactos/nuevo");
}

export async function deleteBonoType(bonoTypeId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("bono_types").delete().eq("id", bonoTypeId);
  if (error) throw new Error(error.message);

  revalidatePath("/bonos");
  revalidatePath("/contactos/nuevo");
}
