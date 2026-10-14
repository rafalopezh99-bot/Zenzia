"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Galería de fotos de la web del cliente (bucket "web-trabajos", carpeta
// <company_id>/galeria). Se suben ya optimizadas (máx. 1600 px, JPEG).
// Con `onPick` funciona como selector (al cambiar una foto desde "Mi web").
export const GALLERY_BUCKET = "web-trabajos";

export async function optimizeImage(file: Blob, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85));
}

type Item = { name: string; url: string };

export default function WebGallery({ companyId, onPick }: { companyId: string; onPick?: (url: string) => void }) {
  const supabase = createClient();
  const folder = `${companyId}/galeria`;
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.storage.from(GALLERY_BUCKET).list(folder, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
    setItems(
      (data ?? [])
        .filter((f) => f.name && !f.name.startsWith("."))
        .map((f) => ({ name: f.name, url: supabase.storage.from(GALLERY_BUCKET).getPublicUrl(`${folder}/${f.name}`).data.publicUrl }))
    );
  }, [folder]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      const blob = await optimizeImage(f);
      const name = `${Date.now()}-${f.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 40)}.jpg`;
      await supabase.storage.from(GALLERY_BUCKET).upload(`${folder}/${name}`, blob, { contentType: "image/jpeg" });
    }
    await load();
    setBusy(false);
  };

  const remove = async (it: Item) => {
    if (!confirm("¿Borrar esta foto de la galería? Si está puesta en la web, dejará de verse.")) return;
    await supabase.storage.from(GALLERY_BUCKET).remove([`${folder}/${it.name}`]);
    setItems((xs) => xs.filter((x) => x.name !== it.name));
  };

  return (
    <div>
      <label className="mb-4 block cursor-pointer rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-sm font-semibold text-brand">
        {busy ? "Subiendo…" : "+ Subir fotos"}
        <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => upload(e.target.files)} />
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <div key={it.name} className="group relative overflow-hidden rounded-xl border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            <div className="flex items-center justify-between gap-1 p-1.5">
              {onPick ? (
                <button onClick={() => onPick(it.url)} className="w-full rounded-lg bg-brand py-1 text-xs font-semibold text-white">
                  Usar esta
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(it.url);
                      setCopied(it.name);
                      setTimeout(() => setCopied(""), 1500);
                    }}
                    className="text-xs text-slate hover:text-brand"
                  >
                    {copied === it.name ? "✓ Copiado" : "Copiar enlace"}
                  </button>
                  <button onClick={() => remove(it)} className="text-xs text-slate hover:text-red-600" aria-label="Borrar">
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && !busy && <p className="text-sm text-slate">Todavía no hay fotos en la galería.</p>}
    </div>
  );
}
