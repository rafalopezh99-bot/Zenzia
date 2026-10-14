import { Card, Input, PrimaryButton } from "@/components/ui";
import ZenziaLogo from "@/components/ZenziaLogo";
import { setNewPassword } from "@/lib/actions/passwordReset";

export default async function NuevaContrasenaPage(props: { searchParams: Promise<{ error?: string }> }) {
  const sp = await props.searchParams;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <ZenziaLogo className="h-10 w-auto" />
        </div>
        <h1 className="mb-4 text-center text-base font-bold text-ink">Crea tu nueva contraseña</h1>
        {sp.error && <p className="mb-3 text-center text-sm text-red-600">{sp.error}</p>}
        <form action={setNewPassword} className="space-y-3">
          <Input name="password" type="password" placeholder="Nueva contraseña (mín. 8)" minLength={8} required className="w-full" />
          <Input name="repeat" type="password" placeholder="Repite la contraseña" minLength={8} required className="w-full" />
          <PrimaryButton className="w-full">Guardar y entrar</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
