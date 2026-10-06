"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { Input, PrimaryButton } from "@/components/ui";
import ZenziaLogo from "@/components/ZenziaLogo";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await signIn(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-80 space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm"
      >
        <div className="flex items-center justify-center pb-1">
          <ZenziaLogo className="h-12 w-auto" />
        </div>
        <Input name="email" type="email" placeholder="Email" required className="w-full" />
        <Input name="password" type="password" placeholder="Contraseña" required className="w-full" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <PrimaryButton disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </PrimaryButton>
        <p className="text-center text-xs text-slate">
          ¿No tienes cuenta todavía?{" "}
          <Link href="/registro" className="text-brand hover:underline">
            Solicita acceso
          </Link>
        </p>
      </form>
      <Link href="/" className="text-xs text-slate transition hover:text-ink">
        ‹ Volver a zenzia.es
      </Link>
    </div>
  );
}
