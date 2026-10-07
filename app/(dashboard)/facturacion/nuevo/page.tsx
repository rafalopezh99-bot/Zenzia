import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import DocumentForm from "@/components/DocumentForm";
import { createDocument } from "@/lib/actions/documents";
import { DOC_LABEL, type DocKind } from "@/lib/documents";

export default async function NuevoDocumentoPage({ searchParams }: { searchParams: { tipo?: string } }) {
  const kind: DocKind =
    searchParams.tipo === "presupuesto" || searchParams.tipo === "proforma" ? searchParams.tipo : "factura";
  const supabase = createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name")
    .eq("status", "active")
    .order("full_name");

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Facturación" title={`Nueva ${DOC_LABEL[kind].toLowerCase()}`.replace("Nueva presupuesto", "Nuevo presupuesto")} />
      <DocumentForm kind={kind} contacts={contacts ?? []} action={createDocument} />
    </div>
  );
}
