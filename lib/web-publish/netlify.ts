import crypto from "node:crypto";

// Despliegue en Netlify por «file digest» (API oficial): se manda la lista de
// archivos con su SHA1 y Netlify pide solo los que no tiene ya (las fotos y
// fuentes, que casi nunca cambian, se suben una vez y luego se reutilizan).
// https://docs.netlify.com/api/get-started/#file-digest-method
//
// Necesita NETLIFY_AUTH_TOKEN (token personal de Netlify) en las variables de
// entorno del sitio de Zenzia.

const API = "https://api.netlify.com/api/v1";

export type DeployFile = { path: string; body: Buffer };

function token() {
  const t = process.env.NETLIFY_AUTH_TOKEN;
  if (!t) throw new Error("Falta NETLIFY_AUTH_TOKEN en las variables de entorno de Zenzia.");
  return t;
}

async function api(path: string, init: RequestInit & { json?: unknown } = {}) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token()}`, ...(init.headers as Record<string, string>) };
  let body = init.body;
  if (init.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  const res = await fetch(API + path, { ...init, headers, body });
  if (!res.ok) throw new Error(`Netlify ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.status === 204 ? null : res.json();
}

export async function deployToNetlify(siteId: string, files: DeployFile[], title: string) {
  const digests: Record<string, string> = {};
  const byPath = new Map<string, Buffer>();
  for (const f of files) {
    const p = "/" + f.path.replace(/^\/+/, "");
    digests[p] = crypto.createHash("sha1").update(f.body).digest("hex");
    byPath.set(p, f.body);
  }

  const deploy = await api(`/sites/${encodeURIComponent(siteId)}/deploys?title=${encodeURIComponent(title)}`, {
    method: "POST",
    json: { files: digests, async: false },
  });

  // Netlify devuelve los SHA1 que le faltan: se suben solo esos.
  const required = new Set<string>(deploy.required ?? []);
  for (const [p, sha] of Object.entries(digests)) {
    if (!required.has(sha)) continue;
    required.delete(sha); // mismo contenido en dos rutas: basta con subirlo una vez
    await api(`/deploys/${deploy.id}/files${p.split("/").map(encodeURIComponent).join("/")}`, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(byPath.get(p)!),
    });
  }

  // Espera (corta) a que quede publicado.
  for (let i = 0; i < 20; i++) {
    const d = await api(`/deploys/${deploy.id}`);
    if (d.state === "ready") return d as { id: string; ssl_url?: string; url?: string };
    if (d.state === "error") throw new Error(`Netlify: ${d.error_message ?? "error al publicar"}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  return deploy as { id: string };
}
