"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { revalidatePath } from "next/cache";

// Convierte una notificación (lead del formulario, DM de Instagram/TikTok)
// en un contacto real, ya en la etapa "contactado" del pipeline — porque
// en el momento en que pulsas este botón, ya lo has contactado. La
// notificación queda marcada como "contactada" y enlazada al contacto
// nuevo, así no se pierde de dónde vino.
export async function convertNotificationToContact(notificationId: string) {
  const companyId = await getCurrentCompanyId();
  const supabase = createClient();

  const { data: notification, error: fetchError } = await supabase
    .from("notifications")
    .select("full_name, email, phone, handle, message, source")
    .eq("id", notificationId)
    .single();
  if (fetchError || !notification) throw new Error(fetchError?.message ?? "Notificación no encontrada");

  const { data: contact, error: insertError } = await supabase
    .from("contacts")
    .insert({
      company_id: companyId,
      full_name: notification.full_name || notification.handle || "Sin nombre",
      email: notification.email,
      phone: notification.phone,
      status: "active",
      custom_fields: {
        pipeline_stage: "contactado",
        origen: notification.source,
        ...(notification.handle ? { handle: notification.handle } : {}),
        ...(notification.message ? { mensaje: notification.message } : {}),
      },
    })
    .select("id")
    .single();
  if (insertError || !contact) throw new Error(insertError?.message ?? "No se pudo crear el contacto");

  const { error: updateError } = await supabase
    .from("notifications")
    .update({ status: "contactada", contact_id: contact.id })
    .eq("id", notificationId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/notificaciones");
  revalidatePath("/contactos");
}

export async function dismissNotification(notificationId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").update({ status: "descartada" }).eq("id", notificationId);
  if (error) throw new Error(error.message);

  revalidatePath("/notificaciones");
}
