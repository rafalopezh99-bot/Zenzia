import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE, clientIp, companySiteUrl, originMatchesSite, rateLimited } from "@/lib/siteScript";

// Métricas de la web del cliente (visitas y clics). Las manda public/zz/site.js
// SOLO cuando la web del cliente ha llamado a window.zzConsent(true) (banner de
// cookies). El navegador no habla con Supabase: aquí se valida, se recorta y
// se inserta con la función record_web_event, que además pone un límite de
// eventos por empresa y minuto. El rol anon ya no puede insertar en web_events.
//
// Llega con navigator.sendBeacon (text/plain, sin preflight CORS).

const str = (v: unknown, max: number) => (typeof v === "string" && v ? v.slice(0, max) : null);

export async function POST(req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const ok = new NextResponse(null, { status: 204 });
  if (!UUID_RE.test(companyId)) return ok;
  if (rateLimited(`ev:${clientIp(req)}`, 30)) return new NextResponse(null, { status: 429 });

  const siteUrl = await companySiteUrl(companyId);
  if (!siteUrl || !originMatchesSite(req.headers.get("origin"), siteUrl)) return ok;

  let b: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 4000) return ok;
    b = JSON.parse(raw);
  } catch {
    return ok;
  }
  if (b.type !== "view" && b.type !== "click") return ok;

  await createAdminClient().rpc("record_web_event", {
    p_company: companyId,
    p_type: b.type,
    p_label: str(b.label, 190),
    p_href: str(b.href, 490),
    p_path: str(b.path, 290),
    p_referrer: str(b.referrer, 490),
    p_device: b.device === "movil" ? "movil" : "ordenador",
    p_session: str(b.session_id, 40),
  });
  return ok;
}
