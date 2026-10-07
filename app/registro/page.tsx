import Link from "next/link";
import { selfSignup } from "@/lib/actions/signup";
import { Card, Input, Select, PrimaryButton } from "@/components/ui";
import { VERTICAL_CATALOG, VERTICAL_CATEGORIES } from "@/lib/verticals";
import { PLANS } from "@/lib/planContent";
import ZenziaLogo from "@/components/ZenziaLogo";

// Alta de cuenta en Zenzia (autoservicio): crea usuario, negocio y módulos
// de su sector. Después: asistente inicial (/onboarding) y pago del plan
// elegido en /planes (con días de prueba si Stripe está configurado).
export default function RegistroPage({ searchParams }: { searchParams: { plan?: string; error?: string } }) {
  const defaultPlan = PLANS.some((p) => p.key === searchParams.plan) ? searchParams.plan : "smart";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 py-10">
      <Card className="w-full max-w-lg">
        <div className="mb-1 flex items-center justify-center">
          <ZenziaLogo className="h-14 w-auto" />
        </div>
        <p className="mb-6 text-center text-sm text-slate">Crea tu cuenta y empieza a organizar tu consulta.</p>

        {searchParams.error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</p>
        )}

        <form action={selfSignup} className="space-y-3">
          <Input name="full_name" placeholder="Tu nombre" required className="w-full" />
          <Input name="business_name" placeholder="Nombre de tu consulta o negocio" required className="w-full" />
          <Select name="vertical" required defaultValue="" className="w-full">
            <option value="" disabled>
              ¿A qué te dedicas?
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
          <Select name="plan" defaultValue={defaultPlan} className="w-full">
            {PLANS.map((p) => (
              <option key={p.key} value={p.key}>
                Plan {p.name} · {p.from ? "desde " : ""}
                {p.price} €/mes
              </option>
            ))}
          </Select>
          <Input name="email" type="email" placeholder="Email" required className="w-full" />
          <Input name="password" type="password" placeholder="Contraseña (mínimo 8 caracteres)" minLength={8} required className="w-full" />
          <label className="flex items-start gap-2 text-xs text-slate">
            <input type="checkbox" name="terms" required className="mt-0.5" />
            <span>
              Acepto el{" "}
              <Link href="/aviso-legal" className="text-brand hover:underline">
                aviso legal
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" className="text-brand hover:underline">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          <PrimaryButton className="w-full">Crear cuenta</PrimaryButton>
        </form>

        <p className="mt-4 text-center text-xs text-slate">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand hover:underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
      <Link href="/" className="text-xs text-slate transition hover:text-ink">
        ‹ Volver a zenzia.es
      </Link>
    </div>
  );
}
