"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function uploadPhoto(formData: FormData) {
  const supabase = createClient();

  const contact_id = String(formData.get("contact_id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const file = formData.get("file") as File | null;

  if (!contact_id || !kind || !file || file.size === 0) {
    throw new Error("Cliente, tipo (antes/después) y una foto son obligatorios");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${contact_id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("photos").upload(path, file);
  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("photos").insert({
    contact_id,
    kind,
    storage_path: path,
  });
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/fotos");
  redirect("/fotos");
}
