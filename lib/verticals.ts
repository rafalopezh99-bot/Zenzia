// Catálogo de tipos de negocio que se pueden elegir en el asistente de
// configuración inicial (onboarding). Cada vertical trae su propio pack de
// módulos por defecto (ver VERTICAL_PACKS en lib/modules.ts) — lo común y
// general para ese tipo de negocio ya viene activado, y el cliente puede
// ajustar módulos después desde el panel si le hace falta.

export interface VerticalDef {
  key: string;
  label: string;
  category: string;
}

export const VERTICAL_CATEGORIES = [
  "Salud y bienestar",
  "Estética y belleza",
  "Automoción",
  "Hogar y mantenimiento",
  "Negocios y servicios profesionales",
] as const;

export const VERTICAL_CATALOG: VerticalDef[] = [
  // Salud y bienestar
  { key: "fisio", label: "Fisioterapia", category: "Salud y bienestar" },
  { key: "osteopatia", label: "Osteopatía", category: "Salud y bienestar" },
  { key: "nutricion", label: "Nutrición", category: "Salud y bienestar" },
  { key: "psicologia", label: "Psicología / terapia", category: "Salud y bienestar" },
  { key: "podologia", label: "Podología", category: "Salud y bienestar" },
  { key: "entrenador_personal", label: "Entrenador personal", category: "Salud y bienestar" },
  { key: "dental", label: "Clínica dental", category: "Salud y bienestar" },
  { key: "veterinaria", label: "Veterinaria", category: "Salud y bienestar" },

  // Estética y belleza
  { key: "estetica", label: "Centro de estética", category: "Estética y belleza" },
  { key: "peluqueria", label: "Peluquería", category: "Estética y belleza" },
  { key: "barberia", label: "Barbería", category: "Estética y belleza" },
  { key: "manicura", label: "Manicura / uñas", category: "Estética y belleza" },
  { key: "tatuajes", label: "Tatuajes", category: "Estética y belleza" },
  { key: "spa", label: "Spa / masajes", category: "Estética y belleza" },

  // Automoción
  { key: "taller", label: "Taller mecánico", category: "Automoción" },

  // Hogar y mantenimiento
  { key: "reformas", label: "Empresa de reformas", category: "Hogar y mantenimiento" },
  { key: "parquet", label: "Suelos y parquet", category: "Hogar y mantenimiento" },
  { key: "pintura", label: "Pintores", category: "Hogar y mantenimiento" },
  { key: "electricista", label: "Electricista", category: "Hogar y mantenimiento" },
  { key: "fontaneria", label: "Fontanería", category: "Hogar y mantenimiento" },
  { key: "cerrajeria", label: "Cerrajería", category: "Hogar y mantenimiento" },
  { key: "jardineria", label: "Jardinería", category: "Hogar y mantenimiento" },
  { key: "limpieza", label: "Empresa de limpieza", category: "Hogar y mantenimiento" },

  // Negocios y servicios profesionales
  { key: "agencia", label: "Agencia de marketing / web", category: "Negocios y servicios profesionales" },
  { key: "asesoria", label: "Asesoría / consultoría", category: "Negocios y servicios profesionales" },
  { key: "fotografia", label: "Fotografía", category: "Negocios y servicios profesionales" },
  { key: "academia", label: "Academia / clases particulares", category: "Negocios y servicios profesionales" },
];
