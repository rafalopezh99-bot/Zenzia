"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// "Mi web" para webas propias (companies.site_url): se ve la web real en un
// iframe. Con "Editar", la web entra en modo edición (?zz_edit=1, ver
// js/zenzia.js en la web del cliente) y avisa por postMessage de cada cambio:
// textos (web_texts), fotos sueltas y álbumes (web_categories / web_photos,
// fotos en el bucket "web-trabajos"). Nada se puede mover, solo editar/quitar.

type Category = { id: string; slug: string; title: string; subtitle: string; position: number };
type Photo = { id: string; path: string; caption: string; position: number };

const BUCKET = "web-trabajos";

// Redimensiona a JPEG en el navegador (foto grande y miniatura _t).
async function toJpeg(file: Blob, max: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85));
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `album-${Date.now()}`;

export default function SiteLiveEditor({ siteUrl, companyId }: { siteUrl: string; companyId: string }) {
  const supabase = createClient();
  const origin = new URL(siteUrl).origin;
  const frame = useRef<HTMLIFrameElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingImageKey = useRef<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState("");
  const [album, setAlbum] = useState<Category | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoCount, setPhotoCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  // La web avisa al cargar si tiene álbumes de fotos (galerías gestionables).
  const [hasAlbums, setHasAlbums] = useState(false);

  const publicUrl = (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 2500);
  };
  const reload = () => setVersion((v) => v + 1);

  const countPhotos = useCallback(async () => {
    const { count } = await supabase.from("web_photos").select("id", { count: "exact", head: true }).eq("company_id", companyId);
    setPhotoCount(count ?? 0);
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    countPhotos();
  }, [countPhotos]);

  const openAlbum = async (slug: string) => {
    const { data: cat } = await supabase.from("web_categories").select("id, slug, title, subtitle, position").eq("company_id", companyId).eq("slug", slug).maybeSingle();
    if (!cat) return flash("Ese álbum aún no está en Zenzia: importa primero las fotos actuales.");
    setAlbum(cat);
    const { data } = await supabase.from("web_photos").select("id, path, caption, position").eq("category_id", cat.id).order("position");
    setPhotos(data ?? []);
  };

  // Sube una foto (grande + miniatura _t) y devuelve su ruta en el bucket.
  const uploadPhoto = async (file: Blob, folder: string) => {
    const base = `${companyId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const [big, small] = await Promise.all([toJpeg(file, 1600), toJpeg(file, 500)]);
    await supabase.storage.from(BUCKET).upload(`${base}.jpg`, big, { contentType: "image/jpeg" });
    await supabase.storage.from(BUCKET).upload(`${base}_t.jpg`, small, { contentType: "image/jpeg" });
    return `${base}.jpg`;
  };

  // Mensajes que manda la web en modo edición.
  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      if (e.origin !== origin || !e.data?.type) return;
      const d = e.data;
      if (d.type === "zz-ready") {
        setHasAlbums(d.albums !== false);
      } else if (d.type === "zz-text") {
        const { error } = await supabase.from("web_texts").upsert({ company_id: companyId, key: d.key, value: d.value, updated_at: new Date().toISOString() });
        flash(error ? `Error: ${error.message}` : "✓ Texto guardado");
      } else if (d.type === "zz-img") {
        pendingImageKey.current = d.key;
        fileInput.current?.click();
      } else if (d.type === "zz-album") {
        openAlbum(d.slug);
      } else if (d.type === "zz-static") {
        // Importación de las fotos actuales de la web a sus álbumes.
        let { data: cat } = await supabase.from("web_categories").select("id").eq("company_id", companyId).eq("slug", d.slug).maybeSingle();
        if (!cat) {
          const ins = await supabase.from("web_categories").insert({ company_id: companyId, slug: d.slug, title: d.title, subtitle: d.subtitle }).select("id").single();
          cat = ins.data;
        }
        if (!cat) return;
        let pos = 0;
        for (const f of d.files as { blob: Blob; caption: string }[]) {
          const path = await uploadPhoto(f.blob, d.slug);
          await supabase.from("web_photos").insert({ company_id: companyId, category_id: cat.id, path, caption: f.caption, position: pos++ });
        }
        setStatus(`Importado: ${d.title}…`);
      } else if (d.type === "zz-static-done") {
        setBusy(false);
        await countPhotos();
        flash("✓ Fotos importadas");
        reload();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const onImagePicked = async (file: File | undefined) => {
    const key = pendingImageKey.current;
    if (!file || !key) return;
    setBusy(true);
    const path = await uploadPhoto(file, "site");
    await supabase.from("web_texts").upsert({ company_id: companyId, key: `img:${key}`, value: publicUrl(path), updated_at: new Date().toISOString() });
    setBusy(false);
    flash("✓ Foto cambiada");
    reload();
  };

  const addPhotos = async (files: FileList | null) => {
    if (!album || !files?.length) return;
    setBusy(true);
    let pos = (photos.at(-1)?.position ?? -1) + 1;
    for (const f of Array.from(files)) {
      const path = await uploadPhoto(f, album.slug);
      await supabase.from("web_photos").insert({ company_id: companyId, category_id: album.id, path, caption: "", position: pos++ });
    }
    await openAlbum(album.slug);
    await countPhotos();
    setBusy(false);
    reload();
  };

  const removePhoto = async (p: Photo) => {
    if (!confirm("¿Quitar esta foto de la web?")) return;
    await supabase.from("web_photos").delete().eq("id", p.id);
    await supabase.storage.from(BUCKET).remove([p.path, p.path.replace(/\.jpg$/i, "_t.jpg")]);
    setPhotos((ps) => ps.filter((x) => x.id !== p.id));
    reload();
  };

  const saveAlbumText = async (patch: Partial<Category>) => {
    if (!album) return;
    await supabase.from("web_categories").update(patch).eq("id", album.id);
    setAlbum({ ...album, ...patch });
    flash("✓ Álbum guardado");
    reload();
  };

  const deleteAlbum = async () => {
    if (!album || !confirm(`¿Eliminar el álbum "${album.title}" y todas sus fotos de la web?`)) return;
    await supabase.storage.from(BUCKET).remove(photos.flatMap((p) => [p.path, p.path.replace(/\.jpg$/i, "_t.jpg")]));
    await supabase.from("web_categories").delete().eq("id", album.id);
    setAlbum(null);
    await countPhotos();
    reload();
  };

  const newAlbum = async () => {
    const title = prompt("Nombre del nuevo álbum (ej. Llaveros)");
    if (!title?.trim()) return;
    const { data: last } = await supabase.from("web_categories").select("position").eq("company_id", companyId).order("position", { ascending: false }).limit(1);
    const { data: cat } = await supabase
      .from("web_categories")
      .insert({ company_id: companyId, slug: slugify(title), title: title.trim(), subtitle: "", position: (last?.[0]?.position ?? 0) + 1 })
      .select("id, slug, title, subtitle, position")
      .single();
    if (cat) {
      setAlbum(cat);
      setPhotos([]);
    }
  };

  const importStatic = () => {
    if (!confirm("Se copiarán las fotos que tiene ahora la web a tus álbumes para que puedas gestionarlas. ¿Continuar?")) return;
    setBusy(true);
    setStatus("Importando fotos…");
    frame.current?.contentWindow?.postMessage({ type: "zz-export-static" }, origin);
  };

  const src = `${siteUrl}/?${edit ? "zz_edit=1&" : ""}v=${version}`;
  const btn = "rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-brand";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate">
          {edit
            ? "Haz clic en un texto para cambiarlo o en una foto para sustituirla. También puedes añadir o quitar elementos y ocultar secciones."
            : siteUrl.replace(/^https?:\/\//, "")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status && <span className="text-xs font-medium text-green-700">{status}</span>}
          {edit && hasAlbums && photoCount === 0 && (
            <button onClick={importStatic} disabled={busy} className={btn}>
              Importar fotos actuales
            </button>
          )}
          {edit && hasAlbums && (
            <button onClick={newAlbum} className={btn}>
              + Nuevo álbum
            </button>
          )}
          <button
            onClick={() => {
              setEdit(!edit);
              setAlbum(null);
              reload();
            }}
            className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white"
          >
            {edit ? "Terminar" : "Editar"}
          </button>
        </div>
      </div>

      <div className="relative">
        <iframe ref={frame} key={src} src={src} title="Mi web" className="h-[calc(100vh-170px)] w-full rounded-2xl border border-line bg-white" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 text-sm font-semibold text-white">Guardando…</div>
        )}

        {album && (
          <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto rounded-r-2xl border-l border-line bg-surface p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate">Álbum</span>
              <button onClick={() => setAlbum(null)} className="text-slate hover:text-ink" aria-label="Cerrar">
                ✕
              </button>
            </div>
            <input
              defaultValue={album.title}
              key={`t-${album.id}`}
              onBlur={(e) => e.target.value.trim() && e.target.value !== album.title && saveAlbumText({ title: e.target.value.trim() })}
              className="mb-2 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-semibold text-ink"
            />
            <input
              defaultValue={album.subtitle}
              key={`s-${album.id}`}
              placeholder="Subtítulo"
              onBlur={(e) => e.target.value !== album.subtitle && saveAlbumText({ subtitle: e.target.value.trim() })}
              className="mb-4 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
            <label className="mb-4 block cursor-pointer rounded-xl border border-dashed border-brand px-3 py-3 text-center text-sm font-semibold text-brand">
              + Añadir fotos
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
            </label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <div key={p.id} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={publicUrl(p.path.replace(/\.jpg$/i, "_t.jpg"))} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  <button
                    onClick={() => removePhoto(p)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                    aria-label="Quitar foto"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {photos.length === 0 && <p className="text-sm text-slate">Este álbum no tiene fotos todavía.</p>}
            <button onClick={deleteAlbum} className="mt-6 text-xs text-red-600 hover:underline">
              Eliminar álbum
            </button>
          </div>
        )}
      </div>

      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => onImagePicked(e.target.files?.[0])} />
    </div>
  );
}
