import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toPlanKey } from "@/lib/plans";

// La empresa de Rafa (RL Digital Studios), dueño de Zenzia. Es la única que
// puede ver /solicitudes (las peticiones de gente que quiere registrarse) —
// mismo id que ya usan las políticas de Supabase para el formulario público
// de contacto y el de notificaciones.
export const ZENZIA_ADMIN_COMPANY_ID = "5a279e59-d107-4341-80a2-f33bb5f71b24";

// Toda pantalla del panel cuelga de la empresa (tenant) del usuario logueado,
// así que esto se acaba pidiendo varias veces en la misma carga de página
// (el layout, la propia página, a veces un componente...). `cache()` de
// React hace que, dentro de la misma petición, la segunda llamada en
// adelante no vuelva a tocar la red — se sirve del resultado ya calculado.
// Sin esto, cada `await getCurrentCompanyProfile()` repetido era un viaje
// completo (autenticación + 1-2 consultas) que el usuario notaba como
// lentitud al navegar por el panel.
//
// Perfil completo del usuario/empresa actual: además del company_id, trae
// el nombre de quien gestiona la cuenta (para el saludo del dashboard) y si
// la empresa ya pasó por el asistente de configuración inicial. Se usa en
// el layout del panel (para redirigir a /onboarding si falta), en el propio
// dashboard (saludo) y en la pantalla de onboarding.
export const getCurrentCompanyProfile = cache(async () => {
  const supabase = await createClient();
  // getSession() lee la cookie tal cual (sin red); no hace falta volver a
  // verificarla contra el servidor de Supabase porque el middleware ya lo
  // ha hecho justo antes, en esta misma petición (ver
  // lib/supabase/middleware.ts). Antes esto llamaba a getUser(), que repite
  // esa verificación por red en cada página — el doble viaje era buena
  // parte de la lentitud al cambiar de página.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) redirect("/login");

  // Antes esto era dos consultas seguidas (company_users, luego companies).
  // Al pedir la relación en el mismo select, Supabase la trae en un único
  // viaje de red en vez de dos.
  const { data: membership } = await supabase
    .from("company_users")
    .select("company_id, full_name, companies(name, onboarded, vertical, logo_path, dashboard_widgets, plan)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/login");

  const company = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;

  // URL pública del logo (bucket "logos", ver Perfil del negocio): se
  // calcula ya aquí para que cualquier pantalla del panel pueda pintarlo
  // sin tener que volver a consultar la tabla companies.
  const logoUrl = company?.logo_path
    ? supabase.storage.from("logos").getPublicUrl(company.logo_path).data.publicUrl
    : null;

  return {
    companyId: membership.company_id as string,
    fullName: (membership.full_name as string | null) ?? null,
    companyName: company?.name ?? "",
    onboarded: company?.onboarded ?? false,
    vertical: (company?.vertical as string | null) ?? null,
    logoUrl,
    dashboardWidgets: (company?.dashboard_widgets as unknown) ?? null,
    plan: toPlanKey(company?.plan),
  };
});

// Cuando solo hace falta el company_id (la mayoría de las acciones del
// servidor), reutiliza el mismo perfil cacheado en vez de repetir la
// consulta por su cuenta.
export async function getCurrentCompanyId(): Promise<string> {
  const { companyId } = await getCurrentCompanyProfile();
  return companyId;
}

// Datos de facturación de la empresa (nombre, NIF/CIF, dirección,
// contacto): lo que sale como emisor en las facturas/presupuestos en PDF.
// Aparte de getCurrentCompanyProfile porque esos campos no hacen falta en
// casi ninguna otra pantalla del panel — no tiene sentido cargarlos siempre.
export async function getCurrentCompanyBillingInfo() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();

  const { data: company } = await supabase
    .from("companies")
    .select("name, tax_id, address, postal_code, city, phone, email, logo_path, default_vat, default_irpf")
    .eq("id", companyId)
    .single();

  return {
    name: company?.name ?? "",
    taxId: (company?.tax_id as string | null) ?? null,
    address: (company?.address as string | null) ?? null,
    phone: (company?.phone as string | null) ?? null,
    email: (company?.email as string | null) ?? null,
    postalCode: (company?.postal_code as string | null) ?? null,
    province: (company?.city as string | null) ?? null,
    defaultVat: Number(company?.default_vat ?? 21),
    defaultIrpf: Number(company?.default_irpf ?? 0),
    logoUrl: company?.logo_path
      ? supabase.storage.from("logos").getPublicUrl(company.logo_path as string).data.publicUrl
      : null,
  };
}
