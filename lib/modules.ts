// Catálogo de módulos disponibles en el sistema, con la ruta y el icono
// que ocupan en el panel. Activar/desactivar un módulo por empresa se
// hace en la tabla `company_modules` (Supabase) — nada de esto se toca
// por cliente, solo se activa o desactiva una fila.

export type ModuleKey =
  | "agenda"
  | "historial_clinico"
  | "seguimiento"
  | "ficha_vehiculo"
  | "presupuestos"
  | "bonos"
  | "fotos"
  | "consentimientos"
  | "facturacion";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  href: string;
}

export const MODULE_CATALOG: ModuleDef[] = [
  { key: "agenda", label: "Agenda", href: "/citas" },
  { key: "historial_clinico", label: "Historial", href: "/historial" },
  { key: "seguimiento", label: "Seguimiento", href: "/seguimiento" },
  { key: "ficha_vehiculo", label: "Vehículos", href: "/vehiculos" },
  { key: "presupuestos", label: "Presupuestos", href: "/presupuestos" },
  { key: "bonos", label: "Bonos", href: "/bonos" },
  { key: "fotos", label: "Fotos", href: "/fotos" },
  { key: "consentimientos", label: "Consentimientos", href: "/consentimientos" },
  { key: "facturacion", label: "Facturación", href: "/facturacion" },
];

// Packs por vertical: qué módulos se activan por defecto al dar de alta
// una empresa nueva de ese tipo. Es solo el valor inicial que se inserta
// en company_modules — el cliente sigue pudiendo activar/desactivar
// cualquier módulo después desde el panel de administración.
export const VERTICAL_PACKS: Record<string, ModuleKey[]> = {
  fisio: ["agenda", "historial_clinico", "seguimiento", "bonos"],
  nutricion: ["agenda", "historial_clinico", "seguimiento"],
  taller: ["agenda", "ficha_vehiculo", "presupuestos"],
  dental: ["agenda", "historial_clinico", "fotos", "consentimientos", "presupuestos"],
  estetica: ["agenda", "historial_clinico", "fotos", "bonos", "consentimientos"],
  // Uso interno de RL Digital Studios como agencia: gestión de leads/clientes
  // propios, no un vertical que se vaya a vender a terceros. El historial
  // por contacto ya está siempre disponible en la ficha del contacto, así
  // que no hace falta el módulo "historial_clinico" (vista global).
  agencia: ["agenda", "presupuestos", "facturacion"],
  // Ampliación de verticales (inspirado en la matriz de Kollabox): negocios
  // basados en citas que encajan directamente en el mismo modelo.
  peluqueria: ["agenda", "historial_clinico", "fotos", "bonos"],
  tatuajes: ["agenda", "fotos", "consentimientos", "presupuestos"],
  manicura: ["agenda", "historial_clinico", "fotos", "bonos"],
  reformas: ["agenda", "presupuestos", "fotos", "facturacion"],

  // Catálogo ampliado para el asistente de configuración inicial (ver
  // lib/verticals.ts) — mismo criterio: cada pack trae lo común y general
  // para ese tipo de negocio, ajustable después desde el panel.
  osteopatia: ["agenda", "historial_clinico", "seguimiento", "bonos"],
  psicologia: ["agenda", "historial_clinico", "consentimientos"],
  podologia: ["agenda", "historial_clinico", "bonos"],
  entrenador_personal: ["agenda", "seguimiento", "bonos"],
  veterinaria: ["agenda", "historial_clinico", "presupuestos"],
  spa: ["agenda", "bonos", "fotos", "consentimientos"],
  barberia: ["agenda", "fotos", "bonos"],
  parquet: ["agenda", "presupuestos", "fotos", "facturacion"],
  pintura: ["agenda", "presupuestos", "fotos", "facturacion"],
  electricista: ["agenda", "presupuestos", "facturacion"],
  fontaneria: ["agenda", "presupuestos", "facturacion"],
  cerrajeria: ["agenda", "presupuestos", "facturacion"],
  jardineria: ["agenda", "presupuestos", "facturacion"],
  limpieza: ["agenda", "presupuestos", "facturacion"],
  asesoria: ["agenda", "presupuestos", "facturacion"],
  fotografia: ["agenda", "presupuestos", "fotos", "facturacion"],
  // Clases particulares: agenda de clases, seguimiento del progreso del
  // alumno, bonos de clases (muy habitual: "bono 10 clases") y facturación
  // si dan de alta como autónomos. Sin "historial_clinico": ese módulo es
  // para historiales médicos/clínicos, no encaja en clases particulares —
  // el progreso del alumno ya lo cubre "seguimiento".
  academia: ["agenda", "seguimiento", "bonos", "facturacion"],
};

import { createClient } from "@/lib/supabase/server";

// Devuelve solo los módulos activados para la empresa del usuario actual.
// Esto es lo que decide qué aparece en el menú y qué rutas son accesibles.
export async function getEnabledModules(companyId: string): Promise<ModuleDef[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("company_modules")
    .select("module_key")
    .eq("company_id", companyId)
    .eq("enabled", true);

  if (error || !data) return [];

  const enabledKeys = new Set(data.map((row) => row.module_key));
  return MODULE_CATALOG.filter((m) => enabledKeys.has(m.key));
}
