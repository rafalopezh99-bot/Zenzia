import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

// Generador de PDF para facturas y presupuestos: un documento simple de una
// página (emisor, cliente, concepto/importe, total) que se puede descargar
// directo desde la fila de /facturacion o /presupuestos y enviar tal cual
// al cliente. No sustituye un sistema de facturación electrónica legal
// (no lleva numeración correlativa oficial ni desglose de IVA) — es la
// versión rápida de "necesito mandarle esto a mi cliente ya".

export interface PartyInfo {
  name: string;
  taxId?: string | null;
  address?: string | null;
  postalCode?: string | null;
  province?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface DocumentLine {
  concept: string;
  amount: number;
}

export interface BillingDocInput {
  kind: "factura" | "presupuesto";
  number: string;
  date: Date;
  issuer: PartyInfo;
  client: PartyInfo;
  lines: DocumentLine[];
  statusLabel?: string | null;
  billingFrequencyLabel?: string | null;
}

function formatEuro(n: number): string {
  return `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function partyLines(p: PartyInfo): string[] {
  const lines: string[] = [p.name];
  if (p.taxId) lines.push(p.taxId);
  if (p.address) lines.push(p.address);
  const cityLine = [p.postalCode, p.province].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (p.country) lines.push(p.country);
  if (p.phone) lines.push(p.phone);
  if (p.email) lines.push(p.email);
  return lines;
}

export async function buildBillingPdf(input: BillingDocInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const width = page.getWidth();

  const ink = rgb(0.06, 0.07, 0.07);
  const slate = rgb(0.36, 0.42, 0.39);
  const lineColor = rgb(0.84, 0.87, 0.85);
  const brand = rgb(0.17, 0.42, 0.51);

  const draw = (
    page_: PDFPage,
    text: string,
    x: number,
    y: number,
    opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {}
  ) => {
    page_.drawText(text, {
      x,
      y,
      size: opts.size ?? 10,
      font: opts.font ?? font,
      color: opts.color ?? ink,
    });
  };

  let y = page.getHeight() - margin;

  // Cabecera: título del documento + número + fecha, a la derecha.
  const title = input.kind === "factura" ? "FACTURA" : "PRESUPUESTO";
  draw(page, title, width - margin - bold.widthOfTextAtSize(title, 20), y, { size: 20, font: bold, color: brand });
  y -= 20;
  const numberLine = `Nº ${input.number}`;
  draw(page, numberLine, width - margin - font.widthOfTextAtSize(numberLine, 10), y, { size: 10, color: slate });
  y -= 14;
  const dateLine = input.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" });
  draw(page, dateLine, width - margin - font.widthOfTextAtSize(dateLine, 10), y, { size: 10, color: slate });

  // Emisor, arriba a la izquierda (misma altura que la cabecera).
  let leftY = page.getHeight() - margin;
  draw(page, "De", margin, leftY, { size: 9, font: bold, color: slate });
  leftY -= 14;
  partyLines(input.issuer).forEach((l, i) => {
    draw(page, l, margin, leftY, { size: i === 0 ? 12 : 10, font: i === 0 ? bold : font, color: i === 0 ? ink : slate });
    leftY -= i === 0 ? 16 : 13;
  });

  y = Math.min(y - 30, leftY - 20);

  // Cliente
  draw(page, "Para", margin, y, { size: 9, font: bold, color: slate });
  y -= 14;
  partyLines(input.client).forEach((l, i) => {
    draw(page, l, margin, y, { size: i === 0 ? 12 : 10, font: i === 0 ? bold : font, color: i === 0 ? ink : slate });
    y -= i === 0 ? 16 : 13;
  });

  y -= 20;

  // Tabla de conceptos
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: lineColor });
  y -= 16;
  draw(page, "Concepto", margin, y, { size: 9, font: bold, color: slate });
  draw(page, "Importe", width - margin - 60, y, { size: 9, font: bold, color: slate });
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: lineColor });
  y -= 18;

  let total = 0;
  for (const l of input.lines) {
    draw(page, l.concept, margin, y, { size: 10 });
    const amountText = formatEuro(l.amount);
    draw(page, amountText, width - margin - font.widthOfTextAtSize(amountText, 10), y, { size: 10 });
    total += l.amount;
    y -= 18;
  }

  y -= 4;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: lineColor });
  y -= 20;

  draw(page, "Total", width - margin - 140, y, { size: 12, font: bold });
  const totalText = formatEuro(total);
  draw(page, totalText, width - margin - bold.widthOfTextAtSize(totalText, 14), y, { size: 14, font: bold, color: brand });

  if (input.billingFrequencyLabel) {
    y -= 30;
    draw(page, `Facturación: ${input.billingFrequencyLabel}`, margin, y, { size: 9, color: slate });
  }
  if (input.statusLabel) {
    y -= 16;
    draw(page, `Estado: ${input.statusLabel}`, margin, y, { size: 9, color: slate });
  }

  draw(page, "Generado con Zenzia CRM", margin, margin - 10, { size: 8, color: slate });

  return pdf.save();
}
