import fs from "node:fs/promises";
import path from "node:path";

// Plantillas de las webs de clientes que se editan desde «Mi web».
//
// Cada web vive en web-sites/<company_id>/ (en este repo): el HTML original que
// entregó RL Digital Studios, sus estilos, fuentes, páginas legales, etc. Los
// textos y fotos que cambia el cliente NO van aquí, van en web_texts; al
// publicar se aplican encima (ver render.ts).
//
// Para dar de alta una web nueva: copiar su carpeta a web-sites/<company_id>/
// (sin el <script> de app.zenzia.es/zz/site.js), rellenar
// companies.netlify_site_id y desplegar Zenzia. next.config.js incluye esta
// carpeta en las funciones del servidor (outputFileTracingIncludes).

const ROOT = path.join(process.cwd(), "web-sites");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function siteDir(companyId: string) {
  if (!UUID.test(companyId)) throw new Error("company_id no válido");
  return path.join(ROOT, companyId);
}

export async function hasSiteSource(companyId: string) {
  try {
    await fs.access(path.join(siteDir(companyId), "index.html"));
    return true;
  } catch {
    return false;
  }
}

// Ruta relativa segura dentro de la carpeta de la web (sin "..", sin ocultos).
export function safeRelPath(p: string) {
  const clean = path.posix.normalize("/" + p).slice(1);
  if (!clean || clean.split("/").some((s) => s.startsWith("."))) return null;
  return clean;
}

export async function readSiteFile(companyId: string, rel: string) {
  const clean = safeRelPath(rel);
  if (!clean) return null;
  try {
    return await fs.readFile(path.join(siteDir(companyId), clean));
  } catch {
    return null;
  }
}

export async function listSiteFiles(companyId: string) {
  const base = siteDir(companyId);
  const out: string[] = [];
  async function walk(dir: string) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else out.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  await walk(base);
  return out;
}

const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  ico: "image/x-icon",
  woff2: "font/woff2",
  woff: "font/woff",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml",
  pdf: "application/pdf",
};
export function contentType(p: string) {
  return TYPES[p.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}
