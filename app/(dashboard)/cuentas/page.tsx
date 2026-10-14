import { redirect } from "next/navigation";
import { Card, PageHeader, Badge, Select, PrimaryButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyProfile, ZENZIA_ADMIN_COMPANY_ID } from "@/lib/company";
import { updateAccount } from "@/lib/actions/accounts";

const PLAN_OPTIONS = [
  { key: "start", label: "Start" },
  { key: "smart", label: "Smart" },
  { key: "pro", label: "Pro" },
  { key: "web", label: "Web (interno)" },
];

// Cuentas de clientes de Zenzia (solo admin): activar altas nuevas y cambiar plan.
export default async function CuentasPage() {
  const { companyId } = await getCurrentCompanyProfile();
  if (companyId !== ZENZIA_ADMIN_COMPANY_ID) redirect("/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_companies");
  const rows = (data ?? []) as any[];

  return (
    <div className="max-w-4xl">
      <PageHeader moduleHeader title="Cuentas" />
      <div className="space-y-3">
        {rows.map((c) => (
          <Card key={c.id} className={c.activated ? "" : "border-amber-400"}>
            <form action={updateAccount.bind(null, c.id)} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{c.name}</span>
                  <Badge tone={c.activated ? "green" : "amber"}>{c.activated ? "Activa" : "Pendiente"}</Badge>
                </div>
                <div className="text-xs text-slate">
                  {c.owner_name ?? "—"} · {c.owner_email ?? "sin email"}
                  {c.phone ? ` · ${c.phone}` : ""} · {c.sector_other || c.vertical} · alta{" "}
                  {new Date(c.created_at).toLocaleDateString("es-ES")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select name="plan" defaultValue={c.plan} className="!py-1.5">
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-1 text-sm text-ink">
                  <input type="checkbox" name="activated" defaultChecked={c.activated} /> Activa
                </label>
                <PrimaryButton className="!px-4 !py-1.5">Guardar</PrimaryButton>
              </div>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
