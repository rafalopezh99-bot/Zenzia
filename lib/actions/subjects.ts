"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";

// Lista de asignaturas de la empresa (vertical academia): alimenta las
// casillas del formulario de alta de alumno. Se guarda como catálogo propio
// (no texto libre por alumno) para que "Física" no acabe escrito de varias
// formas distintas entre alumnos.
export async function createSubject(formData: FormData) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { error } = await supabase.from("subjects").insert({ company_id: companyId, name });
  // 23505 = ya existe una asignatura con ese nombre en esta empresa (índice
  // único company_id+name): no es un error real, simplemente no se duplica.
  if (error && error.code !== "23505") throw new Error(error.message);

  revalidatePath("/contactos/nuevo");
}
