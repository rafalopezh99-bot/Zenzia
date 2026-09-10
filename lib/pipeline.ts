// Pipeline de ventas genérico, guardado en contacts.custom_fields.pipeline_stage
// (sin migración: custom_fields ya existe para esto). Útil sobre todo para
// el vertical "agencia" (RL Digital Studios vendiendo webs/CRM), pero
// disponible para cualquier contacto si se quiere usar.

export const PIPELINE_STAGES = [
  "nuevo_lead",
  "contactado",
  "propuesta_enviada",
  "negociacion",
  "ganado",
  "perdido",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  nuevo_lead: "Nuevo lead",
  contactado: "Contactado",
  propuesta_enviada: "Propuesta enviada",
  negociacion: "En negociación",
  ganado: "Cliente",
  perdido: "Perdido",
};

export const STAGE_TONE: Record<PipelineStage, "neutral" | "amber" | "violet" | "green" | "red"> = {
  nuevo_lead: "neutral",
  contactado: "amber",
  propuesta_enviada: "violet",
  negociacion: "violet",
  ganado: "green",
  perdido: "red",
};

function isPipelineStage(value: unknown): value is PipelineStage {
  return typeof value === "string" && (PIPELINE_STAGES as readonly string[]).includes(value);
}

export function getStage(customFields: Record<string, unknown> | null | undefined): PipelineStage {
  const value = customFields?.pipeline_stage;
  return isPipelineStage(value) ? value : "nuevo_lead";
}

// Cómo llegó el lead (para saber qué canal está funcionando mejor). Igual
// que el pipeline, se guarda en contacts.custom_fields.contacted_via —
// lista cerrada en el formulario para no acabar con mil variantes del
// mismo canal escritas a mano.
export const CONTACT_CHANNELS = ["gmail", "instagram", "facebook", "presencial", "otro"] as const;

export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const CHANNEL_LABEL: Record<ContactChannel, string> = {
  gmail: "Gmail",
  instagram: "Instagram",
  facebook: "Facebook",
  presencial: "Presencial",
  otro: "Otro",
};
