import Link from "next/link";
import { Card, secondaryLinkClass } from "@/components/ui";

export default function RegistroEnviadoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <Card className="w-full max-w-sm text-center">
        <div className="mb-2 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zenzia-wordmark.png" alt="Zenzia" width={194} height={38} className="h-[38px] w-auto" />
        </div>
        <h2 className="mb-2 text-base font-bold text-ink">Solicitud enviada</h2>
        <p className="mb-5 text-sm text-slate">
          Hemos recibido tu solicitud. La revisamos y te contactamos en breve por email o teléfono.
        </p>
        <Link href="/" className={secondaryLinkClass}>
          Volver al inicio
        </Link>
      </Card>
    </div>
  );
}
