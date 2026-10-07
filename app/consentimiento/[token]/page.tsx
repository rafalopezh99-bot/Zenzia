import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signConsent } from "@/lib/actions/publicConsent";
import SignaturePad from "@/components/SignaturePad";

export const dynamic = "force-dynamic";

// Firma online de un consentimiento (enlace enviado al paciente).
export default async function ConsentimientoPage(props: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: c } = await supabase.rpc("public_consent", { p_token: token });
  if (!c) notFound();

  return (
    <div className="min-h-screen bg-paper px-4 py-10 text-ink">
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate">{c.company}</div>
        <h1 className="mt-1 text-xl font-bold">{c.title}</h1>
        <p className="mt-1 text-sm text-slate">Paciente: {c.contact}</p>
        {c.body && <div className="mt-4 whitespace-pre-wrap rounded-xl bg-paper-deep p-4 text-sm">{c.body}</div>}
        {c.signed ? (
          <p className="mt-6 font-semibold text-green-700">
            ✓ Firmado el {new Date(c.signed_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}
          </p>
        ) : (
          <form action={signConsent.bind(null, token)} className="mt-6 space-y-3">
            {searchParams.error && <p className="text-sm text-red-600">{searchParams.error}</p>}
            <input name="name" required placeholder="Nombre y apellidos" className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
            <SignaturePad name="signature" />
            <label className="flex items-start gap-2 text-xs text-slate">
              <input type="checkbox" required className="mt-0.5" /> He leído y acepto este documento.
            </label>
            <button className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Firmar</button>
          </form>
        )}
      </div>
    </div>
  );
}
