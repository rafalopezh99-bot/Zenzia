// Catálogo de widgets del dashboard: el cliente decide cuáles quiere ver
// desde "Editar panel" (ver DashboardWidgetsEditor.tsx). La selección se
// guarda en companies.dashboard_widgets (jsonb, array de keys). `null` en
// esa columna significa "todavía no ha tocado nada": se usa el set por
// defecto de su contexto (standard o academia) para que una empresa que
// nunca entra a personalizar vea exactamente lo mismo que antes de que
// existiera esta opción.

export type WidgetKey =
  | "stat_contactos"
  | "stat_citas"
  | "stat_notificaciones"
  | "stat_ganado_mes"
  | "stat_proveedores"
  | "leads_pipeline"
  | "proximas_citas"
  | "clases_hoy"
  | "clases_manana";

export interface WidgetDef {
  key: WidgetKey;
  label: string;
}

// Catálogo "estándar" (la mayoría de verticales) y el de "academia" (clases
// particulares, que usa un dashboard con otra forma: horario de hoy/mañana
// en vez de pipeline de leads). Un widget que no esté en el catálogo del
// contexto actual nunca se pinta, aunque esté en la selección guardada —
// así cambiar de vertical no deja huérfanos.
export const STANDARD_WIDGETS: WidgetDef[] = [
  { key: "stat_contactos", label: "Contactos activos" },
  { key: "stat_citas", label: "Próximas citas (contador)" },
  { key: "stat_notificaciones", label: "Notificaciones nuevas" },
  { key: "stat_ganado_mes", label: "Ganado este mes" },
  { key: "stat_proveedores", label: "Proveedores dados de alta" },
  { key: "leads_pipeline", label: "Leads por etapa" },
  { key: "proximas_citas", label: "Próximas citas (listado)" },
];

export const ACADEMIA_WIDGETS: WidgetDef[] = [
  { key: "stat_contactos", label: "Alumnos activos" },
  { key: "stat_ganado_mes", label: "Ganado este mes" },
  { key: "stat_proveedores", label: "Proveedores dados de alta" },
  { key: "clases_hoy", label: "Clases de hoy" },
  { key: "clases_manana", label: "Clases de mañana" },
];

export function getWidgetCatalog(isAcademia: boolean): WidgetDef[] {
  return isAcademia ? ACADEMIA_WIDGETS : STANDARD_WIDGETS;
}

// dashboard_widgets tal cual sale de Supabase (jsonb): null, un array, o
// (por seguridad ante datos corruptos) cualquier otra cosa.
export function resolveEnabledWidgets(raw: unknown, isAcademia: boolean): Set<WidgetKey> {
  const catalog = getWidgetCatalog(isAcademia);
  const catalogKeys = new Set(catalog.map((w) => w.key));

  if (!Array.isArray(raw)) {
    // Sin preferencia guardada todavía: todo lo del contexto actual activado.
    return catalogKeys;
  }

  const selected = new Set(raw.filter((k): k is WidgetKey => typeof k === "string" && catalogKeys.has(k as WidgetKey)));
  return selected;
}
