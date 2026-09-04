import { createClient } from "@/lib/supabase/server";
import { uploadPhoto } from "@/lib/actions/photos";
import { Card, PageHeader, Select, PrimaryButton } from "@/components/ui";

const KIND_LABEL: Record<string, string> = { antes: "Antes", despues: "Después" };

export default async function FotosPage() {
  const supabase = createClient();
  // Sin límite esto se iría haciendo más lento con cada foto subida (más
  // filas a traer y una llamada al Storage por cada una, ver abajo) — se
  // enseñan las 60 más recientes, que ya llenan varias pantallas de sobra.
  const [{ data: contacts }, { data: photos }] = await Promise.all([
    supabase.from("contacts").select("id, full_name").order("full_name"),
    supabase
      .from("photos")
      .select("id, kind, storage_path, created_at, contacts(full_name)")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const withUrls = await Promise.all(
    (photos ?? []).map(async (p: any) => {
      const { data } = await supabase.storage.from("photos").createSignedUrl(p.storage_path, 3600);
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div>
      <PageHeader title="Fotos antes / después" />

      <Card className="mb-6">
        <form action={uploadPhoto} encType="multipart/form-data" className="flex flex-wrap items-end gap-2 text-sm">
          <Select name="contact_id" required>
            <option value="">Cliente</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Select name="kind" required>
            <option value="">Tipo</option>
            <option value="antes">Antes</option>
            <option value="despues">Después</option>
          </Select>
          <input
            name="file"
            type="file"
            accept="image/*"
            required
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate file:mr-3 file:rounded-full file:border-0 file:bg-paper-deep file:px-3 file:py-1.5 file:text-xs file:text-ink"
          />
          <PrimaryButton>Subir foto</PrimaryButton>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {withUrls.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-line bg-white">
            {p.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt={KIND_LABEL[p.kind]} className="h-40 w-full object-cover" />
            )}
            <div className="p-2 text-xs text-slate">
              <div className="text-ink">{p.contacts?.full_name}</div>
              <div>{KIND_LABEL[p.kind]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
