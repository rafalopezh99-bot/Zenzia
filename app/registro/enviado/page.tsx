import Link from "next/link";
import { Card, secondaryLinkClass } from "@/components/ui";
import ZenziaLogo from "@/components/ZenziaLogo";

export default function RegistroEnviadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 py-10">
      <Card className="w-full max-w-sm text-center">
        <div className="mb-2 flex items-center justify-center">
          <ZenziaLogo className="h-[38px] w-auto" />
        </div>
        <h2 className="mb-2 text-base font-bold text-ink">Revisa tu email</h2>
        <p className="mb-5 text-sm text-slate">
          Te hemos enviado un enlace para confirmar tu cuenta. Después inicia sesión y configura tu consulta en un minuto.
        </p>
        <Link href="/" className={secondaryLinkClass}>
          Volver al inicio
        </Link>
      </Card>
    </div>
  );
}
