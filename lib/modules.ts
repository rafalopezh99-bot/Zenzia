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
