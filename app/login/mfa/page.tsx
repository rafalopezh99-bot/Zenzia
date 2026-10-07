"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Segundo paso del login cuando la cuenta tiene verificación en dos pasos.
export default function MfaPage() {
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = data?.totp?.find((f) => f.status === "verified");
    if (!factor) return (window.location.href = "/dashboard");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (error) return setError("Código incorrecto");
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-3 rounded-2xl border border-line bg-surface p-6 text-center">
        <h1 className="text-lg font-bold text-ink">Verificación en dos pasos</h1>
        <p className="text-sm text-slate">Escribe el código de tu app de autenticación.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          maxLength={6}
          autoFocus
          className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-center text-lg tracking-widest"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Entrar</button>
      </form>
    </div>
  );
}
