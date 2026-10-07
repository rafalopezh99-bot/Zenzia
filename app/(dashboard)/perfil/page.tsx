import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyProfile } from "@/lib/company";
import { updateCompanyProfile } from "@/lib/actions/company";
import { signOut } from "@/lib/actions/auth";
import { Card, PageHeader, Input, Select, PrimaryButton, GhostButton } from "@/components/ui";
import { VERTICAL_CATALOG, VERTICAL_CATEGORIES } from "@/lib/verticals";
import { VAT_OPTIONS, IRPF_OPTIONS } from "@/lib/documents";
import { PLAN_LABEL } from "@/lib/plans";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Perfil del negocio: datos que antes solo se rellenaban una vez en el
// asistente de configuración inicial (o directamente no existían, como
// contacto/facturación) y no había dónde volver a tocarlos. Todo en un
// único formulario con un único botón "Guardar" — mismo criterio que la
// ficha de contacto.
export default async function PerfilPage() {
  const supabase = createClient();
  const { companyId, fullName, plan } = await getCurrentCompanyProfile();

  const { data: company } = await supabase
    .from("companies")
    .select("name, vertical, business_type, phone, email, tax_id, address, postal_code, city, default_vat, default_irpf, logo_path")
    .eq("id", companyId)
    .single();

  const logoUrl = company?.logo_path
    ? `${supabase.storage.from("logos").getPublicUrl(company.logo_path).data.publicUrl}?t=${Date.now()}`
    : null;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Perfil del negocio"
        action={
          <form action={signOut}>
            <GhostButton className="text-red-600 hover:border-red-300 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400">
              Cerrar sesión
            </GhostButton>
          </form>
        }
      />

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate">Tu plan</div>
          <div className="text-lg font-bold text-ink">Zenzia {PLAN_LABEL[plan]}</div>
        </div>
        <Link href="/planes" className="text-sm font-semibold text-brand hover:underline">
          {plan === "pro" ? "Ver planes" : "Mejorar plan →"}
        </Link>
      </Card>

      <form action={updateCompanyProfile}>
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Datos básicos</h2>
          <div className="space-y-3">
            <Input name="name" placeholder="Nombre de la empresa" required defaultValue={company?.name ?? ""} className="w-full" />
            <Input
              name="manager_name"
              placeholder="Quién gestiona la cuenta"
              defaultValue={fullName ?? ""}
              className="w-full"
            />
            <div className="flex flex-wrap gap-2">
              <Select name="vertical" defaultValue={company?.vertical ?? ""} className="flex-1">
                {VERTICAL_CATEGORIES.map((category) => (
                  <optgroup key={category} label={category}>
                    {VERTICAL_CATALOG.filter((v) => v.category === category).map((v) => (
                      <option key={v.key} value={v.key}>
                        {v.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <Select name="business_type" defaultValue={company?.business_type ?? ""} className="flex-1">
                <option value="autonomo">Autónomo</option>
                <option value="empresa">Empresa</option>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Logo e identidad</h2>
          <div className="flex flex-wrap items-center gap-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo actual" className="h-14 w-14 rounded-lg border border-line object-contain bg-surface" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-line text-xs text-slate/60">
                Sin logo
              </div>
            )}
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg"
              className="flex-1 text-sm text-slate file:mr-3 file:rounded-full file:border-0 file:bg-paper-deep file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink hover:file:bg-line/60"
            />
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Datos fiscales</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input name="tax_id" placeholder="NIF / CIF" defaultValue={company?.tax_id ?? ""} />
            <Input name="phone" placeholder="Teléfono" defaultValue={company?.phone ?? ""} />
            <Input name="email" type="email" placeholder="Email" defaultValue={company?.email ?? ""} className="sm:col-span-2" />
            <Input name="address" placeholder="Dirección fiscal" defaultValue={company?.address ?? ""} className="sm:col-span-2" />
            <Input name="postal_code" placeholder="Código postal" defaultValue={company?.postal_code ?? ""} />
            <Input name="city" placeholder="Ciudad / provincia" defaultValue={company?.city ?? ""} />
          </div>
          <p className="mt-2 text-xs text-slate/70">Salen como emisor en tus facturas, presupuestos y proformas.</p>
        </Card>

        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Impuestos por defecto</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate">
              IVA de tus servicios
              <Select name="default_vat" defaultValue={String(company?.default_vat ?? 21)} className="mt-1 w-full">
                {VAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-xs text-slate">
              Retención IRPF
              <Select name="default_irpf" defaultValue={String(company?.default_irpf ?? 0)} className="mt-1 w-full">
                {IRPF_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r === 0 ? "Sin retención" : `${r} %`}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <p className="mt-2 text-xs text-slate/70">
            Se aplican al crear un documento nuevo (se pueden cambiar en cada uno). Psicología, fisioterapia y otras
            profesiones sanitarias suelen estar exentas de IVA: consúltalo con tu gestor.
          </p>
        </Card>

        <PrimaryButton className="w-full">Guardar</PrimaryButton>
      </form>
    </div>
  );
}
