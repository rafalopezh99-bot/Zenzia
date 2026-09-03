import { createClient } from "@/lib/supabase/server";

// Lógica compartida para meter un lead en la bandeja de Notificaciones
// (ya NO se crea un contacto directamente — eso solo pasa cuando le das a
// "Contactar" desde /notificaciones, ver lib/actions/notifications.ts).
// La usan dos sitios:
// - lib/actions/landingContact.ts: el formulario de la propia landing de
//   Zenzia (zenzia.es), vía Server Action.
// - app/api/leads/route.ts: el formulario de rldigitalstudios.com, que es
//   un sitio estático aparte y solo puede llamar a una API pública.
// La política RLS que permite este insert sin sesión (solo insert, solo
// en esta empresa) vive en supabase/migrations/2026-08-31-notifications.sql.
const RL_DIGITAL_STUDIOS_COMPANY_ID = "5a279e59-d107-4341-80a2-f33bb5f71b24";

export type LeadOrigin = "landing_zenzia" | "rldigitalstudios";

export async function insertLead(input: {
  full_name: string;
  email: string;
  message?: string;
  origen: LeadOrigin;
}): Promise<{ ok: boolean; error: string | null }> {
  const full_name = input.full_name.trim().slice(0, 200);
  const email = input.email.trim().slice(0, 200);
  const message = (input.message ?? "").trim().slice(0, 5000);

  if (!full_name || !email) {
    return { ok: false, error: "Necesitamos al menos el nombre y el email." };
  }

  // Validación básica de formato — no es infalible (ni falta que le hace),
  // solo descarta valores claramente inválidos antes de guardarlos.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "El email no parece válido." };
  }

  const origenLabel = input.origen === "rldigitalstudios" ? "rldigitalstudios.com" : "zenzia.es";

  const supabase = createClient();
  const { error } = await supabase.from("notifications").insert({
    company_id: RL_DIGITAL_STUDIOS_COMPANY_ID,
    source: "formulario_web",
    full_name,
    email,
    message: [message, `Origen: ${origenLabel}`].filter(Boolean).join(" · "),
  });

  if (error) {
    return { ok: false, error: "No se ha podido guardar el mensaje. Inténtalo de nuevo." };
  }

  return { ok: true, error: null };
}
