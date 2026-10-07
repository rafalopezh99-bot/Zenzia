import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pdfResponse } from "@/lib/docPdf";

// PDF de una factura desde el portal del cliente (Pro), sin sesión: la
// función public_portal_invoice solo la devuelve si es de ese cliente.
export async function GET(_req: Request, props: { params: Promise<{ token: string; id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: doc } = await supabase.rpc("public_portal_invoice", { p_token: params.token, p_invoice: params.id });
  if (!doc) return new NextResponse("Factura no encontrada", { status: 404 });
  const logoUrl = doc.company_logo_path
    ? supabase.storage.from("logos").getPublicUrl(doc.company_logo_path).data.publicUrl
    : null;
  return pdfResponse(doc, "factura", { name: "" }, logoUrl);
}
