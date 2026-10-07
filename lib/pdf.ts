import { PDFDocument, PDFFont, PDFImage, StandardFonts, rgb } from "pdf-lib";
import { computeTotals, hasExemptLine, VAT_EXEMPT_NOTE, DOC_LABEL, type DocKind, type DocLine } from "@/lib/documents";

// PDF de facturas, presupuestos y proformas: logo y datos fiscales del
// negocio, datos del cliente, líneas con IVA, retención de IRPF y totales.
// Una página A4; si hay muchas líneas se añaden páginas.

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

export interface BillingDocInput {
  kind: DocKind;
  number: string;
  date: Date;
  issuer: PartyInfo;
  client: PartyInfo;
  lines: DocLine[];
  irpfRate: number;
  notes?: string | null;
  statusLabel?: string | null;
  logoUrl?: string | null;
}

const euro = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function partyLines(p: PartyInfo): string[] {
  const lines: string[] = [p.name];
  if (p.taxId) lines.push(`NIF: ${p.taxId}`);
  if (p.address) lines.push(p.address);
  const cityLine = [p.postalCode, p.province].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (p.phone) lines.push(p.phone);
  if (p.email) lines.push(p.email);
  return lines;
}

// Logo del negocio (bucket público "logos"). pdf-lib solo admite PNG y JPG:
// cualquier otro formato o fallo de red simplemente deja el PDF sin logo.
async function loadLogo(pdf: PDFDocument, url?: string | null): Promise<PDFImage | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await pdf.embedPng(bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await pdf.embedJpg(bytes);
  } catch {}
  return null;
}

// Corta un texto en varias líneas para que quepa en un ancho dado.
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

export async function buildBillingPdf(input: BillingDocInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(pdf, input.logoUrl);

  const W = 595.28;
  const H = 841.89;
  const M = 50;
  const ink = rgb(0.06, 0.12, 0.2);
  const slate = rgb(0.36, 0.42, 0.5);
  const lineColor = rgb(0.86, 0.89, 0.93);
  const brand = rgb(0.086, 0.243, 0.431); // navy Zenzia

  let page = pdf.addPage([W, H]);
  const text = (t: string, x: number, y: number, size = 10, f: PDFFont = font, color = ink) =>
    page.drawText(t, { x, y, size, font: f, color });
  const right = (t: string, xRight: number, y: number, size = 10, f: PDFFont = font, color = ink) =>
    text(t, xRight - f.widthOfTextAtSize(t, size), y, size, f, color);

  // Cabecera: logo (o nombre) a la izquierda; tipo, número y fecha a la derecha.
  let y = H - M;
  if (logo) {
    const s = Math.min(140 / logo.width, 50 / logo.height);
    page.drawImage(logo, { x: M, y: y - logo.height * s + 10, width: logo.width * s, height: logo.height * s });
  }
  right(DOC_LABEL[input.kind].toUpperCase(), W - M, y - 8, 20, bold, brand);
  right(`Nº ${input.number}`, W - M, y - 26, 10, font, slate);
  right(`Fecha: ${input.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}`, W - M, y - 40, 10, font, slate);

  // Emisor y cliente en dos columnas.
  y -= 80;
  const colW = (W - 2 * M) / 2;
  const party = (label: string, p: PartyInfo, x: number) => {
    let yy = y;
    text(label, x, yy, 8, bold, slate);
    yy -= 14;
    partyLines(p).forEach((l, i) => {
      text(l, x, yy, i === 0 ? 11 : 9, i === 0 ? bold : font, i === 0 ? ink : slate);
      yy -= i === 0 ? 15 : 12;
    });
    return yy;
  };
  y = Math.min(party("EMISOR", input.issuer, M), party("CLIENTE", input.client, M + colW)) - 20;

  // Tabla de líneas.
  const cols = { concept: M, qty: W - M - 230, price: W - M - 170, vat: W - M - 95, total: W - M };
  const header = () => {
    page.drawRectangle({ x: M, y: y - 6, width: W - 2 * M, height: 20, color: rgb(0.95, 0.97, 0.99) });
    text("CONCEPTO", cols.concept + 6, y, 8, bold, slate);
    right("CANT.", cols.qty + 30, y, 8, bold, slate);
    right("PRECIO", cols.price + 55, y, 8, bold, slate);
    right("IVA", cols.vat + 40, y, 8, bold, slate);
    right("IMPORTE", cols.total - 6, y, 8, bold, slate);
    y -= 24;
  };
  header();

  for (const l of input.lines) {
    const conceptLines = wrap(l.concept, font, 10, cols.qty - cols.concept - 20);
    if (y - conceptLines.length * 13 < M + 160) {
      page = pdf.addPage([W, H]);
      y = H - M;
      header();
    }
    conceptLines.forEach((c, i) => text(c, cols.concept + 6, y - i * 13));
    right(String(l.qty), cols.qty + 30, y);
    right(euro(l.price), cols.price + 55, y);
    right(l.vat === -1 ? "Exento" : `${l.vat} %`, cols.vat + 40, y);
    right(euro(l.qty * l.price), cols.total - 6, y);
    y -= conceptLines.length * 13 + 8;
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: W - M, y: y + 4 }, thickness: 0.5, color: lineColor });
  }

  // Totales.
  const t = computeTotals(input.lines, input.irpfRate);
  y -= 14;
  const totalRow = (label: string, value: string, strong = false) => {
    right(label, W - M - 110, y, strong ? 12 : 10, strong ? bold : font, strong ? ink : slate);
    right(value, W - M - 6, y, strong ? 13 : 10, strong ? bold : font, strong ? brand : ink);
    y -= strong ? 22 : 16;
  };
  totalRow("Base imponible", euro(t.subtotal));
  totalRow("IVA", euro(t.vatTotal));
  if (input.irpfRate > 0) totalRow(`Retención IRPF (${input.irpfRate} %)`, `-${euro(t.irpfAmount)}`);
  y -= 4;
  page.drawLine({ start: { x: W - M - 220, y: y + 14 }, end: { x: W - M, y: y + 14 }, thickness: 1, color: lineColor });
  totalRow("TOTAL", euro(t.total), true);

  // Notas y menciones legales.
  y -= 10;
  const notes: string[] = [];
  if (hasExemptLine(input.lines)) notes.push(VAT_EXEMPT_NOTE);
  if (input.kind === "proforma") notes.push("Factura proforma: documento sin validez fiscal.");
  if (input.notes) notes.push(input.notes);
  if (input.statusLabel) notes.push(`Estado: ${input.statusLabel}`);
  for (const n of notes) {
    for (const l of wrap(n, font, 9, W - 2 * M)) {
      text(l, M, y, 9, font, slate);
      y -= 12;
    }
    y -= 4;
  }

  page.drawText("Generado con Zenzia", { x: M, y: M - 20, size: 7, font, color: slate });
  return pdf.save();
}
