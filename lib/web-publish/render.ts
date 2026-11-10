import { parseHTML } from "linkedom";

// Aplica en el SERVIDOR los cambios guardados desde «Mi web» (tabla web_texts)
// sobre la plantilla HTML de la web de un cliente.
//
// Sustituye a lo que antes hacía public/zz/site.js en el navegador de cada
// visitante (leer web_texts directamente de Supabase con la clave pública).
// Ahora:
//   - mode "publish": devuelve el HTML final, limpio (sin atributos data-zz ni
//     scripts de Zenzia). Es lo que se sube a Netlify al pulsar «Publicar».
//   - mode "edit": mismo resultado pero con las marcas data-zz y el editor
//     inyectado. Solo lo sirve la vista previa autenticada de Zenzia.
//
// IMPORTANTE: la numeración de claves (bloque.N, lista.item.N, bloque.imgN...)
// tiene que coincidir exactamente con la que hacía site.js, porque las claves ya
// guardadas en web_texts dependen de ella. Si se toca algo de blocks()/leaves(),
// las webs existentes perderían sus textos editados.

export type SavedRow = { key: string; value: string };
export type ExtraSection = { id: string; after: string; type: "texto" | "foto" | "galeria"; photos?: string[] };

const INLINE: Record<string, 1> = { B: 1, STRONG: 1, EM: 1, I: 1, BR: 1, SMALL: 1, U: 1 };
// Tarjetas que abren un álbum de fotos gestionado desde Zenzia.
const ALBUM = "[data-zz-album], .work-card[data-category]";
const PH =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e8edf3"/><text x="50%" y="50%" font-family="sans-serif" font-size="30" fill="#6b7a8c" text-anchor="middle">Pulsa para poner una foto</text></svg>',
  );

// Enlaces que se aceptan desde el editor (nada de javascript:, data:...).
const SAFE_HREF = /^(https?:|mailto:|tel:|#)/i;

type El = any; // Elemento de linkedom (API DOM estándar).

function blocks(document: El) {
  const out: { el: El; key: string; hideable: boolean }[] = [];
  document.querySelectorAll("header, section, footer").forEach((el: El, i: number) => {
    if (el.parentElement && el.parentElement.closest("section, header, footer")) return;
    out.push({ el, key: el.id || el.tagName.toLowerCase() + i, hideable: el.tagName === "SECTION" });
  });
  return out;
}

// Texto editable = elemento cuyo contenido es solo texto (o negrita/cursiva).
function isLeaf(el: El) {
  if (!el.textContent.trim() || el.closest("script, style, svg, button, form, [data-zz-skip]")) return false;
  for (let i = 0; i < el.children.length; i++) if (!INLINE[el.children[i].tagName]) return false;
  return true;
}

function leaves(root: El, exclude?: string) {
  const all = root.querySelectorAll("h1,h2,h3,h4,h5,p,li,span,a,small,strong,em,label,blockquote,figcaption,td,th,dt,dd");
  const out: El[] = [];
  all.forEach((el: El) => {
    if (exclude && el.closest(exclude) && el.closest(exclude) !== root) return;
    if (!isLeaf(el)) return;
    if (el.parentElement && out.indexOf(el.parentElement) >= 0) return; // ya cubierto por el padre
    out.push(el);
  });
  return out;
}

// ---- Listas (noticias...): orden e ids guardados como JSON en "list:<nombre>" ----
function setupList(list: El, saved: string | undefined) {
  const name = list.getAttribute("data-zz-list");
  const items: El[] = Array.from(list.children);
  if (!items.length) return null;
  const template = items[0].cloneNode(true);
  items.forEach((it, i) => it.setAttribute("data-zz-item", "i" + i));
  if (saved) {
    let ids: unknown = null;
    try {
      ids = JSON.parse(saved);
    } catch {
      ids = null;
    }
    if (Array.isArray(ids)) {
      const byId: Record<string, El> = {};
      items.forEach((it) => (byId[it.getAttribute("data-zz-item")] = it));
      list.textContent = "";
      ids.forEach((id: string) => {
        const it = byId[id] || template.cloneNode(true);
        it.setAttribute("data-zz-item", id);
        list.appendChild(it);
      });
    }
  }
  return { name, template };
}

function keyItems(list: El, name: string) {
  Array.from(list.children).forEach((it: El) => {
    const id = it.getAttribute("data-zz-item");
    leaves(it).forEach((el, n) => el.setAttribute("data-zz", `${name}.${id}.${n}`));
    it.querySelectorAll("img").forEach((img: El, n: number) => img.setAttribute("data-zz-img", `${name}.${id}.img${n}`));
    it.querySelectorAll("a[href]").forEach((a: El, n: number) => a.setAttribute("data-zz-href", `${name}.${id}.a${n}`));
  });
}

function assignKeys(document: El) {
  blocks(document).forEach((b) => {
    b.el.setAttribute("data-zz-block", b.key);
    leaves(b.el, "[data-zz-list]")
      .filter((el) => !el.closest("[data-zz]"))
      .forEach((el, n) => el.setAttribute("data-zz", `${b.key}.${n}`));
    const imgs = Array.from(b.el.querySelectorAll("img")).filter(
      (img: El) => !img.closest("[data-zz-list]") && !img.closest(ALBUM) && !img.hasAttribute("data-zz-img"),
    );
    imgs.forEach((img: El, n) => img.setAttribute("data-zz-img", `${b.key}.img${n}`));
    const links = Array.from(b.el.querySelectorAll('a[href^="http"]')).filter(
      (a: El) => !a.closest("[data-zz-list]") && !a.hasAttribute("data-zz-href"),
    );
    links.forEach((a: El, n) => a.setAttribute("data-zz-href", `${b.key}.a${n}`));
  });
}

// Email, WhatsApp y teléfono: al cambiar el texto del enlace se actualiza también su dirección.
function syncLink(document: El, el: El, v: string) {
  const a = el.closest("a[href]");
  if (!a) return;
  const href = a.getAttribute("href") || "";
  if (/^mailto:/i.test(href) && /@/.test(v)) a.setAttribute("href", "mailto:" + v.trim());
  else if (/^tel:/i.test(href)) {
    let d = v.replace(/\D/g, "");
    if (d.length === 9) d = "34" + d;
    if (d.length >= 10) a.setAttribute("href", "tel:+" + d);
  } else if (/wa\.me\//.test(href)) {
    let d = v.replace(/\D/g, "");
    if (d.length === 9) d = "34" + d;
    if (d.length >= 10)
      document.querySelectorAll('a[href*="wa.me/"]').forEach((w: El) => w.setAttribute("href", w.getAttribute("href").replace(/wa\.me\/\d*/, "wa.me/" + d)));
  }
}

function apply(document: El, map: Record<string, string>, mediaUrl: (u: string) => string) {
  Object.keys(map).forEach((k) => {
    const v = map[k];
    if (k.startsWith("img:")) {
      const img = document.querySelector(`[data-zz-img="${cssEsc(k.slice(4))}"]`);
      if (img && v && /^https?:\/\//i.test(v)) {
        img.setAttribute("src", mediaUrl(v));
        img.removeAttribute("srcset");
        img.removeAttribute("data-zz-ph");
      }
    } else if (k.startsWith("href:")) {
      const a = document.querySelector(`[data-zz-href="${cssEsc(k.slice(5))}"]`);
      if (a && v && SAFE_HREF.test(v.trim())) a.setAttribute("href", v.trim());
    } else if (k.startsWith("hide:")) {
      const bl = document.querySelector(`[data-zz-block="${cssEsc(k.slice(5))}"]`);
      if (bl) bl.setAttribute("data-zz-hidden", v === "1" ? "1" : "");
    } else if (!k.startsWith("list:") && k !== "sections") {
      const el = document.querySelector(`[data-zz="${cssEsc(k)}"]`);
      if (el) {
        el.textContent = v;
        syncLink(document, el, v);
      }
    }
  });
}

function cssEsc(s: string) {
  return s.replace(/["\\]/g, "\\$&");
}

// ---- Secciones añadidas desde Zenzia: JSON en "sections" ----
export function extraSectionHtml(sec: ExtraSection) {
  const k = "x" + sec.id;
  const img = (key: string) =>
    `<img src="${PH}" alt="" data-zz-img="${key}" data-zz-ph="1" style="width:100%;height:100%;object-fit:cover;border-radius:12px;display:block">`;
  const h = `<h2 data-zz="${k}.0">Título de la sección</h2>`;
  const p = `<p data-zz="${k}.1" style="white-space:pre-line">Escribe aquí el texto de la sección.</p>`;
  let inner = "";
  if (sec.type === "foto") {
    inner =
      `<div style="display:flex;flex-wrap:wrap;gap:32px;align-items:center">` +
      `<div style="flex:1 1 320px">${h}${p}</div>` +
      `<div style="flex:1 1 320px;aspect-ratio:4/3">${img(k + ".img0")}</div></div>`;
  } else {
    inner = h + p;
    if (sec.type === "galeria") {
      inner +=
        `<div class="zz-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:24px">` +
        (sec.photos || []).map((pid) => `<div data-zz-photo="${pid}" style="position:relative;aspect-ratio:1">${img(k + "." + pid)}</div>`).join("") +
        `</div>`;
    }
  }
  return `<div class="zz-x zz-x-${sec.type}" data-zz-extra="${sec.id}" style="position:relative;max-width:1100px;margin:0 auto;padding:64px 20px">${inner}</div>`;
}

function renderExtras(document: El, saved: string | undefined) {
  let extra: ExtraSection[] = [];
  try {
    extra = JSON.parse(saved || "[]");
  } catch {
    extra = [];
  }
  if (!Array.isArray(extra)) extra = [];
  extra.forEach((sec) => {
    const a = document.querySelector(`[data-zz-block="${cssEsc(sec.after)}"], [data-zz-extra="${cssEsc(sec.after)}"]`);
    const holder = document.createElement("div");
    holder.innerHTML = extraSectionHtml(sec);
    const el = holder.firstChild;
    if (a) a.insertAdjacentElement("afterend", el);
    else {
      const f = document.querySelector("footer");
      if (f) f.parentNode.insertBefore(el, f);
      else document.body.appendChild(el);
    }
  });
  return extra;
}

export type RenderOptions = {
  mode: "publish" | "edit";
  // Convierte la URL guardada de una foto (Supabase Storage) en la que se usa en
  // la página: en "publish" una ruta propia de la web (las fotos se suben junto
  // al HTML); en "edit" se deja tal cual.
  mediaUrl?: (url: string) => string;
  // Solo "edit": URL del script del editor.
  editorScript?: string;
  // Vista dentro de Zenzia (edición o vista previa): quita lo marcado con
  // data-zz-noedit (p. ej. el aviso de cookies, que no pinta nada ahí).
  inZenzia?: boolean;
};

export function renderSite(html: string, rows: SavedRow[], opts: RenderOptions) {
  const { document } = parseHTML(html);
  const map: Record<string, string> = {};
  rows.forEach((r) => (map[r.key] = r.value));
  const mediaUrl = opts.mediaUrl ?? ((u: string) => u);

  // Cualquier resto del script antiguo de Zenzia fuera (ya no se usa en la web pública).
  document.querySelectorAll('script[src*="zz/site.js"]').forEach((s: El) => s.remove());

  const listTemplates: Record<string, string> = {};
  document.querySelectorAll("[data-zz-list]").forEach((list: El) => {
    const r = setupList(list, map["list:" + list.getAttribute("data-zz-list")]);
    if (r) listTemplates[r.name] = r.template.outerHTML;
  });
  assignKeys(document);
  document.querySelectorAll("[data-zz-list]").forEach((list: El) => keyItems(list, list.getAttribute("data-zz-list")));
  const extra = renderExtras(document, map.sections);
  apply(document, map, mediaUrl);

  if (opts.inZenzia || opts.mode === "edit") document.querySelectorAll("[data-zz-noedit]").forEach((e: El) => e.remove());

  if (opts.mode === "publish") {
    // Secciones ocultas y fotos sin poner: fuera. Marcas del editor: fuera.
    document.querySelectorAll('[data-zz-hidden="1"]').forEach((e: El) => e.remove());
    document.querySelectorAll("img[data-zz-ph]").forEach((i: El) => (i.closest("[data-zz-photo]") || i).remove());
    document.querySelectorAll("*").forEach((el: El) => {
      Array.from(el.attributes as { name: string }[])
        .map((a) => a.name)
        .filter((n) => n.startsWith("data-zz"))
        .forEach((n) => el.removeAttribute(n));
    });
  } else {
    // Vista de edición: datos para el editor + script (solo en Zenzia, con sesión).
    const data = document.createElement("script");
    data.setAttribute("type", "application/json");
    data.setAttribute("id", "zz-editor-data");
    data.textContent = JSON.stringify({ listTemplates, sections: extra }).replace(/</g, "\\u003c");
    document.body.appendChild(data);
    const s = document.createElement("script");
    s.setAttribute("src", opts.editorScript ?? "/zz/editor.js");
    document.body.appendChild(s);
  }

  return "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
}

// Fotos que la página usa desde Supabase Storage (para copiarlas a la web al publicar).
export function savedMediaUrls(rows: SavedRow[]) {
  return Array.from(new Set(rows.filter((r) => r.key.startsWith("img:") && /^https?:\/\//.test(r.value)).map((r) => r.value)));
}
