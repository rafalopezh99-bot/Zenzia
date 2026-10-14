import Link from "next/link";
import ZenziaLogo from "@/components/ZenziaLogo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center text-ink">
      <ZenziaLogo light className="h-10" />
      <h1 className="text-2xl font-bold">Esta página no existe</h1>
      <p className="max-w-sm text-sm text-slate">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">
          Ir al inicio
        </Link>
        <a
          href="https://wa.me/34673895732"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold"
        >
          Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}
