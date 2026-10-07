"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCompanyBillingInfo, getCurrentCompanyProfile } from "@/lib/company";
import { assertWithinLimit } from "@/lib/plans";
import { computeTotals, parseLines, type DocKind, type DocLine } from "@/lib/documents";
import { sendInvoiceToVerifactu } from "@/lib/verifactu";

// Copia de los datos del emisor y del cliente en el momento de emitir: el
// PDF sale siempre igual aunque luego se edite el perfil o la ficha.
async function snapshots(contactId: string) {
  const supabase = createClient();
  const [issuer, { data: contact }] = await Promise.all([
    getCurrentCompanyBillingInfo(),
    supabase.from("contacts").select("full_name, phone, email, custom_fields").eq("id", contactId).single(),
  ]);
  if (!contact) throw new Error("Cliente no encontrado");
  const cf = (contact.custom_fields ?? {}) as Record<string, string>;
  return {
    issuer_snapshot: issuer,
    client_snapshot: {
      name: contact.full_name,
      taxId: cf.tax_id || null,
      address: cf.billing_address || null,
      postalCode: cf.postal_code || null,
      province: cf.province || null,
      phone: contact.phone,
      email: contact.email,
    },
  };
}

function docFields(lines: DocLine[], irpfRate: number) {
  const t = computeTotals(lines, irpfRate);
  return {
    lines,
    subtotal: t.subtotal,
    vat_total: t.vatTotal,
    irpf_rate: irpfRate,
    irpf_amount: t.irpfAmount,
    amount: t.total,
  };
}

const TAB: Record<DocKind, string> = { factura: "facturas", presupuesto: "presupuestos", proforma: "proformas" };

async function insertDocument(
  kind: DocKind,
  contactId: string,
  lines: DocLine[],
  irpfRate: number,
  extra: { issue_date?: string; notes?: string | null; from_quote_id?: string | null; rectifies_id?: string }
) {
  const { plan } = await getCurrentCompanyProfile();
  // Las rectificativas (anulaciones) no cuentan para el límite del plan.
  if (!extra.rectifies_id) {
    await assertWithinLimit(plan, kind === "factura" ? "invoices" : kind === "proforma" ? "proformas" : "quotes");
  }
  if (!lines.length) throw new Error("Añade al menos una línea");

  const supabase = createClient();
  const summary = lines.length > 1 ? `${lines[0].concept} (+${lines.length - 1})` : lines[0].concept;
  const base = {
    contact_id: contactId,
    ...docFields(lines, irpfRate),
    ...(await snapshots(contactId)),
    ...(extra.issue_date ? { issue_date: extra.issue_date } : {}),
    notes: extra.notes ?? null,
    from_quote_id: extra.from_quote_id ?? null,
  };

  if (kind !== "factura") {
    const { error } = await supabase.from("quotes").insert({ ...base, kind, title: summary });
    if (error) throw new Error(error.message);
    return;
  }

  const { data: inv, error } = await supabase
    .from("invoices")
    .insert({ ...base, concept: summary, ...(extra.rectifies_id ? { rectifies_id: extra.rectifies_id } : {}) })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  // Las facturas se envían a VeriFactu al emitirse (si está configurado).
  await sendInvoiceToVerifactu(inv.id);
}

export async function createDocument(formData: FormData) {
  const kind = String(formData.get("kind") ?? "") as DocKind;
  if (!["factura", "presupuesto", "proforma"].includes(kind)) throw new Error("Tipo de documento no válido");
  const contactId = String(formData.get("contact_id") ?? "");
  if (!contactId) throw new Error("Elige un cliente");

  let lines: DocLine[] = [];
  try {
    lines = parseLines(JSON.parse(String(formData.get("lines") ?? "[]")));
  } catch {
    throw new Error("Líneas no válidas");
  }

  await insertDocument(kind, contactId, lines, Number(formData.get("irpf_rate") ?? 0) || 0, {
    issue_date: String(formData.get("issue_date") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  revalidatePath("/facturacion");
  revalidatePath("/dashboard");
  redirect(`/facturacion?tab=${TAB[kind]}`);
}

// Presupuesto → proforma, o presupuesto/proforma → factura, con un clic.
// El original queda marcado como aceptado.
export async function convertQuote(quoteId: string, to: "proforma" | "factura") {
  const supabase = createClient();
  const { data: q } = await supabase
    .from("quotes")
    .select("contact_id, lines, irpf_rate, notes, title, amount")
    .eq("id", quoteId)
    .single();
  if (!q) throw new Error("Documento no encontrado");

  // Presupuestos antiguos sin líneas: se convierte su título/importe en una línea.
  let lines = parseLines(q.lines);
  if (!lines.length) lines = [{ concept: q.title ?? "Servicio", qty: 1, price: Number(q.amount) || 0, vat: 0 }];

  await insertDocument(to, q.contact_id, lines, Number(q.irpf_rate) || 0, {
    notes: q.notes,
    from_quote_id: quoteId,
  });
  await supabase.from("quotes").update({ status: "aceptado" }).eq("id", quoteId);

  revalidatePath("/facturacion");
  revalidatePath("/dashboard");
  redirect(`/facturacion?tab=${TAB[to]}`);
}

export async function deleteQuote(quoteId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
  if (error) throw new Error(error.message);
  revalidatePath("/facturacion");
  revalidatePath("/dashboard");
}

// Anular una factura ya emitida: no se borra (VeriFactu no lo permite), se
// emite una rectificativa (serie R) con los mismos importes en negativo.
export async function annulInvoice(invoiceId: string) {
  const supabase = createClient();
  const { data: inv } = await supabase
    .from("invoices")
    .select("contact_id, lines, irpf_rate, doc_number, status")
    .eq("id", invoiceId)
    .single();
  if (!inv) throw new Error("Factura no encontrada");
  if (inv.status === "anulada") throw new Error("La factura ya está anulada");

  const lines = parseLines(inv.lines).map((l) => ({ ...l, price: -l.price }));
  await insertDocument("factura", inv.contact_id, lines, Number(inv.irpf_rate) || 0, {
    notes: `Rectifica y anula la factura ${inv.doc_number}.`,
    rectifies_id: invoiceId,
  });
  await supabase.from("invoices").update({ status: "anulada" }).eq("id", invoiceId);

  revalidatePath("/facturacion");
  revalidatePath("/dashboard");
}

export async function retryVerifactu(invoiceId: string) {
  await sendInvoiceToVerifactu(invoiceId);
  revalidatePath("/facturacion");
}
