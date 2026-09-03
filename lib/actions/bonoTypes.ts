"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";

// Tarifario de la empresa (vertical academia): nivel + nombre + cantidad
// (horas o clases, a elegir) + precio + periodo de cobro (semanal o
// mensual). Es lo que aparece para elegir en "Bono" al dar de alta un
// alumno (ver lib/actions/contacts.ts) y en el desplegable de /bonos. No
// lleva alumno: eso se asocia después, al dar de alta o desde la ficha del
// alumno. El periodo determina cada cuánto se refactura en
// generate_recurring_invoices() (ver migración de facturación recurrente).
export async function createBonoType(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const nivel = String(formData.get("nivel") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const periodo = String(formData.get("periodo") ?? "").trim();
  const sessions = Number(formData.get("sessions") ?? 0);
  const price_eur = Number(formData.get("price_eur") ?? 0);

  if (!nivel || !name || !sessions || !price_eur) throw new Error("Faltan datos de la tarifa");
  if (unit !== "horas" && unit !== "clases") throw new Error("La unidad debe ser horas o clases");
  if (periodo !== "semanal" && periodo !== "mensual") throw new Error("El periodo debe ser semanal o mensual");

  const { error } = await supabase.from("bono_types").insert({
    company_id: companyId,
    nivel,
    name,
    unit,
    periodo,
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
