import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyBillingInfo } from "@/lib/company";
import { buildBillingPdf } from "@/lib/pdf";
import { BILLING_FREQUENCY_LABEL, type BillingFrequency } from "@/lib/billing";

// Descarga de una factura en PDF, lista para enviar: datos del emisor
// (perfil del negocio) + datos de facturación del cliente (ficha del
// contacto) + el concepto/importe de la propia factura. RLS de Supabase ya
// filtra por empresa (una factura solo se puede leer si su contacto
// pertenece a la empresa del usuario logueado), así que no hace falta
// comprobarlo aquí a mano.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, concept, amount, status, created_at, contacts(full_name, phone, email, custom_fields)")
    .eq("id", params.id)
    .single();
  if (!invoice) return new NextResponse("Factura no encontrada", { status: 404 });

  const contact = Array.isArray(invoice.contacts) ? invoice.contacts[0] : invoice.contacts;
  const cf: Record<string, unknown> = (contact?.custom_fields as Record<string, unknown>) ?? {};
  const billingFrequency = cf.billing_frequency as BillingFrequency | undefined;

  const company = await getCurrentCompanyBillingInfo();
  const number = `${new Date(invoice.created_at).getFullYear()}-${invoice.id.slice(0, 8).toUpperCase()}`;

  const pdfBytes = await buildBillingPdf({
    kind: "factura",
    number,
    date: new Date(invoice.created_at),
    issuer: {
      name: company.name,
      taxId: company.taxId,
      address: company.address,
      phone: company.phone,
      email: company.email,
    },
    client: {
      name: contact?.full_name ?? "",
      taxId: (cf.tax_id as string) || null,
      address: (cf.billing_address as string) || null,
      postalCode: (cf.postal_code as string) || null,
      province: (cf.province as string) || null,
      country: (cf.country as string) || null,
      phone: contact?.phone ?? null,
      email: contact?.email ?? null,
    },
    lines: [{ concept: invoice.concept, amount: Number(invoice.amount) }],
    statusLabel: invoice.status === "pagada" ? "Pagada" : "Pendiente",
    billingFrequencyLabel: billingFrequency ? BILLING_FREQUENCY_LABEL[billingFrequency] : null,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="factura-${number}.pdf"`,
    },
  });
}
