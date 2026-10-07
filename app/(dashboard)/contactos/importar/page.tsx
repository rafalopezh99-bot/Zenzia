import { Card, PageHeader, PrimaryButton } from "@/components/ui";
import { importContacts } from "@/lib/actions/importContacts";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";
import Link from "next/link";

export default async function ImportarPage(props: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);

  return (
    <div className="max-w-xl">
      <PageHeader title={`Importar ${terms.contacts.toLowerCase()}`} />
      {searchParams.ok && (
        <p className="mb-4 rounded-xl bg-paper-deep px-4 py-3 text-sm text-ink">
          ✓ {searchParams.ok} importados.{" "}
          <Link href="/contactos" className="font-semibold text-brand hover:underline">
            Ver listado →
          </Link>
        </p>
      )}
      {searchParams.error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</p>}
      <Card>
        <p className="mb-3 text-sm text-slate">
          Sube un archivo <b>CSV</b> (en Excel: Archivo → Guardar como → CSV). La primera fila debe tener los nombres de
          columna. Reconozco: <b>Nombre</b>, Teléfono, Email, Dirección, Fecha de nacimiento y DNI. Máximo 2.000 filas.
        </p>
        <form action={importContacts} className="space-y-3">
          <input type="file" name="file" accept=".csv,text/csv" required className="block w-full text-sm" />
          <PrimaryButton>Importar</PrimaryButton>
        </form>
        <p className="mt-3 text-xs text-slate/70">Los importados no cuentan para el límite mensual de tu plan.</p>
      </Card>
    </div>
  );
}
