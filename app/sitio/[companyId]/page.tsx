import { createClient } from "@/lib/supabase/server";
import { getSiteTemplate } from "@/lib/site-templates/registry";
import { notFound } from "next/navigation";

// Vista pública de la web autogestionada de un cliente. Sin sesión: lee
// site_content vía la policy "public reads published site_content", que
// solo deja ver filas con published = true (ver migración
// 2026-09-14-site-content-module.sql). El diseño real lo decide
// `template_key` a través del registro de plantillas (ver
// lib/site-templates/registry.ts) — cada cliente puede tener una plantilla
// distinta sin que este archivo cambie.
export default async function SitioPublicoPage({ params }: { params: { companyId: string } }) {
  const supabase = createClient();
  const { data: site } = await supabase
    .from("site_content")
    .select("template_key, accent_color, data")
    .eq("company_id", params.companyId)
    .eq("published", true)
    .maybeSingle();

  if (!site) notFound();

  const { Component: Template } = getSiteTemplate(site.template_key);
  // Pro: si el negocio tiene reservas online activas, botón flotante para reservar.
  const { data: booking } = await supabase.rpc("public_booking_info", { p_company: params.companyId });
  const accent = site.accent_color ?? "#2E6D83";

  return (
    <>
      <Template data={(site.data as Record<string, any>) ?? {}} accentColor={accent} />
      {booking && (
        <a
          href={`/reservar/${params.companyId}`}
          className="fixed bottom-5 right-5 z-50 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg"
          style={{ background: accent }}
        >
          Reservar cita
        </a>
      )}
    </>
  );
}
