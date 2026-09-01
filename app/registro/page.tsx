import Link from "next/link";
import { createSignupRequest } from "@/lib/actions/signupRequests";
import { Card, Input, Select, Textarea, PrimaryButton } from "@/components/ui";
import { VERTICAL_CATALOG, VERTICAL_CATEGORIES } from "@/lib/verticals";

// Formulario público de solicitud de acceso a Zenzia. A propósito NO crea
// ninguna cuenta: solo guarda la solicitud (signup_requests) como
// "pendiente". Rafa la revisa desde /solicitudes (dentro del panel, solo
// visible para su propia empresa) y decide si la aprueba o la deniega —
// aprobarla no da de alta la cuenta automáticamente, eso lo sigue haciendo
// él a mano en Supabase, como con cada cliente hasta ahora.
export default function RegistroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <Card className="w-full max-w-lg">
        <div className="mb-1 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zenzia-icon.png" alt="Zenzia" width={84} height={84} className="h-[84px] w-[84px] -mr-3" />
          <h1 className="text-3xl font-black uppercase tracking-tight text-ink">enzia</h1>
        </div>
        <p className="mb-6 text-center text-sm text-slate">
          Cuéntanos sobre tu negocio y te contactamos para darte acceso.
        </p>

        <form action={createSignupRequest} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate" htmlFor="manager_name">
              Nombre del gestor del negocio
            </label>
            <Input id="manager_name" name="manager_name" placeholder="Tu nombre" required className="w-full" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate" htmlFor="business_name">
              Nombre del negocio
            </label>
            <Input id="business_name" name="business_name" placeholder="Nombre de tu empresa o negocio" required className="w-full" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate" htmlFor="service_offered">
              Servicio que ofrece
            </label>
            <Input
              id="service_offered"
              name="service_offered"
              placeholder="Ej: fisioterapia deportiva, peluquería a domicilio..."
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate" htmlFor="vertical">
              Sector del negocio <span className="text-slate/60">(opcional)</span>
            </label>
            <Select id="vertical" name="vertical" defaultValue="" className="w-full">
              <option value="">Prefiero no decirlo</option>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate" htmlFor="plan">
                Plan que escoge
              </label>
              <Select id="plan" name="plan" required defaultValue="" className="w-full">
                <option value="" disabled>
                  Selecciona
                </option>
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate" htmlFor="usage_type">
                Tipo de uso
              </label>
              <Select id="usage_type" name="usage_type" required defaultValue="" className="w-full">
                <option value="" disabled>
                  Selecciona
                </option>
                <option value="negocio">Uso de negocio</option>
                <option value="personal">Uso personal</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate" htmlFor="email">
                Email
              </label>
              <Input id="email" name="email" type="email" placeholder="tu@email.com" required className="w-full" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate" htmlFor="phone">
                Teléfono
              </label>
              <Input id="phone" name="phone" type="tel" placeholder="600 000 000" required className="w-full" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate" htmlFor="message">
              Algo más que debamos saber <span className="text-slate/60">(opcional)</span>
            </label>
            <Textarea id="message" name="message" placeholder="Cuéntanos lo que quieras" className="w-full" rows={3} />
          </div>

          <PrimaryButton className="w-full">Solicitar acceso</PrimaryButton>
        </form>

        <p className="mt-4 text-center text-xs text-slate">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand hover:underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
