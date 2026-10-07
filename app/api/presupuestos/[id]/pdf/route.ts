import { documentPdfResponse } from "@/lib/docPdf";

// Descarga en PDF (ver lib/docPdf.ts).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return documentPdfResponse("quotes", params.id);
}
