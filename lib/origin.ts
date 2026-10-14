// Dirección pública por la que ha entrado el usuario (zenzia.es, app.zenzia.es…).
// En Netlify, req.url puede traer el dominio interno del despliegue
// (xxxx--zenzia.netlify.app), así que se usan las cabeceras del proxy.
export function publicOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && !/--zenzia\.netlify\.app$/.test(host)) {
    const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
}
