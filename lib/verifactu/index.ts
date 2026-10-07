import { createClient } from "@/lib/supabase/server";
import { parseLines } from "@/lib/documents";
import { verifactiProvider } from "./verifacti";
import type { VerifactuProvider } from "./types";
import { getCompanyVerifactuKey } from "./nifs";
import { getCurrentCompanyId } from "@/lib/company";

// Proveedor de la empresa del usuario: cada negocio usa la API key de su
// propio NIF (company_secrets); en desarrollo, la de pruebas de .env.local.
// Sin clave, VeriFactu queda desactivado y las facturas en "no_enviada".
export async function getVerifactuProvider(): Promise<VerifactuProvider | null> {
  const key = await getCompanyVerifactuKey(await getCurrentCompanyId());
  return key ? verifactiProvider(key) : null;
}

// Envía una factura ya creada y guarda el resultado (estado + respuesta).
// Nunca lanza: un fallo de VeriFactu no debe impedir emitir la factura; se
// queda en estado "error" para reintentar.
export async function sendInvoiceToVerifactu(invoiceId: string) {
  const provider = await getVerifactuProvider();
  if (!provider) return;

  const supabase = createClient();
  const { data: inv } = await supabase
    .from("invoices")
    .select("series, number, issue_date, concept, lines, amount, client_snapshot, rectifies_id")
    .eq("id", invoiceId)
    .single();
  if (!inv) return;

  let rectifies = null;
  if (inv.rectifies_id) {
    const { data: orig } = await supabase
      .from("invoices")
      .select("series, number, issue_date")
      .eq("id", inv.rectifies_id)
      .single();
    if (orig) rectifies = { series: orig.series, number: orig.number, issueDate: orig.issue_date };
  }

  const result = await provider.register({
    series: inv.series,
    number: inv.number,
    issueDate: inv.issue_date,
    description: inv.concept ?? "Servicios",
    lines: parseLines(inv.lines),
    total: Number(inv.amount),
    client: { name: inv.client_snapshot?.name ?? "", taxId: inv.client_snapshot?.taxId ?? null },
    rectifies,
  });

  await supabase
    .from("invoices")
    .update({
      verifactu_status: result.ok ? (result.status ?? "pendiente") : "error",
      verifactu: {
        provider: provider.name,
        id: result.externalId ?? null,
        qr: result.qrPngBase64 ?? null,
        error: result.error ?? null,
        raw: result.raw,
      },
    })
    .eq("id", invoiceId);
}

// Actualiza las facturas que siguen "pendiente" de respuesta de Hacienda.
// Se llama al abrir Facturación (pocas filas, una consulta por factura).
export async function refreshPendingVerifactu() {
  const provider = await getVerifactuProvider();
  if (!provider) return;
  const supabase = createClient();
  const { data: pending } = await supabase
    .from("invoices")
    .select("id, verifactu")
    .eq("verifactu_status", "pendiente")
    .limit(20);

  await Promise.all(
    (pending ?? []).map(async (inv: any) => {
      if (!inv.verifactu?.id) return;
      const r = await provider.checkStatus(inv.verifactu.id).catch(() => null);
      if (!r || r.status === "pendiente") return;
      await supabase
        .from("invoices")
        .update({ verifactu_status: r.status, verifactu: { ...inv.verifactu, error: r.error ?? null, status_raw: r.raw } })
        .eq("id", inv.id);
    })
  );
}
