import type { SiteTemplateDef } from "./types";
import Generico from "./generico";
import ModernoOscuro from "./moderno-oscuro";
import RLDigitalStudios from "./rl-digital-studios";

// Registro de plantillas del módulo Mi Web. Añadir una plantilla nueva a
// partir del diseño real de un cliente es: crear el componente en este
// directorio (misma forma: recibe { data, accentColor } y devuelve JSX) y
// añadir una línea aquí — no hace falta tocar el editor, la base de datos
// ni la vista pública. `template_key` (columna en site_content, ver
// migración 2026-09-14-site-content-module.sql) decide cuál se usa por
// empresa; se asigna a mano al dar de alta a ese cliente.
export const SITE_TEMPLATES: SiteTemplateDef[] = [
  { key: "generico", label: "Genérica", Component: Generico },
  { key: "moderno_oscuro", label: "Moderna oscura", Component: ModernoOscuro },
  // Nombre visible cambiado de "RL Digital Studios" a "Clásica" (2026): la
  // marca ya no se usa de cara al cliente. La clave interna y el
  // componente se mantienen igual a propósito, para no romper los
  // `template_key` ya asignados en site_content.
  { key: "rl_digital_studios", label: "Clásica", Component: RLDigitalStudios },
];

export function getSiteTemplate(templateKey: string | null | undefined): SiteTemplateDef {
  return SITE_TEMPLATES.find((t) => t.key === templateKey) ?? SITE_TEMPLATES[0];
}
