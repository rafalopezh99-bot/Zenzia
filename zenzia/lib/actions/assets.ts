"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createVehicle(formData: FormData) {
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const plate = String(formData.get("plate") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();

  if (!contact_id || !plate) throw new Error("Cliente y matrícula son obligatorios");

  const { error } = await supabase.from("assets").insert({
    contact_id,
    type: "vehicle",
    custom_fields: { plate, model },
  });
  if (error) throw new Error(error.message);

  revalidatePath("/vehiculos");
  redirect("/vehiculos");
}
