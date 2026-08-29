"use client";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Página autenticada: no tiene sentido pregenerarla en build time (y el
// build no tiene las env vars reales de Supabase del cliente todavía).
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/dashboard"); router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900">
      <form onSubmit={handleLogin} className="w-80 space-y-3 rounded-lg bg-neutral-950 p-6">
        <h1 className="text-lg font-semibold text-neutral-100">Zenzia</h1>
        <input
          className="w-full rounded bg-neutral-800 p-2 text-neutral-100"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded bg-neutral-800 p-2 text-neutral-100"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="w-full rounded bg-neutral-100 p-2 font-medium text-neutral-900">
          Entrar
        </button>
      </form>
    </div>
  );
}
