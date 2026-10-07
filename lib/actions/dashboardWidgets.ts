"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";

// Guarda qué widgets quiere ver la empresa en /dashboard. Se manda la lista
// completa de keys marcadas (no un toggle individual) porque el editor en
// el cliente ya trae todas las casillas a la vez en un único formulario.
export async function saveDashboardWidgets(enabledKeys: string[]) {
  const companyId = await getCurrentCompanyId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({ dashboard_widgets: enabledKeys })
    .eq("id", companyId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}
