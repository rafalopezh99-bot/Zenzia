import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyProfile } from "@/lib/company";
import { updateCompanyProfile } from "@/lib/actions/company";
import { Card, PageHeader, Input, Select, PrimaryButton } from "@/components/ui";
import { VERTICAL_CATALOG, VERTICAL_CATEGORIES } from "@/lib/verticals";

export const dynamic = "force-dynamic";

// Perfil del negocio: datos que antes solo se rellenaban una vez en el
// asistente de configuración inicial (o directamente no existían, como
// contacto/facturación) y no había dónde volver a tocarlos. Todo en un
// único formulario con un único botón "Guardar" — mismo criterio que la
// ficha de contacto.
export default async function PerfilPage() {
  const supabase = createClient();
  const { companyId, fullName } = await getCurrentCompanyProfile();

  const { data: company } = await supabase
    .from("companies")
    .select("name, vertical, business_type, phone, email, tax_id, address, logo_path")
    .eq("id", companyId)
    .single();

  const logoUrl = company?.logo_path
    ? `${supabase.storage.from("logos").getPublicUrl(company.logo_path).data.publicUrl}?t=${Date.now()}`
    : null;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Perfil del negocio" />

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
              accept="image/*"
              className="flex-1 text-sm text-slate file:mr-3 file:rounded-full file:border-0 file:bg-paper-deep file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink hover:file:bg-line/60"
            />
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Contacto y facturación</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input name="phone" placeholder="Teléfono" defaultValue={company?.phone ?? ""} className="flex-1" />
              <Input name="email" type="email" placeholder="Email" defaultValue={company?.email ?? ""} className="flex-1" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Input name="tax_id" placeholder="NIF / CIF" defaultValue={company?.tax_id ?? ""} className="flex-1" />
              <Input
                name="address"
                placeholder="Dirección fiscal"
                defaultValue={company?.address ?? ""}
                className="flex-[2]"
              />
            </div>
            <p className="text-xs text-slate/70">
              Estos datos son los que saldrán como emisor en las facturas y presupuestos que descargues.
            </p>
          </div>
        </Card>

        <PrimaryButton className="w-full">Guardar</PrimaryButton>
      </form>
    </div>
  );
}
