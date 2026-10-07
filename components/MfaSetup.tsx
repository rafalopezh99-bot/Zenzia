"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Activar / desactivar la verificación en dos pasos con una app de
// autenticación (Google Authenticator, Authy...). Usa Supabase MFA (TOTP).
export default function MfaSetup() {
  const supabase = createClient();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const f = data?.totp?.find((x) => x.status === "verified");
      if (f) {
        setEnabled(true);
        setFactorId(f.id);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Zenzia ${Date.now()}` });
    if (error) return setMsg(error.message);
    setFactorId(data.id);
    setQr(data.totp.qr_code);
  };
  const verify = async () => {
    if (!factorId) return;
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) return setMsg("Código incorrecto");
    setEnabled(true);
    setQr(null);
    setMsg("✓ Verificación en dos pasos activada");
  };
  const disable = async () => {
    if (!factorId) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) return setMsg(error.message);
    setEnabled(false);
    setFactorId(null);
    setMsg("Verificación en dos pasos desactivada");
  };

  return (
    <div className="space-y-3 text-sm">
      {enabled ? (
        <>
          <p className="text-ink">✓ Activada. Al entrar te pediremos el código de tu app de autenticación.</p>
          <button onClick={disable} className="text-xs text-red-600 hover:underline">
            Desactivar
          </button>
        </>
      ) : qr ? (
        <>
          <p className="text-slate">Escanea este código con Google Authenticator o Authy y escribe el código de 6 dígitos:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Código QR" className="h-44 w-44 rounded-lg bg-white p-2" />
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="w-28 rounded-xl border border-line bg-surface px-3 py-2"
            />
            <button onClick={verify} className="rounded-xl bg-brand px-4 py-2 font-semibold text-white">
              Activar
            </button>
          </div>
        </>
      ) : (
        <button onClick={start} className="rounded-xl border border-line px-4 py-2 font-semibold text-ink hover:border-brand">
          Activar verificación en dos pasos
        </button>
      )}
      {msg && <p className="text-xs text-slate">{msg}</p>}
    </div>
  );
}
