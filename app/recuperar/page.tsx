import Link from "next/link";
import { Card, Input, PrimaryButton } from "@/components/ui";
import ZenziaLogo from "@/components/ZenziaLogo";
import { requestPasswordReset } from "@/lib/actions/passwordReset";

export default async function RecuperarPage(props: { searchParams: Promise<{ enviado?: string; error?: string }> }) {
  const sp = await props.searchParams;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <ZenziaLogo className="h-10 w-auto" />
        </div>
        <h1 className="mb-1 text-center text-base font-bold text-ink">¿Olvidaste tu contraseña?</h1>
        {sp.enviado ? (
          <p className="text-center text-sm text-slate">
            Si ese email tiene cuenta en Zenzia, te hemos enviado un enlace para crear una contraseña nueva. Revisa también
            la carpeta de spam.
          </p>
        ) : (
          <>
            <p className="mb-4 text-center text-sm text-slate">Escribe tu email y te mandamos un enlace para cambiarla.</p>
            {sp.error && <p className="mb-3 text-center text-sm text-red-600">{sp.error}</p>}
            <form action={requestPasswordReset} className="space-y-3">
              <Input name="email" type="email" placeholder="Email" required className="w-full" />
              <PrimaryButton className="w-full">Enviar enlace</PrimaryButton>
            </form>
          </>
        )}
        <p className="mt-4 text-center text-xs">
          <Link href="/login" className="text-brand hover:underline">
            ‹ Volver a iniciar sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
