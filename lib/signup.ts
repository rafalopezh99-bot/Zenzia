import { sendEmail, escapeHtml } from "@/lib/messaging";
import { createClient } from "@/lib/supabase/server";
import { VERTICAL_PACKS } from "@/lib/modules";
import { toPlanKey } from "@/lib/plans";

class SignupError extends Error {}
const fail = (msg: string): never => {
  throw new SignupError(msg);
};

// Alta en autoservicio: usuario (Supabase Auth) + empresa + membresía +
// módulos de su sector. La empresa y la membresía se crean con service_role
// porque el usuario recién creado aún no pertenece a ninguna empresa (RLS).
// El plan elegido se guarda como "pendiente de pago" (subscription_status
// null) y se paga en /planes al terminar el asistente inicial.
// Devuelve la ruta a la que ir después (o lanza SignupError con el mensaje).
async function doSignup(formData: FormData): Promise<string> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const business_name = String(formData.get("business_name") ?? "").trim();
  const vertical = String(formData.get("vertical") ?? "");
  const plan = toPlanKey(formData.get("plan"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!full_name || !business_name || !email) fail("Rellena todos los campos");
  if (!VERTICAL_PACKS[vertical]) fail("Elige a qué te dedicas");
  if (password.length < 8) fail("La contraseña debe tener al menos 8 caracteres");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login` },
  });
  if (error && /sending/i.test(error.message)) {
    fail("No hemos podido enviarte el email de confirmación. Inténtalo en unos minutos o contacta con soporte (WhatsApp 673 895 732).");
  }
  if (error || !data.user) fail(error?.message ?? "No se pudo crear la cuenta");
  // Email ya registrado: Supabase devuelve un usuario sin identidades.
  if (data.user!.identities?.length === 0) fail("Ese email ya tiene cuenta. Inicia sesión.");

  // Negocio + titular + módulos + aviso al admin, en la base de datos (sin service_role).
  const { error: companyError } = await supabase.rpc("create_signup_company", {
    p_user: data.user!.id,
    p_email: email,
    p_full_name: full_name,
    p_business: business_name,
    p_vertical: vertical,
    p_plan: plan,
    p_modules: VERTICAL_PACKS[vertical] ?? [],
    p_sector_other: String(formData.get("sector_other") ?? "").trim() || null,
  });
  if (companyError) fail("No se pudo crear tu negocio. Escríbenos por WhatsApp al 673 895 732.");

  // Aviso por email al admin (la notificación en Zenzia la crea la función de la base de datos).
  const planName = { start: "Start", smart: "Smart", pro: "Pro", web: "Web" }[plan];
  await sendEmail(
    process.env.ADMIN_EMAIL ?? "zenzia.co@gmail.com",
    `Nueva cuenta en Zenzia: ${business_name}`,
    `<p><b>${escapeHtml(full_name)}</b> (${escapeHtml(email)}) ha creado la cuenta <b>${escapeHtml(business_name)}</b> con el plan <b>${planName}</b> (prueba gratuita de 14 días).</p><p>Gestiónala desde Zenzia → Cuentas.</p>`
  ).catch(() => false);

  // Con confirmación de email activada no hay sesión todavía.
  return data.session ? "/onboarding" : "/registro/enviado";
}

export async function signupRedirect(formData: FormData): Promise<string> {
  try {
    return await doSignup(formData);
  } catch (e) {
    const msg = e instanceof SignupError ? e.message : "No se pudo crear la cuenta. Inténtalo de nuevo.";
    return `/registro?error=${encodeURIComponent(msg)}`;
  }
}
