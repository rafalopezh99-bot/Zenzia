// Planes Zenzia (Start / Smart / Pro): única fuente de verdad de qué
// desbloquea cada plan. El plan se guarda en companies.plan.
//
// El plan marca el MÁXIMO permitido y el vertical decide qué tiene sentido
// para ese negocio: un módulo se ve solo si cumple las dos cosas.
import { createClient } from "@/lib/supabase/server";
import type { ModuleDef, ModuleKey } from "@/lib/modules";
import type { WidgetKey } from "@/lib/widgets";

export type PlanKey = "start" | "smart" | "pro";

export const PLAN_LABEL: Record<PlanKey, string> = { start: "Start", smart: "Smart", pro: "Pro" };

// Límites mensuales (null = ilimitado). Se cuenta lo creado en el mes en curso.
export type LimitKey = "contacts" | "invoices" | "quotes" | "proformas";

export const PLAN_LIMITS: Record<PlanKey, Record<LimitKey, number | null>> = {
  start: { contacts: 30, invoices: 30, quotes: 10, proformas: 10 },
  smart: { contacts: 150, invoices: 150, quotes: 50, proformas: 50 },
  pro: { contacts: null, invoices: null, quotes: null, proformas: null },
};

export const PLAN_USERS: Record<PlanKey, number | null> = { start: 1, smart: 3, pro: null };

// Start: solo dashboard, clientes, agenda, facturación y perfil. Smart y
// Pro tienen todos los módulos que active su vertical (Mi Web, solo Pro).
const START_MODULES: ModuleKey[] = ["agenda", "facturacion", "presupuestos"];

export function planAllowsModule(plan: PlanKey, key: ModuleKey): boolean {
  if (key === "sitio_web") return plan === "pro";
  return plan !== "start" || START_MODULES.includes(key);
}

export function filterModulesByPlan(modules: ModuleDef[], plan: PlanKey) {
  return modules.filter((m) => planAllowsModule(plan, m.key));
}

// Funciones sueltas que no son módulos.
export function planAllowsSuppliers(plan: PlanKey) {
  return plan !== "start";
}

export function planAllowsNotifications(plan: PlanKey) {
  return plan !== "start";
}

// Funciones de Smart y Pro (ver lib/planContent.ts para el texto comercial).
export type PlanFeature = "booking" | "email_reminders" | "whatsapp" | "reviews" | "winback" | "portal";
const FEATURE_MIN_PLAN: Record<PlanFeature, PlanKey> = {
  booking: "smart",
  email_reminders: "smart",
  whatsapp: "pro",
  reviews: "pro",
  winback: "pro",
  portal: "pro",
};
const PLAN_RANK: Record<PlanKey, number> = { start: 0, smart: 1, pro: 2 };

export function planHas(plan: PlanKey, feature: PlanFeature) {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

// Start: dashboard básico, sin gráficas avanzadas.
const START_HIDDEN_WIDGETS: WidgetKey[] = [
  "stat_proveedores",
  "stat_notificaciones",
  "leads_pipeline",
  "chart_facturacion_anual",
  "top_clientes_potenciales",
  "top_servicios_potenciales",
];

export function planAllowsWidget(plan: PlanKey, key: WidgetKey) {
  return plan !== "start" || !START_HIDDEN_WIDGETS.includes(key);
}

export function toPlanKey(raw: unknown): PlanKey {
  return raw === "smart" || raw === "pro" ? raw : "start";
}

const LIMIT_TABLE: Record<LimitKey, string> = {
  contacts: "contacts",
  invoices: "invoices",
  quotes: "quotes",
  proformas: "quotes",
};
// Presupuestos y proformas comparten tabla (quotes), se distinguen por kind.
const LIMIT_KIND: Partial<Record<LimitKey, string>> = { quotes: "presupuesto", proformas: "proforma" };
const LIMIT_NOUN: Record<LimitKey, string> = {
  contacts: "clientes",
  invoices: "facturas",
  quotes: "presupuestos",
  proformas: "proformas",
};

// Lanza un error legible si la empresa ya ha llegado al límite mensual de su
// plan. RLS ya limita el conteo a la empresa del usuario.
export async function assertWithinLimit(plan: PlanKey, key: LimitKey) {
  const limit = PLAN_LIMITS[plan][key];
  if (limit === null) return;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const supabase = createClient();
  let query = supabase.from(LIMIT_TABLE[key]).select("id", { count: "exact", head: true }).gte("created_at", monthStart);
  const kind = LIMIT_KIND[key];
  if (kind) query = query.eq("kind", kind);
  const { count } = await query;

  if ((count ?? 0) >= limit) {
    throw new Error(
      `Has llegado al límite de ${limit} ${LIMIT_NOUN[key]} al mes del plan ${PLAN_LABEL[plan]}. Mejora tu plan para seguir.`
    );
  }
}
