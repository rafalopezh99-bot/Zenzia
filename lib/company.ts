import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Antes esto era dos consultas seguidas (company_users, luego companies).
  // Al pedir la relación en el mismo select, Supabase la trae en un único
  // viaje de red en vez de dos.
  const { data: membership } = await supabase
    .from("company_users")
    .select("company_id, full_name, companies(name, onboarded, vertical)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/login");

  const company = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;

  return {
    companyId: membership.company_id as string,
    fullName: (membership.full_name as string | null) ?? null,
    companyName: company?.name ?? "",
    onboarded: company?.onboarded ?? false,
    vertical: (company?.vertical as string | null) ?? null,
  };
});

// Cuando solo hace falta el company_id (la mayoría de las acciones del
// servidor), reutiliza el mismo perfil cacheado en vez de repetir la
// consulta por su cuenta.
export async function getCurrentCompanyId(): Promise<string> {
  const { companyId } = await getCurrentCompanyProfile();
  return companyId;
}
