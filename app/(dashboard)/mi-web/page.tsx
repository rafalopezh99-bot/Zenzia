import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { updateSiteContent, addService, removeService, toggleSitePublished } from "@/lib/actions/siteContent";
import { getSiteTemplate } from "@/lib/site-templates/registry";
import { Card, PageHeader, PrimaryButton } from "@/components/ui";

// Módulo "Mi Web" (sitio_web): pensado para poder venderse suelto, sin el
// resto del CRM — por eso esta pantalla no depende de ningún otro módulo
// activo, solo de que "sitio_web" lo esté (lo decide el sidebar/layout
// leyendo company_modules, ver lib/modules.ts).
//
// El diseño de la web (template_key) lo asigna RL Digital Studios al dar
// de alta al cliente, a partir de la plantilla real que se le entregó —
// no es algo que el cliente cambie desde aquí, así que se muestra como
// dato informativo, no como campo editable.
export default async function MiWebPage() {
  const supabase = createClient();
  const companyId = await getCurrentCompanyId();

  const { data: site } = await supabase
    .from("site_content")
    .select("template_key, accent_color, data, published")
    .eq("company_id", companyId)
    .maybeSingle();

  const d = (site?.data as Record<string, any>) ?? {};
  const services: { name: string; desc: string }[] = d.services ?? [];
  const accent = site?.accent_color ?? "#2E6D83";
  const template = getSiteTemplate(site?.template_key);

  return (
    <div>
      <PageHeader title="Mi Web" />

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate">
          Plantilla: <b className="text-ink">{template.label}</b> ·{" "}
          {site?.published ? "publicada" : "todavía no publicada — solo la ves tú aquí"}
        </div>
        <div className="flex items-center gap-3">
          <a href={`/sitio/${companyId}`} target="_blank" rel="noreferrer" className="text-sm text-brand underline">
            Ver vista previa
          </a>
          <form action={toggleSitePublished}>
            <input type="hidden" name="published" value={site?.published ? "false" : "true"} />
            <PrimaryButton>{site?.published ? "Despublicar" : "Publicar"}</PrimaryButton>
          </form>
        </div>
      </Card>

      <form action={updateSiteContent}>
        <Card className="mb-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">Encabezado</h3>
          <label className="mb-1 block text-xs text-slate">Nombre del negocio</label>
          <input
            name="brand"
            defaultValue={d.brand ?? ""}
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs text-slate">Color de acento</label>
          <input type="color" name="accent_color" defaultValue={accent} className="h-9 w-14 rounded border border-line" />
        </Card>

        <Card className="mb-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">Hero</h3>
          <label className="mb-1 block text-xs text-slate">Título</label>
          <input
            name="heroTitle"
            defaultValue={d.heroTitle ?? ""}
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs text-slate">Subtítulo</label>
          <input
            name="heroSub"
            defaultValue={d.heroSub ?? ""}
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs text-slate">Texto del botón</label>
          <input
            name="heroCta"
            defaultValue={d.heroCta ?? ""}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
        </Card>

        <Card className="mb-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">Nosotros</h3>
          <textarea
            name="about"
            defaultValue={d.about ?? ""}
            rows={3}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
        </Card>

        <Card className="mb-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">Contacto / Reserva</h3>
          <label className="mb-1 block text-xs text-slate">Teléfono</label>
          <input
            name="phone"
            defaultValue={d.phone ?? ""}
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs text-slate">WhatsApp</label>
          <input
            name="whatsapp"
            defaultValue={d.whatsapp ?? ""}
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs text-slate">Dirección</label>
          <input
            name="address"
            defaultValue={d.address ?? ""}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
        </Card>

        <Card className="mb-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">Pie de página</h3>
          <label className="mb-1 block text-xs text-slate">Instagram</label>
          <input
            name="instagram"
            defaultValue={d.instagram ?? ""}
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs text-slate">Texto copyright</label>
          <input
            name="copyright"
            defaultValue={d.copyright ?? ""}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
        </Card>

        <PrimaryButton>Guardar cambios</PrimaryButton>
      </form>

      <Card className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-ink">Servicios</h3>
        {services.map((s, i) => (
          <div key={i} className="mb-2 flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
            <div>
              <div className="text-ink">{s.name}</div>
              <div className="text-xs text-slate">{s.desc}</div>
            </div>
            <form action={removeService}>
              <input type="hidden" name="index" value={i} />
              <button className="text-xs text-red-600">Quitar</button>
            </form>
          </div>
        ))}
        <form action={addService} className="mt-3 flex flex-wrap items-end gap-2">
          <input name="service_name" placeholder="Nombre del servicio" required className="rounded-lg border border-line px-3 py-2 text-sm" />
          <input name="service_desc" placeholder="Descripción corta" className="rounded-lg border border-line px-3 py-2 text-sm" />
          <PrimaryButton>+ Añadir servicio</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
