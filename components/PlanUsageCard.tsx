import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LABEL, PLAN_LIMITS, type LimitKey, type PlanKey } from "@/lib/plans";

// Tarjeta del dashboard del plan Gratis: cuántos clientes lleva de su límite y
// cuántas citas se han perdido por ausencias (lo que resuelven los
// recordatorios de Smart). Smart y Pro no tienen límites y no la ven.

export default async function PlanUsageCard({ plan, monthStart }: { plan: PlanKey; monthStart: Date }) {
  if (plan !== "start") return null;
  const supabase = await createClient();
  const since = monthStart.toISOString();

  const [{ count: contacts }, { count: noShows }] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "no_show")
      .gte("starts_at", since),
  ]);

  const usage = [{ key: "contacts" as LimitKey, label: "Clientes", used: contacts ?? 0, limit: PLAN_LIMITS[plan].contacts ?? 0 }];

  return (
    <div className="mb-8 rounded-2xl border border-line bg-surface p-5 sm:max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">
          Plan {PLAN_LABEL[plan]}
        </span>
        <Link href="/planes" className="text-sm font-semibold text-brand hover:underline">
          Mejorar plan →
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {usage.map((u) => {
          const pct = u.limit ? Math.min(100, Math.round((u.used / u.limit) * 100)) : 0;
          return (
            <div key={u.key}>
              <div className="flex justify-between text-xs text-slate">
                <span>{u.label}</span>
                <span className={pct >= 80 ? "font-semibold text-amber-600" : ""}>
                  {u.used}/{u.limit}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-deep">
                <div className={`h-full rounded-full ${pct >= 80 ? "bg-amber-500" : "bg-brand"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {plan === "start" && (noShows ?? 0) > 0 && (
        <p className="mt-4 rounded-xl bg-paper-deep px-4 py-3 text-sm text-ink">
          Este mes han faltado <b>{noShows}</b> {noShows === 1 ? "cliente" : "clientes"} a su cita. Con{" "}
          <Link href="/planes" className="font-semibold text-brand hover:underline">
            Smart
          </Link>{" "}
          les llega un recordatorio automático antes de cada cita.
        </p>
      )}
    </div>
  );
}
