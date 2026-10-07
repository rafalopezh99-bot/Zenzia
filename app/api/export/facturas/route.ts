import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

// Facturas de un trimestre en CSV (Excel) para el gestor: modelos 303/130.
// ?year=2026&q=3. RLS limita a la empresa del usuario.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
  const q = Math.min(4, Math.max(1, Number(url.searchParams.get("q")) || 1));
  const from = `${year}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01`;
  const to = q === 4 ? `${year + 1}-01-01` : `${year}-${String(q * 3 + 1).padStart(2, "0")}-01`;

  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("doc_number, issue_date, client_snapshot, subtotal, vat_total, irpf_rate, irpf_amount, amount, status, payment_method, contacts(full_name, custom_fields)")
    .gte("issue_date", from)
    .lt("issue_date", to)
    .order("doc_number");

  const n = (v: unknown) => (v === null || v === undefined ? "" : Number(v).toFixed(2).replace(".", ","));
  const rows: (string | number | null)[][] = [
    ["Número", "Fecha", "Cliente", "NIF cliente", "Base imponible", "IVA", "IRPF %", "Retención IRPF", "Total", "Estado", "Forma de pago"],
  ];
  for (const i of (data ?? []) as any[]) {
    const contact = Array.isArray(i.contacts) ? i.contacts[0] : i.contacts;
    rows.push([
      i.doc_number,
      i.issue_date,
      i.client_snapshot?.name ?? contact?.full_name ?? "",
      i.client_snapshot?.taxId ?? contact?.custom_fields?.tax_id ?? "",
      n(i.subtotal ?? i.amount),
      n(i.vat_total ?? 0),
      i.irpf_rate ?? 0,
      n(i.irpf_amount ?? 0),
      n(i.amount),
      i.status,
      i.payment_method ?? "",
    ]);
  }
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="facturas-${year}-T${q}.csv"`,
    },
  });
}
