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
    <div className="flex min-h-screen items-center justify-center bg-[#05070d] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-80 space-y-4 rounded-2xl border border-white/10 bg-[#0d1420]/70 p-6 shadow-[0_0_60px_-20px_rgba(52,211,153,0.3)] backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-emerald-400 to-violet-400" />
          <h1 className="bg-gradient-to-r from-emerald-300 to-violet-400 bg-clip-text text-lg font-bold text-transparent">
            Zenzia
          </h1>
        </div>
        <Input name="email" type="email" placeholder="Email" required className="w-full" />
        <Input name="password" type="password" placeholder="Contraseña" required className="w-full" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <PrimaryButton disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </PrimaryButton>
      </form>
    </div>
  );
}
