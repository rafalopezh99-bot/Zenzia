import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Estadísticas de las webs de clientes (visitas y clics), SOLO con
// consentimiento: la web las manda desde su aviso de cookies (p. ej.
// web-sites/<id>/cookies.js) únicamente si el visitante acepta las cookies de
// estadística. Sustituye al envío directo a Supabase que hacía site.js.
//
// - La web nunca habla con Supabase: manda un navigator.sendBeacon aquí.
// - Solo se aceptan eventos de una empresa con web (companies.site_url) y
//   desde el dominio de esa web (cabecera Origin).
// - Se guarda en web_events con la clave de servicio (anon no puede insertar).
// - Los eventos de más de 2 años se borran (lo dice la política de privacidad).

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RETENTION_DAYS = 730;

// Límite sencillo por IP (por instancia de la función): frena abusos obvios.
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n++;
  return h.n > 60;
}

// Cache corto de los dominios de cada empresa (evita una consulta por evento).
const sites = new Map<string, { origins: string[]; t: number }>();
async function allowedOrigins(companyId: string) {
  const c = sites.get(companyId);
  if (c && Date.now() - c.t < 10 * 60_000) return c.origins;
  const { data } = await createAdminClient().from("companies").select("site_url").eq("id", companyId).maybeSingle();
  const origins: string[] = [];
  if (data?.site_url) {
    try {
      const u = new URL(data.site_url);
      const bare = u.hostname.replace(/^www\./, "");
      origins.push(`${u.protocol}//${bare}`, `${u.protocol}//www.${bare}`);
    } catch {}
  }
  sites.set(companyId, { origins, t: Date.now() });
  return origins;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);

export async function POST(req: NextRequest) {
  const ok = new NextResponse(null, { status: 204 });
  try {
    const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "?";
    if (rateLimited(ip)) return ok;

    // sendBeacon manda text/plain (sin preflight CORS); el cuerpo es JSON.
    const raw = await req.text();
    if (raw.length > 4000) return ok;
    const b = JSON.parse(raw) as Record<string, unknown>;

    const companyId = str(b.site, 40);
    const type = b.type === "view" || b.type === "click" ? b.type : null;
    if (!companyId || !UUID.test(companyId) || !type) return ok;

    const origin = req.headers.get("origin") ?? "";
    if (!(await allowedOrigins(companyId)).includes(origin)) return ok;

    const admin = createAdminClient();
    await admin.from("web_events").insert({
      company_id: companyId,
      type,
      path: str(b.path, 250),
      referrer: str(b.referrer, 400),
      device: b.device === "movil" ? "movil" : "ordenador",
      session_id: str(b.vid, 40),
      label: type === "click" ? str(b.label, 80) : null,
      href: type === "click" ? str(b.href, 450) : null,
    });

    // Limpieza de vez en cuando (≈1 de cada 200 eventos): fuera lo de más de 2 años.
    if (Math.random() < 0.005) {
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();
      await admin.from("web_events").delete().lt("created_at", cutoff);
    }
  } catch (e) {
    console.error("web-events", e);
  }
  return ok;
}
