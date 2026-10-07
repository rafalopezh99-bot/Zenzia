import type { DocLine } from "@/lib/documents";

// Interfaz común de proveedores de VeriFactu: Zenzia solo habla con esto,
// así cambiar de proveedor (Verifacti → fiskaly...) es cambiar un archivo.
export interface VerifactuInvoice {
  series: string;
  number: number;
  issueDate: string; // YYYY-MM-DD
  description: string;
  lines: DocLine[];
  total: number;
  client: { name: string; taxId?: string | null };
  rectifies?: { series: string; number: number; issueDate: string } | null;
}

// Estado en Zenzia: "pendiente" (aceptada por el proveedor, aún sin
// respuesta de Hacienda), "enviada" (Hacienda la ha aceptado) o "error".
export type VerifactuStatus = "pendiente" | "enviada" | "error";

export interface VerifactuResult {
  ok: boolean;
  status?: VerifactuStatus;
  // Id del registro en el proveedor, para consultar su estado después.
  externalId?: string | null;
  // QR en PNG (base64, sin prefijo) para imprimir en el PDF, si el proveedor lo da.
  qrPngBase64?: string | null;
  // Respuesta completa del proveedor, se guarda tal cual en invoices.verifactu.
  raw: unknown;
  error?: string;
}

export interface VerifactuProvider {
  name: string;
  register(invoice: VerifactuInvoice): Promise<VerifactuResult>;
  checkStatus(externalId: string): Promise<{ status: VerifactuStatus; error?: string | null; raw: unknown }>;
}
