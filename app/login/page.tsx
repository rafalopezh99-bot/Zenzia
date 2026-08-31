"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/actions/auth";
import { Input, PrimaryButton } from "@/components/ui";

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
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-80 space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col items-center gap-2 pb-1 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zenzia-icon.png" alt="" width={44} height={44} className="h-11 w-11" />
          <h1 className="text-lg font-black uppercase tracking-tight text-ink">Zenzia</h1>
        </div>
        <Input name="email" type="email" placeholder="Email" required className="w-full" />
        <Input name="password" type="password" placeholder="Contraseña" required className="w-full" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <PrimaryButton disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </PrimaryButton>
      </form>
    </div>
  );
}
