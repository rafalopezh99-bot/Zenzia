import { documentPdfResponse } from "@/lib/docPdf";

// Descarga en PDF (ver lib/docPdf.ts).
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return documentPdfResponse("invoices", params.id);
}
