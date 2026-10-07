import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyProfile } from "@/lib/company";
import { updateCompanyProfile, signVerifactuRepresentation } from "@/lib/actions/company";
import { signOut } from "@/lib/actions/auth";
import { Card, PageHeader, Input, Select, PrimaryButton, GhostButton } from "@/components/ui";
import { VERTICAL_CATALOG, VERTICAL_CATEGORIES } from "@/lib/verticals";
import { VAT_OPTIONS, IRPF_OPTIONS } from "@/lib/documents";
import { PLAN_LABEL, planHas } from "@/lib/plans";
import { parseBooking } from "@/lib/booking";
import Link from "next/link";

export const dynamic = "force-dynamic";

const WEEK_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

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
    .select("name, vertical, business_type, phone, email, tax_id, address, postal_code, city, default_vat, default_irpf, logo_path, booking, google_review_url, verifactu_state")
    .eq("id", companyId)
    .single();

  const booking = parseBooking(company?.booking);
  const vf = company?.verifactu_state as any;
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

        <Card className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Reservas online</h2>
            {!planHas(plan, "booking") && <span className="text-xs font-semibold text-slate">🔒 Smart</span>}
          </div>
          {planHas(plan, "booking") ? (
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="booking_enabled" defaultChecked={booking.enabled} /> Activar reservas online
              </label>
              <div className="flex flex-wrap gap-3">
                {WEEK_LETTERS.map((d, i) => (
                  <label key={i} className="flex items-center gap-1">
                    <input type="checkbox" name="booking_days" value={i + 1} defaultChecked={booking.days.includes(i + 1)} /> {d}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs text-slate">
                  Desde
                  <Input name="booking_start" type="time" defaultValue={booking.start} className="mt-1 w-full" />
                </label>
                <label className="text-xs text-slate">
                  Hasta
                  <Input name="booking_end" type="time" defaultValue={booking.end} className="mt-1 w-full" />
                </label>
                <label className="text-xs text-slate">
                  Duración (min)
                  <Input name="booking_duration" type="number" min="15" step="5" defaultValue={booking.duration} className="mt-1 w-full" />
                </label>
              </div>
              {booking.enabled && (
                <p className="text-xs text-slate">
                  Tu enlace de reservas:{" "}
                  <a href={`/reservar/${companyId}`} target="_blank" className="font-semibold text-brand hover:underline">
                    /reservar/{companyId}
                  </a>{" "}
                  · compártelo en Instagram, WhatsApp o tu web.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate">
              Tus clientes reservan solos en tus huecos libres, 24/7.{" "}
              <Link href="/planes" className="font-semibold text-brand hover:underline">
                Disponible en Smart →
              </Link>
            </p>
          )}
        </Card>

        <Card className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Reseñas de Google</h2>
            {!planHas(plan, "reviews") && <span className="text-xs font-semibold text-slate">🔒 Pro</span>}
          </div>
          {planHas(plan, "reviews") ? (
            <>
              <Input
                name="google_review_url"
                type="url"
                placeholder="Enlace para dejar reseña (Google Business > Pedir reseñas)"
                defaultValue={company?.google_review_url ?? ""}
                className="w-full"
              />
              <p className="mt-2 text-xs text-slate/70">
                Al día siguiente de cada cita completada, el cliente recibe un email pidiéndole una reseña.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate">
              Pide reseñas automáticamente después de cada sesión.{" "}
              <Link href="/planes" className="font-semibold text-brand hover:underline">
                Disponible en Pro →
              </Link>
            </p>
          )}
        </Card>

        <PrimaryButton className="w-full">Guardar</PrimaryButton>
      </form>

      <Card className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate">VeriFactu (Hacienda)</h2>
        {vf?.registered ? (
          <p className="text-sm text-ink">✓ NIF {vf.nif} dado de alta en VeriFactu.</p>
        ) : vf?.error ? (
          <p className="text-sm text-red-600">No se pudo dar de alta el NIF: {vf.error}</p>
        ) : (
          <p className="text-sm text-slate">Guarda tu NIF en "Datos fiscales" y se dará de alta automáticamente.</p>
        )}
        <p className="mt-2 text-xs text-slate/70">
          Para que tus facturas se envíen a Hacienda en tu nombre tienes que firmar una autorización (representación), una sola
          vez y online.
        </p>
        {vf?.representation_error && <p className="mt-2 text-xs text-red-600">{vf.representation_error}</p>}
        <form action={signVerifactuRepresentation} className="mt-3">
          <GhostButton>Firmar autorización</GhostButton>
        </form>
      </Card>
    </div>
  );
}
