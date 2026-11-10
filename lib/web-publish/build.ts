import { renderSite, savedMediaUrls, type SavedRow } from "./render";
import { listSiteFiles, readSiteFile } from "./source";
import type { DeployFile } from "./netlify";

// Construye la web final de un cliente: plantilla (web-sites/<id>/) + cambios
// guardados (web_texts). Las fotos subidas desde Zenzia se copian a /media/
// para que la web publicada no dependa de Supabase.

// Solo se copian fotos de nuestro propio almacenamiento (bucket público de
// Supabase). Cualquier otra URL se deja tal cual y el servidor no la descarga.
const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
const isOwnMedia = (url: string) => url.startsWith(STORAGE_PREFIX) && !url.includes("..");
const mediaPath = (url: string) =>
  isOwnMedia(url) ? "media/" + decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "foto.jpg").replace(/[^A-Za-z0-9._-]/g, "-") : url;

export async function buildSite(companyId: string, rows: SavedRow[]): Promise<DeployFile[]> {
  const files: DeployFile[] = [];
  for (const rel of await listSiteFiles(companyId)) {
    const body = await readSiteFile(companyId, rel);
    if (!body) continue;
    if (rel === "index.html") {
      const html = renderSite(body.toString("utf8"), rows, { mode: "publish", mediaUrl: mediaPath });
      files.push({ path: rel, body: Buffer.from(html, "utf8") });
    } else {
      files.push({ path: rel, body });
    }
  }

  const media = await Promise.all(
    savedMediaUrls(rows).filter(isOwnMedia).map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`No se pudo descargar una foto (${res.status}): ${url}`);
      return { path: mediaPath(url), body: Buffer.from(await res.arrayBuffer()) };
    }),
  );
  return files.concat(media);
}
