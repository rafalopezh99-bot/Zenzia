import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderSite } from "@/lib/web-publish/render";
import { contentType, readSiteFile, safeRelPath } from "@/lib/web-publish/source";

// Vista previa / edición de la web del cliente DENTRO de Zenzia (iframe de
// «Mi web»). Solo con sesión iniciada y solo la web de la propia empresa.
//   /api/mi-web/preview/index.html         -> como quedará publicada
//   /api/mi-web/preview/index.html?edit=1  -> con el editor (public/zz/editor.js)
//   /api/mi-web/preview/fonts/...          -> resto de archivos de la plantilla
// El editor ya no está en la web pública: solo existe aquí.

export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Content-Security-Policy": "frame-ancestors 'self'",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const rel = safeRelPath((path ?? []).join("/"));
  if (!rel) return new NextResponse("No encontrado", { status: 404, headers: HEADERS });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Inicia sesión en Zenzia", { status: 401, headers: HEADERS });

  const { data: membership } = await supabase.from("company_users").select("company_id").eq("user_id", user.id).limit(1).single();
  const companyId = membership?.company_id as string | undefined;
  if (!companyId) return new NextResponse("Sin empresa", { status: 403, headers: HEADERS });

  const body = await readSiteFile(companyId, rel);
  if (!body) return new NextResponse("No encontrado", { status: 404, headers: HEADERS });

  if (rel === "index.html") {
    const { data: rows } = await supabase.from("web_texts").select("key, value").eq("company_id", companyId);
    const edit = req.nextUrl.searchParams.get("edit") === "1";
    const html = renderSite(body.toString("utf8"), rows ?? [], { mode: edit ? "edit" : "publish", inZenzia: true });
    return new NextResponse(html, { headers: { ...HEADERS, "Content-Type": "text/html; charset=utf-8" } });
  }

  return new NextResponse(new Uint8Array(body), { headers: { ...HEADERS, "Content-Type": contentType(rel) } });
}
