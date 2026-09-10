import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyBillingInfo } from "@/lib/company";
import { buildBillingPdf } from "@/lib/pdf";
import { BILLING_FREQUENCY_LABEL, type BillingFrequency } from "@/lib/billing";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  completado: "Completado",
};

// Descarga de un presupuesto en PDF, mismo criterio que /api/facturas/[id]/pdf.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, title, amount, status, created_at, contacts(full_name, phone, email, custom_fields)")
    .eq("id", params.id)
    .single();
  if (!quote) return new NextResponse("Presupuesto no encontrado", { status: 404 });

  const contact = Array.isArray(quote.contacts) ? quote.contacts[0] : quote.contacts;
  const cf: Record<string, unknown> = (contact?.custom_fields as Record<string, unknown>) ?? {};
  const billingFrequency = cf.billing_frequency as BillingFrequency | undefined;

  const company = await getCurrentCompanyBillingInfo();
  const number = `${new Date(quote.created_at).getFullYear()}-${quote.id.slice(0, 8).toUpperCase()}`;

  const pdfBytes = await buildBillingPdf({
    kind: "presupuesto",
    number,
    date: new Date(quote.created_at),
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
    lines: [{ concept: quote.title, amount: Number(quote.amount) }],
    statusLabel: STATUS_LABEL[quote.status] ?? quote.status,
    billingFrequencyLabel: billingFrequency ? BILLING_FREQUENCY_LABEL[billingFrequency] : null,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="presupuesto-${number}.pdf"`,
    },
  });
}
