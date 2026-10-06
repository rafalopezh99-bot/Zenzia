// Planes Zenzia (Start / Smart / Pro): única fuente de verdad de qué
// desbloquea cada plan. El plan se guarda en companies.plan.
//
// El plan marca el MÁXIMO permitido y el vertical decide qué tiene sentido
// para ese negocio: un módulo se ve solo si cumple las dos cosas.
import { createClient } from "@/lib/supabase/server";
import { VERTICAL_PACKS, type ModuleDef, type ModuleKey } from "@/lib/modules";
import type { WidgetKey } from "@/lib/widgets";

export type PlanKey = "start" | "smart" | "pro";

export const PLAN_LABEL: Record<PlanKey, string> = { start: "Start", smart: "Smart", pro: "Pro" };

// Límites mensuales (null = ilimitado). Se cuenta lo creado en el mes en curso.
export type LimitKey = "contacts" | "invoices" | "quotes";

export const PLAN_LIMITS: Record<PlanKey, Record<LimitKey, number | null>> = {
  start: { contacts: 30, invoices: 30, quotes: 10 },
  smart: { contacts: 150, invoices: 150, quotes: 50 },
  pro: { contacts: null, invoices: null, quotes: null },
};

export const PLAN_USERS: Record<PlanKey, number | null> = { start: 1, smart: 3, pro: null };

// Núcleo común que todo plan tiene (si el vertical lo activa).
const CORE_MODULES: ModuleKey[] = ["agenda", "presupuestos", "facturacion"];

// Módulo principal del sector = el primero de su pack que no sea del núcleo
// (taller → vehículos, fisio → historial...). Es el único de sector en Start.
export function primarySectorModule(vertical: string | null): ModuleKey | null {
  const pack = (vertical && VERTICAL_PACKS[vertical]) || [];
  return pack.find((k) => !CORE_MODULES.includes(k)) ?? null;
}

export function planAllowsModule(plan: PlanKey, key: ModuleKey, vertical: string | null): boolean {
  if (key === "sitio_web") return plan === "pro";
  if (plan !== "start" || CORE_MODULES.includes(key)) return true;
  return key === primarySectorModule(vertical);
}

export function filterModulesByPlan(modules: ModuleDef[], plan: PlanKey, vertical: string | null) {
  return modules.filter((m) => planAllowsModule(plan, m.key, vertical));
}

// Funciones sueltas que no son módulos.
export function planAllowsSuppliers(plan: PlanKey) {
  return plan !== "start";
}

// Start: dashboard básico, sin gráficas avanzadas.
const START_HIDDEN_WIDGETS: WidgetKey[] = [
  "stat_proveedores",
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

const LIMIT_TABLE: Record<LimitKey, string> = { contacts: "contacts", invoices: "invoices", quotes: "quotes" };
const LIMIT_NOUN: Record<LimitKey, string> = { contacts: "clientes", invoices: "facturas", quotes: "presupuestos" };

// Lanza un error legible si la empresa ya ha llegado al límite mensual de su
// plan. RLS ya limita el conteo a la empresa del usuario.
export async function assertWithinLimit(plan: PlanKey, key: LimitKey) {
  const limit = PLAN_LIMITS[plan][key];
  if (limit === null) return;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const supabase = createClient();
  const { count } = await supabase
    .from(LIMIT_TABLE[key])
    .select("id", { count: "exact", head: true })
    .gte("created_at", monthStart);

  if ((count ?? 0) >= limit) {
    throw new Error(
      `Has llegado al límite de ${limit} ${LIMIT_NOUN[key]} al mes del plan ${PLAN_LABEL[plan]}. Mejora tu plan para seguir.`
    );
  }
}
