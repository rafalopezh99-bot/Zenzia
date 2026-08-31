import { createClient } from "@/lib/supabase/server";

// Lógica compartida para meter un lead como contacto nuevo (etapa
// "nuevo_lead") en la cuenta de RL Digital Studios. La usan dos sitios:
// - lib/actions/landingContact.ts: el formulario de la propia landing de
//   Zenzia (zenzia.es), vía Server Action.
// - app/api/leads/route.ts: el formulario de rldigitalstudios.com, que es
//   un sitio estático aparte y solo puede llamar a una API pública.
// La política RLS que permite este insert sin sesión (solo insert, solo
// en esta empresa) vive en
// supabase/migrations/2026-08-31-landing-contact-form.sql.
const RL_DIGITAL_STUDIOS_COMPANY_ID = "5a279e59-d107-4341-80a2-f33bb5f71b24";

export type LeadOrigin = "landing_zenzia" | "rldigitalstudios";

export async function insertLead(input: {
  full_name: string;
  email: string;
  message?: string;
  origen: LeadOrigin;
}): Promise<{ ok: boolean; error: string | null }> {
  const full_name = input.full_name.trim();
  const email = input.email.trim();
  const message = (input.message ?? "").trim();

  if (!full_name || !email) {
    return { ok: false, error: "Necesitamos al menos el nombre y el email." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("contacts").insert({
    company_id: RL_DIGITAL_STUDIOS_COMPANY_ID,
    full_name,
    email,
    status: "active",
    custom_fields: {
      pipeline_stage: "nuevo_lead",
      origen: input.origen,
      ...(message ? { mensaje: message } : {}),
    },
  });

  if (error) {
    return { ok: false, error: "No se ha podido guardar el contacto. Inténtalo de nuevo." };
  }

  return { ok: true, error: null };
}
