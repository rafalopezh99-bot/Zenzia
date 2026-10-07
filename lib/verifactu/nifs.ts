import { createAdminClient } from "@/lib/supabase/admin";

// Alta del NIF de cada negocio en Verifacti (API de gestión de NIFs, clave
// "vfn_..." de la cuenta de Zenzia en VERIFACTI_ACCOUNT_KEY) y guardado de
// la API key de ese NIF en company_secrets. PENDIENTE de probar: la API de
// NIFs solo se activa con la suscripción de pago de Verifacti.
const BASE_URL = process.env.VERIFACTI_API_URL ?? "https://api.verifacti.com";
const ENV = process.env.VERIFACTI_ENV ?? "test"; // "test" | "produccion"

async function call(path: string, init: RequestInit = {}) {
  const key = process.env.VERIFACTI_ACCOUNT_KEY;
  if (!key) throw new Error("Falta VERIFACTI_ACCOUNT_KEY");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body: body as any };
}

// Da de alta el NIF (si no existe ya) y guarda su API key. Nunca lanza: el
// resultado se guarda en companies.verifactu_state para enseñarlo en Perfil.
export async function ensureVerifactuNif(companyId: string, nif: string, name: string) {
  if (!process.env.VERIFACTI_ACCOUNT_KEY || !nif) return;
  const db = createAdminClient();
  const clean = nif.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const { data: secret } = await db.from("company_secrets").select("verifactu_nif").eq("company_id", companyId).maybeSingle();
  if (secret?.verifactu_nif === clean) return;

  let state: Record<string, unknown> = { nif: clean, env: ENV };
  try {
    const created = await call("/nifs", { method: "POST", body: JSON.stringify({ nif: clean, nombre: name, entorno: ENV }) });
    if (!created.ok && created.status !== 409) throw new Error(created.body?.message ?? `Alta NIF: HTTP ${created.status}`);
    const key = await call(`/nifs/keys/${ENV}/${clean}`);
    const apiKey = key.body?.api_key ?? key.body?.key ?? null;
    if (!apiKey) throw new Error("Verifacti no devolvió la API key del NIF");
    await db.from("company_secrets").upsert({
      company_id: companyId,
      verifactu_nif: clean,
      verifactu_env: ENV,
      verifactu_api_key: apiKey,
      updated_at: new Date().toISOString(),
    });
    state = { ...state, registered: true };
  } catch (e) {
    state = { ...state, registered: false, error: e instanceof Error ? e.message : "Error" };
  }
  await db.from("companies").update({ verifactu_state: state }).eq("id", companyId);
}

// Inicia la firma remota de la representación (el autónomo autoriza a
// Verifacti a enviar sus facturas a Hacienda). Devuelve la URL de firma si
// la API la da.
export async function startRepresentation(nif: string): Promise<{ url: string | null; error?: string }> {
  const r = await call(`/representacion/firma_remota/${nif}`, { method: "POST" }).catch(() => null);
  if (!r?.ok) return { url: null, error: r?.body?.message ?? "No se pudo iniciar la firma" };
  return { url: r.body?.url ?? r.body?.enlace ?? null };
}

// API key del NIF de una empresa (o la de pruebas de .env.local si no tiene).
export async function getCompanyVerifactuKey(companyId: string): Promise<string | null> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createAdminClient();
    const { data } = await db.from("company_secrets").select("verifactu_api_key").eq("company_id", companyId).maybeSingle();
    if (data?.verifactu_api_key) return data.verifactu_api_key;
  }
  return process.env.VERIFACTI_API_KEY ?? null;
}
