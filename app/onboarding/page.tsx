import { redirect } from "next/navigation";
import { getCurrentCompanyProfile } from "@/lib/company";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { Card, Input, Select, PrimaryButton } from "@/components/ui";
import { VERTICAL_CATALOG, VERTICAL_CATEGORIES } from "@/lib/verticals";

export const dynamic = "force-dynamic";

// Asistente de configuración inicial: se muestra una única vez, la primera
// vez que alguien entra en una empresa recién dada de alta (companies.
// onboarded = false). Con estas respuestas se rellena el nombre real de la
// empresa, quién la gestiona, y se activa el pack de módulos del tipo de
// negocio elegido — así el cliente entra directo a un dashboard ya
// configurado para él, sin tocar nada técnico.
export default async function OnboardingPage() {
  const profile = await getCurrentCompanyProfile();
  if (profile.onboarded) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070d] px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-emerald-400 to-violet-400" />
          <h1 className="bg-gradient-to-r from-emerald-300 to-violet-400 bg-clip-text text-lg font-bold text-transparent">
            Configura tu CRM
          </h1>
        </div>
        <p className="mb-5 text-sm text-neutral-400">
          Unas preguntas rápidas y dejamos Zenzia listo a tu medida.
        </p>

        <form action={completeOnboarding} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400" htmlFor="full_name">
              ¿Cómo te llamas?
            </label>
            <Input id="full_name" name="full_name" placeholder="Tu nombre" required className="w-full" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400" htmlFor="company_name">
              Nombre del negocio
            </label>
            <Input
              id="company_name"
              name="company_name"
              placeholder="Nombre de tu empresa o negocio"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400" htmlFor="business_type">
              ¿Cómo operas?
            </label>
            <Select id="business_type" name="business_type" required defaultValue="" className="w-full">
              <option value="" disabled>
                Selecciona una opción
              </option>
              <option value="autonomo">Autónomo</option>
              <option value="empresa">Empresa</option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400" htmlFor="vertical">
              ¿A qué se dedica tu negocio?
            </label>
            <Select id="vertical" name="vertical" required defaultValue="" className="w-full">
              <option value="" disabled>
                Selecciona tu tipo de negocio
              </option>
              {VERTICAL_CATEGORIES.map((category) => (
                <optgroup key={category} label={category}>
                  {VERTICAL_CATALOG.filter((v) => v.category === category).map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <p className="mt-1 text-xs text-neutral-500">
              Activamos automáticamente lo común para ese tipo de negocio — luego puedes ajustar los módulos.
            </p>
          </div>

          <PrimaryButton className="w-full">Empezar a usar Zenzia</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
