import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Derecho de acceso / portabilidad (RGPD): todos los datos de un paciente en JSON.
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const [contact, appointments, activities, invoices, quotes, packages, consents] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).single(),
    supabase.from("appointments").select("starts_at, ends_at, status, notes, price, paid_method").eq("contact_id", id),
    supabase.from("activities").select("type, content, custom_fields, created_at").eq("contact_id", id),
    supabase.from("invoices").select("doc_number, issue_date, lines, amount, status").eq("contact_id", id),
    supabase.from("quotes").select("doc_number, kind, issue_date, lines, amount, status").eq("contact_id", id),
    supabase.from("packages").select("name, total_sessions, used_sessions, created_at").eq("contact_id", id),
    supabase.from("consents").select("title, signed, signed_at, signer_name").eq("contact_id", id),
  ]);
  if (!contact.data) return new NextResponse("No encontrado", { status: 404 });
  const { portal_token: _t, ...datos } = contact.data as any;
  const body = {
    exportado: new Date().toISOString(),
    paciente: datos,
    citas: appointments.data,
    notas_y_seguimiento: activities.data,
    facturas: invoices.data,
    presupuestos: quotes.data,
    bonos: packages.data,
    consentimientos: consents.data,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="datos-${datos.full_name?.replace(/\W+/g, "-") ?? id}.json"`,
    },
  });
}
