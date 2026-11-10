import { NextRequest, NextResponse } from "next/server";
import { EDITOR_SOURCE } from "@/lib/site-editor/editorSource";
import { UUID_RE, verifyEditorToken } from "@/lib/siteScript";

// Editor en vivo de las webs de clientes. NO está en public/: solo se sirve si
// el token (firmado por /api/site/edit-token con la sesión de un miembro de la
// empresa, 5 minutos de vida) es válido para esa empresa. Lo carga
// public/zz/site.js dentro del iframe de "Mi web" de Zenzia.
export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c") ?? "";
  const t = req.nextUrl.searchParams.get("t") ?? "";
  const headers = { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (!UUID_RE.test(c) || !verifyEditorToken(t, c)) return new NextResponse("/* zz: no autorizado */", { status: 403, headers });
  return new NextResponse(EDITOR_SOURCE, { headers });
}
