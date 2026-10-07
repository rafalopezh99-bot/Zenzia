import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyBillingInfo } from "@/lib/company";
import { buildBillingPdf, type PartyInfo } from "@/lib/pdf";
import { parseLines, type DocKind } from "@/lib/documents";

// Respuesta PDF compartida por /api/facturas/[id]/pdf y
// /api/presupuestos/[id]/pdf (presupuestos y proformas). RLS ya limita la
// lectura a documentos de la empresa del usuario.
export async function documentPdfResponse(table: "invoices" | "quotes", id: string) {
  const supabase = createClient();
  const { data: doc } = await supabase
    .from(table)
    .select("*, contacts(full_name, phone, email, custom_fields)")
    .eq("id", id)
    .single();
  if (!doc) return new NextResponse("Documento no encontrado", { status: 404 });

  const kind: DocKind = table === "invoices" ? "factura" : doc.kind === "proforma" ? "proforma" : "presupuesto";
  const company = await getCurrentCompanyBillingInfo();

  // Documentos emitidos con la versión nueva llevan la copia de emisor y
  // cliente; los antiguos se rellenan con los datos actuales.
  const contact = Array.isArray(doc.contacts) ? doc.contacts[0] : doc.contacts;
  const cf = (contact?.custom_fields ?? {}) as Record<string, string>;
  const client: PartyInfo = doc.client_snapshot ?? {
    name: contact?.full_name ?? "",
    taxId: cf.tax_id || null,
    address: cf.billing_address || null,
    postalCode: cf.postal_code || null,
    province: cf.province || null,
    phone: contact?.phone ?? null,
    email: contact?.email ?? null,
  };
  const issuer: PartyInfo = doc.issuer_snapshot ?? company;

  let lines = parseLines(doc.lines);
  if (!lines.length) lines = [{ concept: doc.concept ?? doc.title ?? "Servicio", qty: 1, price: Number(doc.amount) || 0, vat: 0 }];

  const number = doc.doc_number ?? `${new Date(doc.created_at).getFullYear()}-${String(doc.id).slice(0, 8).toUpperCase()}`;
  const bytes = await buildBillingPdf({
    kind,
    number,
    date: new Date(doc.issue_date ?? doc.created_at),
    issuer,
    client,
    lines,
    irpfRate: Number(doc.irpf_rate) || 0,
    notes: doc.notes,
    statusLabel:
      kind === "factura"
        ? doc.status === "anulada"
          ? "Anulada"
          : doc.rectifies_id
            ? "Factura rectificativa"
            : doc.status === "pagada"
              ? "Pagada"
              : "Pendiente de pago"
        : null,
    logoUrl: company.logoUrl,
    verifactuQr: doc.verifactu?.qr ?? null,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${kind}-${number}.pdf"`,
    },
  });
}
