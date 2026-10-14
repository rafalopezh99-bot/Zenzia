import { PageHeader } from "@/components/ui";
import { getCurrentCompanyId } from "@/lib/company";
import WebGallery from "@/components/WebGallery";

// Galería de fotos de la web: aquí se alojan las imágenes que luego se usan
// en "Mi web" (al cambiar una foto se puede elegir de esta galería).
export default async function GaleriaPage() {
  const companyId = await getCurrentCompanyId();
  return (
    <div>
      <PageHeader moduleHeader title="Galería" />
      <WebGallery companyId={companyId} />
    </div>
  );
}
