import type { VerifactuInvoice, VerifactuProvider, VerifactuResult } from "./types";

// Proveedor Verifacti (https://www.verifacti.com). Probado en su entorno de
// test (07/10/2026): auth "Bearer <clave del NIF>", POST /verifactu/create
// devuelve { estado: "Pendiente", uuid, url, qr (PNG base64), huella } y
// GET /verifactu/status?uuid=... devuelve el estado final que da Hacienda.
const BASE_URL = process.env.VERIFACTI_API_URL ?? "https://api.verifacti.com";

const ddmmyyyy = (iso: string) => iso.split("-").reverse().join("-");
const money = (n: number) => n.toFixed(2);

// Estados de Verifacti: Pendiente → Correcto / Aceptado con errores / Incorrecto.
function mapEstado(estado: unknown): "pendiente" | "enviada" | "error" {
  const e = String(estado ?? "").toLowerCase();
  if (e === "pendiente") return "pendiente";
  if (e.startsWith("correcto") || e.startsWith("aceptado")) return "enviada";
  return "error";
}

export function verifactiProvider(apiKey: string): VerifactuProvider {
  return {
    name: "verifacti",
    async register(inv: VerifactuInvoice): Promise<VerifactuResult> {
      const body = {
        serie: inv.series,
        numero: String(inv.number),
        fecha_expedicion: ddmmyyyy(inv.issueDate),
        // F1 = factura completa (con NIF del cliente), F2 = simplificada,
        // R1 = rectificativa.
        tipo_factura: inv.rectifies ? "R1" : inv.client.taxId ? "F1" : "F2",
        descripcion: inv.description,
        ...(inv.client.taxId ? { nif: inv.client.taxId, nombre: inv.client.name } : {}),
        ...(inv.rectifies
          ? {
              tipo_rectificativa: "I",
              facturas_rectificadas: [
                {
                  serie: inv.rectifies.series,
                  numero: String(inv.rectifies.number),
                  fecha_expedicion: ddmmyyyy(inv.rectifies.issueDate),
                },
              ],
            }
          : {}),
        lineas: inv.lines.map((l) => {
          const base = l.qty * l.price;
          return l.vat === -1
            ? { base_imponible: money(base), operacion_exenta: "E1" }
            : { base_imponible: money(base), tipo_impositivo: String(l.vat), cuota_repercutida: money((base * l.vat) / 100) };
        }),
        importe_total: money(inv.total),
      };

      try {
        const res = await fetch(`${BASE_URL}/verifactu/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(body),
        });
        const raw = await res.json().catch(() => null);
        if (!res.ok) return { ok: false, raw, error: (raw as any)?.error ?? `HTTP ${res.status}` };
        const qr = (raw as any)?.qr ?? null;
        // El QR (base64) se guarda aparte; no se duplica en la respuesta guardada.
        const { qr: _qr, ...rest } = (raw ?? {}) as Record<string, unknown>;
        return {
          ok: true,
          status: mapEstado((raw as any)?.estado),
          externalId: (raw as any)?.uuid ?? null,
          raw: rest,
          qrPngBase64: typeof qr === "string" ? qr.replace(/^data:image\/png;base64,/, "") : null,
        };
      } catch (e) {
        return { ok: false, raw: null, error: e instanceof Error ? e.message : "Error de red" };
      }
    },

    async checkStatus(uuid: string) {
      const res = await fetch(`${BASE_URL}/verifactu/status?uuid=${encodeURIComponent(uuid)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const raw = await res.json().catch(() => null);
      return { status: mapEstado((raw as any)?.estado), error: (raw as any)?.mensaje_error ?? null, raw };
    },
  };
}
