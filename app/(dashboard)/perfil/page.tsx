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
import { createService, archiveService } from "@/lib/actions/services";
import { addTeamMember, removeTeamMember } from "@/lib/actions/team";
import { PLAN_USERS } from "@/lib/plans";
import MfaSetup from "@/components/MfaSetup";

export const dynamic = "force-dynamic";

const WEEK_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];
const TABS = [
  { key: "negocio", label: "Negocio" },
  { key: "servicios", label: "Servicios" },
  { key: "facturacion", label: "Facturación" },
  { key: "reservas", label: "Reservas y reseñas" },
  { key: "equipo", label: "Equipo" },
  { key: "seguridad", label: "Seguridad" },
  { key: "plan", label: "Plan" },
] as const;
const h2 = "mb-3 text-sm font-semibold uppercase tracking-wide text-slate";
const lockLink = "font-semibold text-brand hover:underline";

// Perfil del negocio en pestañas (?tab=...): cada pestaña es corta, tiene su
// propio botón Guardar y solo envía sus campos (ver updateCompanyProfile).
export default async function PerfilPage(props: { searchParams: Promise<{ tab?: string; ok?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = TABS.find((t) => t.key === searchParams.tab)?.key ?? "negocio";
  const supabase = await createClient();
  const { companyId, fullName, plan } = await getCurrentCompanyProfile();

  const { data: company } = await supabase
    .from("companies")
    .select(
      "name, vertical, business_type, phone, email, tax_id, address, postal_code, city, default_vat, default_irpf, logo_path, booking, google_review_url, verifactu_state, calendar_token"
    )
    .eq("id", companyId)
    .single();

  const { data: services } =
    tab === "servicios"
      ? await supabase.from("services").select("id, name, duration_min, price, vat").eq("active", true).order("name")
      : { data: [] as any[] };
  const { data: team } =
    tab === "equipo"
      ? await supabase.from("company_users").select("id, full_name, role, user_id").eq("company_id", companyId)
      : { data: [] as any[] };
  const maxUsers = PLAN_USERS[plan];
  const booking = parseBooking(company?.booking);
  const vf = company?.verifactu_state as any;
  const logoUrl = company?.logo_path
    ? `${supabase.storage.from("logos").getPublicUrl(company.logo_path).data.publicUrl}?t=${Date.now()}`
    : null;

  return (
    <div className="max-w-2xl">
      <PageHeader moduleHeader
        title="Perfil del negocio"
        action={
          <form action={signOut}>
            <GhostButton className="text-red-600 hover:border-red-300 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400">
              Cerrar sesión
            </GhostButton>
          </form>
        }
      />

      <div className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-line p-1 sm:inline-flex sm:rounded-full">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/perfil?tab=${t.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              t.key === tab ? "bg-brand text-white" : "text-slate hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {searchParams.ok && <p className="mb-4 text-sm font-medium text-green-700">✓ Cambios guardados</p>}
      {searchParams.error && <p className="mb-4 text-sm font-medium text-red-600">{searchParams.error}</p>}

      {tab === "equipo" && (
        <>
          <Card className="mb-4">
            <h2 className={h2}>
              Equipo ({(team ?? []).length}
              {maxUsers !== null ? ` de ${maxUsers}` : ""})
            </h2>
            <ul className="divide-y divide-line text-sm">
              {(team ?? []).map((m: any) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <span className="text-ink">
                    {m.full_name ?? "Sin nombre"}{" "}
                    <span className="text-xs text-slate">· {m.role === "member" ? "Profesional" : "Titular"}</span>
                  </span>
                  {m.role === "member" && (
                    <form action={removeTeamMember.bind(null, m.id)}>
                      <button className="text-xs text-slate hover:text-red-600">Quitar</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          {maxUsers === null || (team ?? []).length < maxUsers ? (
            <Card>
              <h2 className={h2}>Añadir profesional</h2>
              <form action={addTeamMember} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input name="full_name" placeholder="Nombre" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="text" placeholder="Contraseña temporal (mín. 8)" minLength={8} required />
                <PrimaryButton>Añadir</PrimaryButton>
              </form>
              <p className="mt-2 text-xs text-slate/70">
                Pásale su email y la contraseña temporal; podrá cambiarla desde &quot;¿Olvidaste tu contraseña?&quot;.
              </p>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-slate">
                Has llegado al máximo de usuarios de tu plan.{" "}
                <Link href="/planes" className={lockLink}>
                  Mejorar plan →
                </Link>
              </p>
            </Card>
          )}
        </>
      )}

      {tab === "seguridad" && (
        <Card>
          <h2 className={h2}>Verificación en dos pasos</h2>
          <MfaSetup />
        </Card>
      )}

      {tab === "negocio" && (
        <form action={updateCompanyProfile}>
          <input type="hidden" name="tab" value="negocio" />
          <Card className="mb-4">
            <h2 className={h2}>Datos básicos</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input name="name" placeholder="Nombre del negocio" required defaultValue={company?.name ?? ""} className="sm:col-span-2" />
              <Input name="manager_name" placeholder="Tu nombre" defaultValue={fullName ?? ""} />
              <Select name="business_type" defaultValue={company?.business_type ?? "autonomo"}>
                <option value="autonomo">Autónomo</option>
                <option value="empresa">Empresa</option>
              </Select>
              <Select name="vertical" defaultValue={company?.vertical ?? ""} className="sm:col-span-2">
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
            </div>
          </Card>
          <Card className="mb-4">
            <h2 className={h2}>Logo</h2>
            <div className="flex flex-wrap items-center gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo actual" className="h-14 w-14 rounded-lg border border-line bg-surface object-contain" />
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
            <p className="mt-2 text-xs text-slate/70">PNG o JPG, máximo 4 MB. Sale en tus facturas y en tu página de reservas.</p>
          </Card>
          <PrimaryButton>Guardar</PrimaryButton>
        </form>
      )}

      {tab === "servicios" && (
        <>
          <Card className="mb-4">
            <h2 className={h2}>Tus servicios</h2>
            <ul className="divide-y divide-line text-sm">
              {(services ?? []).map((s: any) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="text-ink">{s.name}</span>
                  <span className="flex items-center gap-3 text-slate">
                    {s.duration_min} min · {Number(s.price).toFixed(2)} € · {s.vat === -1 ? "Exento" : `IVA ${s.vat} %`}
                    <form action={archiveService.bind(null, s.id)}>
                      <button className="text-xs text-slate hover:text-red-600" title="Quitar">
                        ✕
                      </button>
                    </form>
                  </span>
                </li>
              ))}
              {(services ?? []).length === 0 && <li className="py-2 text-slate">Todavía no tienes servicios.</li>}
            </ul>
          </Card>
          <Card>
            <h2 className={h2}>Añadir servicio</h2>
            <form action={createService} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Input name="name" placeholder="Ej. Sesión de fisioterapia" required className="col-span-2" />
              <Input name="duration_min" type="number" min="5" step="5" placeholder="Minutos" defaultValue={45} />
              <Input name="price" type="number" min="0" step="0.01" placeholder="Precio €" />
              <Select name="vat" defaultValue={String(company?.default_vat ?? 21)} className="col-span-2">
                {VAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <PrimaryButton className="col-span-2">Añadir</PrimaryButton>
            </form>
            <p className="mt-2 text-xs text-slate/70">
              Al crear una cita eliges el servicio y se rellenan la duración y el precio; después la facturas con un clic.
            </p>
          </Card>
        </>
      )}

      {tab === "facturacion" && (
        <>
          <form action={updateCompanyProfile}>
            <input type="hidden" name="tab" value="facturacion" />
            <Card className="mb-4">
              <h2 className={h2}>Datos fiscales</h2>
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
            <Card className="mb-4">
              <h2 className={h2}>Impuestos por defecto</h2>
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
                Psicología, fisioterapia y otras profesiones sanitarias suelen estar exentas de IVA: consúltalo con tu gestor.
              </p>
            </Card>
            <PrimaryButton>Guardar</PrimaryButton>
          </form>

          <Card className="mt-6">
            <h2 className={h2}>VeriFactu (Hacienda)</h2>
            {vf?.registered ? (
              <p className="text-sm text-ink">✓ NIF {vf.nif} dado de alta en VeriFactu.</p>
            ) : vf?.error ? (
              <p className="text-sm text-red-600">No se pudo dar de alta el NIF: {vf.error}</p>
            ) : (
              <p className="text-sm text-slate">Guarda tu NIF arriba y se dará de alta automáticamente.</p>
            )}
            <p className="mt-2 text-xs text-slate/70">
              Para que tus facturas se envíen a Hacienda en tu nombre firma una autorización, una sola vez y online.
            </p>
            {vf?.representation_error && <p className="mt-2 text-xs text-red-600">{vf.representation_error}</p>}
            <form action={signVerifactuRepresentation} className="mt-3">
              <GhostButton>Firmar autorización</GhostButton>
            </form>
          </Card>
        </>
      )}

      {tab === "reservas" && (
        <form action={updateCompanyProfile}>
          <input type="hidden" name="tab" value="reservas" />
          <Card className="mb-4">
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
                    Tu enlace:{" "}
                    <a href={`/reservar/${companyId}`} target="_blank" className={lockLink}>
                      /reservar/{companyId}
                    </a>{" "}
                    · compártelo en Instagram, WhatsApp o tu web.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate">
                Tus clientes reservan solos en tus huecos libres, 24/7.{" "}
                <Link href="/planes" className={lockLink}>
                  Disponible en Smart →
                </Link>
              </p>
            )}
          </Card>
          <Card className="mb-4">
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
                <Link href="/planes" className={lockLink}>
                  Disponible en Pro →
                </Link>
              </p>
            )}
          </Card>
          {(planHas(plan, "booking") || planHas(plan, "reviews")) && <PrimaryButton>Guardar</PrimaryButton>}
          <Card className="mt-6">
            <h2 className={h2}>Ver tus citas en Google Calendar</h2>
            <p className="text-sm text-slate">
              En Google Calendar: Otros calendarios → + → Desde URL, y pega este enlace (no lo compartas):
            </p>
            <code className="mt-2 block break-all rounded-lg bg-paper-deep px-3 py-2 text-xs text-ink">
              {`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.zenzia.es"}/api/calendar/${company?.calendar_token}.ics`}
            </code>
          </Card>
        </form>
      )}

      {tab === "plan" && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate">Tu plan</div>
            <div className="text-lg font-bold text-ink">Zenzia {PLAN_LABEL[plan]}</div>
          </div>
          <Link href="/planes" className={lockLink}>
            {plan === "pro" ? "Ver planes y suscripción" : "Mejorar plan →"}
          </Link>
        </Card>
      )}
    </div>
  );
}
