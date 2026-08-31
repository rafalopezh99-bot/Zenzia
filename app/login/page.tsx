"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-900">
      <form action={handleSubmit} className="w-80 space-y-3 rounded-lg bg-neutral-950 p-6">
        <h1 className="text-lg font-semibold text-neutral-100">Zenzia</h1>
        <input
          name="email"
          className="w-full rounded bg-neutral-800 p-2 text-neutral-100"
          type="email"
          placeholder="Email"
          required
        />
        <input
          name="password"
          className="w-full rounded bg-neutral-800 p-2 text-neutral-100"
          type="password"
          placeholder="Contrasena"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded bg-neutral-100 p-2 font-medium text-neutral-900 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
