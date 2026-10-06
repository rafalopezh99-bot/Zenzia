import { PageHeader, Card } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { PLANS } from "@/lib/planContent";

// Pantalla de "mejorar plan": a donde llevan los apartados con candado del
// menú. De momento el cambio de plan se pide por email (no hay pasarela).
export default async function PlanesPage() {
  const { plan, companyName } = await getCurrentCompanyProfile();
  const subject = encodeURIComponent(`Cambio de plan - ${companyName}`);

  return (
    <div>
      <PageHeader eyebrow="Tu plan" title="Mejora tu plan" />
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const current = p.key === plan;
          return (
            <Card key={p.key} className={`flex flex-col ${p.featured ? "border-brand" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-brand">Zenzia {p.name}</span>
                {current && (
                  <span className="rounded-full bg-paper-deep px-2 py-0.5 text-xs font-semibold text-slate">Tu plan</span>
                )}
              </div>
              <h3 className="mt-2 text-base font-bold text-ink">{p.claim}</h3>
              <div className="mt-3 text-3xl font-black text-ink">
                {p.from && <span className="mr-1 text-sm text-brand">Desde</span>}
                {p.price} €<span className="ml-1 text-sm font-normal text-slate">/mes</span>
              </div>
              <p className="text-xs text-slate">{p.setup}</p>
              {p.includes && <p className="mt-4 text-sm font-bold text-ink">{p.includes}</p>}
              <ul className={`${p.includes ? "mt-2" : "mt-4"} flex-1 space-y-1.5 text-sm text-ink`}>
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="font-bold text-brand">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {!current && (
                <a
                  href={`mailto:zenzia.co@gmail.com?subject=${subject}%20a%20${p.name}`}
                  className={`mt-6 rounded-xl px-4 py-2.5 text-center text-sm font-bold ${
                    p.featured ? "bg-brand text-white" : "border border-line text-ink"
                  }`}
                >
                  Pasar a {p.name}
                </a>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
