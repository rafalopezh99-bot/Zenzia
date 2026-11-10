import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Utilidades del script que Zenzia inserta en las webs de clientes
// (public/zz/site.js) y de sus endpoints en app/api/site/.
//
// - El navegador del visitante NUNCA habla con Supabase: lee los textos con
//   GET /api/site/<id>/texts y manda las métricas (solo con consentimiento)
//   a POST /api/site/<id>/events. Ambos usan aquí el cliente service_role.
// - El editor (lib/site-editor/editorSource.ts) solo se sirve con un token
//   firmado de corta duración que pide el panel "Mi web" con la sesión del
//   usuario (POST /api/site/edit-token) y le pasa al iframe por postMessage.

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Vida del token del editor: lo justo para que el iframe cargue el editor.
const TOKEN_TTL_MS = 5 * 60 * 1000;

function secret(): string {
  const s = process.env.SITE_EDITOR_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Falta SITE_EDITOR_SECRET (o SUPABASE_SERVICE_ROLE_KEY)");
  return s;
}

const b64url = (b: Buffer) => b.toString("base64url");
const sign = (payload: string) => b64url(createHmac("sha256", secret()).update(`zz-editor.${payload}`).digest());

export function signEditorToken(companyId: string): string {
  const payload = b64url(Buffer.from(JSON.stringify({ c: companyId, e: Date.now() + TOKEN_TTL_MS })));
  return `${payload}.${sign(payload)}`;
}

export function verifyEditorToken(token: string, companyId: string): boolean {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  let expected: Buffer, given: Buffer;
  try {
    expected = Buffer.from(sign(payload));
    given = Buffer.from(sig);
  } catch {
    return false;
  }
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const { c, e } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return c === companyId && typeof e === "number" && e > Date.now();
  } catch {
    return false;
  }
}

// Web registrada de la empresa (companies.site_url), cacheada un minuto por instancia.
const siteCache = new Map<string, { url: string | null; at: number }>();
export async function companySiteUrl(companyId: string): Promise<string | null> {
  const hit = siteCache.get(companyId);
  if (hit && Date.now() - hit.at < 60_000) return hit.url;
  const { data } = await createAdminClient().from("companies").select("site_url").eq("id", companyId).maybeSingle();
  const url = (data?.site_url as string | null) ?? null;
  siteCache.set(companyId, { url, at: Date.now() });
  return url;
}

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, "");

// ¿La petición viene de la web del cliente? (o de localhost en desarrollo)
export function originMatchesSite(origin: string | null, siteUrl: string): boolean {
  if (!origin) return true; // sendBeacon antiguo / navegadores que no la mandan: lo frena el límite de peticiones
  try {
    const o = new URL(origin);
    if (process.env.NODE_ENV !== "production" && /^(localhost|127\.0\.0\.1)$/.test(o.hostname)) return true;
    return bareHost(o.hostname) === bareHost(new URL(siteUrl).hostname);
  } catch {
    return false;
  }
}

// Límite de peticiones por IP en memoria (por instancia; el límite fuerte por
// empresa lo pone la base de datos en record_web_event).
const hits = new Map<string, { n: number; at: number }>();
export function rateLimited(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.at > windowMs) hits.delete(k);
  const h = hits.get(key);
  if (!h || now - h.at > windowMs) {
    hits.set(key, { n: 1, at: now });
    return false;
  }
  h.n++;
  return h.n > max;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
