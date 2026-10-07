import { createClient } from "@/lib/supabase/server";
import { addActivity, updateContact } from "@/lib/actions/contacts";
import { notFound } from "next/navigation";
import { Card, PageHeader, Input, Select, PrimaryButton } from "@/components/ui";
import { PIPELINE_STAGES, STAGE_LABEL, CONTACT_CHANNELS, CHANNEL_LABEL, getStage } from "@/lib/pipeline";
import { getCurrentCompanyProfile } from "@/lib/company";
import { showsAgencyPipeline, showsAcademiaFields } from "@/lib/terminology";
import { BILLING_FREQUENCIES, BILLING_FREQUENCY_LABEL } from "@/lib/billing";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.zenzia.es";
const PORTAL_MSG = "Aquí tienes tu área personal con tus citas, pautas y facturas: ";

export default async function ContactoDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { vertical, plan, companyId } = await getCurrentCompanyProfile();
  const showPipeline = showsAgencyPipeline(vertical);
  const showAcademia = showsAcademiaFields(vertical);

  // Ninguna depende de la otra (ambas filtran directamente por params.id),
  // así que se piden a la vez en vez de una detrás de otra.
  const [{ data: contact }, { data: activities }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", params.id).single(),
    supabase
      .from("activities")
      .select("id, type, content, created_at")
      .eq("contact_id", params.id)
      .order("created_at", { ascending: false }),
  ]);
  if (!contact) notFound();

  const addActivityForContact = addActivity.bind(null, params.id);
  const updateContactForContact = updateContact.bind(null, params.id);
  const currentStage = getStage(contact.custom_fields);
  const demoUrl: string = contact.custom_fields?.demo_url ?? "";
  const businessType: string = contact.custom_fields?.business_type ?? "";
  const instagramHandle: string = contact.custom_fields?.instagram_handle ?? "";
  const contactedVia: string = contact.custom_fields?.contacted_via ?? "";
  const curso: string = contact.custom_fields?.curso ?? "";
  const subjectList: string[] = contact.custom_fields?.subjects ?? [];
  const pueblo: string = contact.custom_fields?.pueblo ?? "";
  const taxId: string = contact.custom_fields?.tax_id ?? "";
  const billingAddress: string = contact.custom_fields?.billing_address ?? "";
  const postalCode: string = contact.custom_fields?.postal_code ?? "";
  const province: string = contact.custom_fields?.province ?? "";
  const country: string = contact.custom_fields?.country ?? "España";
  const billingFrequency: string = contact.custom_fields?.billing_frequency ?? "";
  // wa.me solo admite dígitos: se limpian espacios/guiones/+ del teléfono
  // tal cual esté guardado.
  const whatsappDigits = (contact.phone ?? "").replace(/[^\d]/g, "");

  // Sectores de consulta (nutrición, psicología, entrenador...): ficha
  // simple. Las notas de cada sesión van en la propia cita, no aquí.
  if (!showPipeline && !showAcademia) {
    // Registro de accesos a la ficha (datos de salud, RGPD).
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("access_log").insert({ company_id: companyId, user_id: user.id, contact_id: contact.id, action: "ver_ficha" });
    }
    const { data: accesses } = await supabase
      .from("access_log")
      .select("created_at")
      .eq("contact_id", contact.id)
      .order("created_at", { ascending: false })
      .limit(5);
    const birth = contact.birth_date ? new Date(contact.birth_date) : null;
    const age = birth ? Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
    const actionClass =
      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-90";

    return (
      <div className="max-w-2xl">
        <PageHeader title={contact.full_name} />
        <div className="-mt-6 mb-6 flex flex-wrap items-center gap-3">
          {age !== null && <span className="text-sm text-slate">{age} años</span>}
          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${actionClass} bg-[#25D366] text-white`}
            >
              WhatsApp
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className={`${actionClass} bg-brand text-white`}>
              Llamar
            </a>
          )}
        </div>

        <form action={updateContactForContact}>
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Contacto</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input name="full_name" placeholder="Nombre y apellidos" required defaultValue={contact.full_name} className="sm:col-span-2" />
              <Input name="phone" type="tel" placeholder="Teléfono" defaultValue={contact.phone ?? ""} />
              <Input name="email" type="email" placeholder="Email" defaultValue={contact.email ?? ""} />
              <Input name="billing_address" placeholder="Dirección" defaultValue={billingAddress} className="sm:col-span-2" />
              <label className="text-xs text-slate">
                Fecha de nacimiento
                <Input name="birth_date" type="date" defaultValue={contact.birth_date ?? ""} className="mt-1 w-full" />
              </label>
              <label className="text-xs text-slate">
                DNI / NIF
                <Input name="tax_id" placeholder="Opcional" defaultValue={taxId} className="mt-1 w-full" />
              </label>
            </div>
            <PrimaryButton className="mt-4">Guardar</PrimaryButton>
          </Card>
        </form>

        {plan !== "start" && (
          <>
        <Card className="mb-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Portal del cliente</h2>
            {plan !== "pro" && <span className="text-xs font-semibold text-slate">🔒 Pro</span>}
          </div>
          {plan === "pro" ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <a href={`/portal/${contact.portal_token}`} target="_blank" className="font-semibold text-brand hover:underline">
                Abrir portal →
              </a>
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(PORTAL_MSG + `${SITE_URL}/portal/${contact.portal_token}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate hover:text-brand"
                >
                  Enviar enlace por WhatsApp
                </a>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate">
              Tu cliente ve sus citas, pautas y facturas en su propia área personal.{" "}
              <Link href="/planes" className="font-semibold text-brand hover:underline">
                Disponible en Pro →
              </Link>
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Evolución y pautas</h2>
          </div>
          {(
            <Link href="/seguimiento" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
              Ver evolución y pautas →
            </Link>
          )}
        </Card>
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate">
          <span>
            Últimos accesos:{" "}
            {(accesses ?? []).map((a: any) => new Date(a.created_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "short", timeStyle: "short" })).join(" · ")}
          </span>
          <a href={`/api/export/paciente/${contact.id}`} className="font-semibold text-brand hover:underline">
            Descargar sus datos (RGPD)
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={`#${contact.contact_number ?? "—"} · ${contact.full_name}`} />
      <div className="-mt-6 mb-6 text-sm text-slate">
        <p>
          {showPipeline && businessType && <span className="text-ink">{businessType}</span>}
          {showPipeline && businessType && (contact.phone || contact.email) && " · "}
          {contact.phone && (
            <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              {contact.phone}
            </a>
          )}
          {contact.phone && contact.email && " · "}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-brand hover:underline">
              {contact.email}
            </a>
          )}
          {showPipeline && instagramHandle && (contact.phone || contact.email) && " · "}
          {showPipeline && instagramHandle && (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              @{instagramHandle}
            </a>
          )}
          {" · "}
          <span className="text-slate/70">
            Alta: {new Date(contact.created_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}
          </span>
          {showPipeline && contactedVia && (
            <span className="text-slate/70">
              {" · "}Contactado por: {CHANNEL_LABEL[contactedVia as keyof typeof CHANNEL_LABEL] ?? contactedVia}
            </span>
          )}
          {showPipeline && demoUrl && (
            <>
              {" · "}
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                Ver demo →
              </a>
            </>
          )}
        </p>
        {showAcademia && (curso || subjectList.length > 0 || pueblo) && (
          <p>
            {curso && <span className="text-ink">{curso}</span>}
            {curso && subjectList.length > 0 && " · "}
            {subjectList.join(", ")}
            {(curso || subjectList.length > 0) && pueblo && " · "}
            {pueblo && <span className="text-slate/70">{pueblo}</span>}
          </p>
        )}
      </div>

      <form action={updateContactForContact}>
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Datos básicos</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Input name="full_name" placeholder="Nombre completo" required defaultValue={contact.full_name} className="flex-1" />
            <Input name="phone" placeholder="Teléfono" defaultValue={contact.phone ?? ""} className="flex-1" />
            <Input name="email" type="email" placeholder="Email" defaultValue={contact.email ?? ""} className="flex-1" />
          </div>
        </Card>

        {showPipeline && (
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Etapa del cliente</h2>
            <Select name="stage" defaultValue={currentStage}>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </Select>
          </Card>
        )}

        {showPipeline && (
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Datos del prospecto</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                name="business_type"
                placeholder="Tipo de negocio (ej. centro de estética)"
                defaultValue={businessType}
                className="flex-1"
              />
              <Input
                name="instagram_handle"
                placeholder="Instagram (usuario, sin @)"
                defaultValue={instagramHandle}
                className="flex-1"
              />
              <Select name="contacted_via" defaultValue={contactedVia}>
                <option value="">Contactado a través de</option>
                {CONTACT_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        )}

        {showPipeline && (
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Enlace de la demo</h2>
            <Input
              name="demo_url"
              type="url"
              placeholder="https://cliente-demo.netlify.app"
              defaultValue={demoUrl}
              className="w-full"
            />
          </Card>
        )}

        {showAcademia ? (
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Pueblo</h2>
            <Input name="pueblo" placeholder="Pueblo" defaultValue={pueblo} className="w-full" />
          </Card>
        ) : (
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Datos de facturación</h2>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Input name="tax_id" placeholder="DNI / CIF" defaultValue={taxId} className="flex-1" />
                <Input name="billing_address" placeholder="Dirección" defaultValue={billingAddress} className="flex-[2]" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Input name="postal_code" placeholder="Código postal" defaultValue={postalCode} className="w-28" />
                <Input name="province" placeholder="Provincia" defaultValue={province} className="flex-1" />
                <Input name="country" placeholder="País" defaultValue={country} className="flex-1" />
              </div>
              <Select name="billing_frequency" defaultValue={billingFrequency} className="w-full">
                <option value="">Facturación (opcional)</option>
                {BILLING_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {BILLING_FREQUENCY_LABEL[f]}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        )}

        <PrimaryButton className="w-full">Guardar</PrimaryButton>
      </form>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">
          Notas / resumen de conversaciones
        </h2>
        <form action={addActivityForContact} className="mb-4 flex gap-2">
          <Input name="content" placeholder="Ej: hablado por WhatsApp, interesado en el plan de 250€..." className="flex-1" />
          <PrimaryButton>Añadir</PrimaryButton>
        </form>

        <ul className="space-y-2 text-sm">
          {(activities ?? []).map((a) => (
            <li key={a.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
              <span className="text-slate/70">{new Date(a.created_at).toLocaleString("es-ES")}</span> —{" "}
              <span className="text-ink">{a.content}</span>
            </li>
          ))}
          {(activities ?? []).length === 0 && <li className="text-slate/70">Sin notas todavía.</li>}
        </ul>
      </Card>
    </div>
  );
}
