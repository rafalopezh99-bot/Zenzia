// Tipos y cálculos compartidos de facturas, presupuestos y proformas.

export type DocKind = "factura" | "presupuesto" | "proforma";

export const DOC_LABEL: Record<DocKind, string> = {
  factura: "Factura",
  presupuesto: "Presupuesto",
  proforma: "Proforma",
};

// IVA por línea. -1 = exento (p. ej. psicología, fisioterapia: art. 20 LIVA).
export const VAT_OPTIONS = [
  { value: 21, label: "21 %" },
  { value: 10, label: "10 %" },
  { value: 4, label: "4 %" },
  { value: 0, label: "0 %" },
  { value: -1, label: "Exento" },
];

export const IRPF_OPTIONS = [0, 7, 15];

export const VAT_EXEMPT_NOTE =
  "Operación exenta de IVA conforme al art. 20.Uno.3º de la Ley 37/1992 del IVA.";

export interface DocLine {
  concept: string;
  qty: number;
  price: number;
  vat: number;
}

export function computeTotals(lines: DocLine[], irpfRate: number) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const vatTotal = lines.reduce((s, l) => s + (l.vat > 0 ? (l.qty * l.price * l.vat) / 100 : 0), 0);
  const irpfAmount = (subtotal * irpfRate) / 100;
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    subtotal: round(subtotal),
    vatTotal: round(vatTotal),
    irpfAmount: round(irpfAmount),
    total: round(subtotal + vatTotal - irpfAmount),
  };
}

export function hasExemptLine(lines: DocLine[]) {
  return lines.some((l) => l.vat === -1);
}

export function parseLines(raw: unknown): DocLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l: any) => ({
      concept: String(l?.concept ?? "").trim(),
      qty: Number(l?.qty) || 0,
      price: Number(l?.price) || 0,
      vat: Number.isFinite(Number(l?.vat)) ? Number(l.vat) : 21,
    }))
    .filter((l) => l.concept && l.qty > 0);
}
