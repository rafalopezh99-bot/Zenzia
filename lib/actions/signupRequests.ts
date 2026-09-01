"use server";

import { createClient } from "@/lib/supabase/server";
import { ZENZIA_ADMIN_COMPANY_ID } from "@/lib/company";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Formulario público de "/registro": cualquiera puede rellenarlo sin sesión.
// Esto NO crea ninguna cuenta ni empresa — solo guarda la solicitud como
// "pendiente" para que se revise a mano desde /solicitudes.
export async function createSignupRequest(formData: FormData) {
  const manager_name = String(formData.get("manager_name") ?? "").trim();
  const business_name = String(formData.get("business_name") ?? "").trim();
  const service_offered = String(formData.get("service_offered") ?? "").trim();
  const plan = String(formData.get("plan") ?? "");
  const usage_type = String(formData.get("usage_type") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const vertical = String(formData.get("vertical") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!manager_name || !business_name || !service_offered || !email || !phone) {
    throw new Error("Faltan campos obligatorios");
  }
  if (plan !== "mensual" && plan !== "anual") {
    throw new Error("Plan no válido");
  }
  if (usage_type !== "negocio" && usage_type !== "personal") {
    throw new Error("Tipo de uso no válido");
  }

  const supabase = createClient();
  const { error } = await supabase.from("signup_requests").insert({
    manager_name,
    business_name,
    service_offered,
    plan,
    usage_type,
    email,
    phone,
    vertical: vertical || null,
    message: message || null,
  });
  if (error) throw new Error(error.message);

  redirect("/registro/enviado");
}

// Aprobar/denegar una solicitud desde /solicitudes. Solo cambia el estado —
// no crea ninguna cuenta; eso lo sigue haciendo Rafa a mano en Supabase,
// igual que con cada cliente hasta ahora.
export async function reviewSignupRequest(requestId: string, status: "aprobada" | "denegada") {
  const supabase = createClient();

  const { error } = await supabase
    .from("signup_requests")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw new Error(error.message);

  revalidatePath("/solicitudes");
}
