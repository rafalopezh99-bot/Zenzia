import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE, clientIp, companySiteUrl, rateLimited } from "@/lib/siteScript";

// Textos guardados desde "Mi web" (tabla web_texts) para el script público
// de las webs de clientes (public/zz/site.js). Solo lectura y cacheado: el
// navegador del visitante no habla con Supabase. Solo responde para empresas
// con web registrada (companies.site_url); el rol anon ya no puede leer
// web_texts (ver migración 2026-11-10-web-site-script-hardening.sql).
//
// ?fresh=1 (lo usa el script dentro del iframe de "Mi web", para ver al
// momento lo recién guardado) se salta la caché, con límite por IP.

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };
const memo = new Map<string, { body: Record<string, string>; at: number }>();
const TTL = 30_000;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  if (!UUID_RE.test(companyId)) return NextResponse.json({}, { status: 404, headers: CORS });

  const fresh = req.nextUrl.searchParams.has("fresh");
  if (fresh && rateLimited(`texts:${clientIp(req)}`, 60)) return NextResponse.json({}, { status: 429, headers: CORS });

  const cached = memo.get(companyId);
  let body: Record<string, string>;
  if (!fresh && cached && Date.now() - cached.at < TTL) {
    body = cached.body;
  } else {
    if (!(await companySiteUrl(companyId))) return NextResponse.json({}, { status: 404, headers: CORS });
    const { data, error } = await createAdminClient().from("web_texts").select("key, value").eq("company_id", companyId).limit(5000);
    if (error) return NextResponse.json({}, { status: 500, headers: { ...CORS, "Cache-Control": "no-store" } });
    body = Object.fromEntries((data ?? []).map((r) => [r.key as string, r.value as string]));
    memo.set(companyId, { body, at: Date.now() });
  }

  return NextResponse.json(body, {
    headers: {
      ...CORS,
      "Cache-Control": fresh ? "no-store" : "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
