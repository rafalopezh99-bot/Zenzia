import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE, signEditorToken } from "@/lib/siteScript";

// El panel "Mi web" (components/SiteLiveEditor.tsx) pide aquí, con la sesión
// del usuario, un token firmado de 5 minutos para la empresa, y se lo pasa por
// postMessage al iframe de la web. Con ese token el script de la web carga el
// editor desde GET /api/site/editor. Sin sesión de un miembro de la empresa no
// hay token, y sin token no hay editor.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { companyId } = (await req.json().catch(() => ({}))) as { companyId?: string };
  if (!companyId || !UUID_RE.test(companyId)) return NextResponse.json({ error: "Empresa no válida" }, { status: 400 });

  const { data: member } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  return NextResponse.json({ token: signEditorToken(companyId) }, { headers: { "Cache-Control": "no-store" } });
}
