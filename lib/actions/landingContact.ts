"use server";

import { insertLead } from "@/lib/leads";

// Formulario de contacto de la landing de Zenzia (zenzia.es). La lógica de
// inserción real vive en lib/leads.ts, compartida con app/api/leads/route.ts
// (el mismo camino que usa el formulario de rldigitalstudios.com).
export async function submitLandingContact(
  formData: FormData
): Promise<{ ok: boolean; error: string | null }> {
  // Honeypot anti-spam: campo oculto que un visitante real nunca rellena
  // (solo lo ven los bots que auto-rellenan formularios). Si viene
  // relleno, fingimos éxito y no hacemos nada.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { ok: true, error: null };
  }

  return insertLead({
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
    origen: "landing_zenzia",
  });
}
