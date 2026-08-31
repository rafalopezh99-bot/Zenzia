"use client";

import { useState } from "react";
import { submitLandingContact } from "@/lib/actions/landingContact";
import { FONT_MONO, INK, SLATE, LINE, BLUE } from "@/lib/marketing-theme";

// Único componente cliente de la landing (todo lo demás es Server
// Component, igual que el resto del panel) — necesita estado local para
// mostrar "enviando" / "gracias" / error sin recargar la página. Llama a
// la Server Action directamente, mismo patrón que app/login/page.tsx.
export default function LandingContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await submitLandingContact(formData);
    if (result.ok) {
      setStatus("ok");
      form.reset();
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  const fieldClass = "w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none";
  const labelClass = "mb-1 block text-xs uppercase tracking-widest";

  if (status === "ok") {
    return (
      <div className="rounded-2xl border p-6 text-sm" style={{ borderColor: LINE, color: INK }}>
        Gracias — hemos recibido tu mensaje. Te contestamos en breve a tu email.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
      {/* Honeypot anti-spam: oculto para personas, visible para bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} style={{ fontFamily: FONT_MONO, color: SLATE }}>
            Nombre
          </label>
          <input name="full_name" required className={fieldClass} style={{ borderColor: LINE, color: INK }} />
        </div>
        <div>
          <label className={labelClass} style={{ fontFamily: FONT_MONO, color: SLATE }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className={fieldClass}
            style={{ borderColor: LINE, color: INK }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} style={{ fontFamily: FONT_MONO, color: SLATE }}>
          Cuéntanos tu negocio
        </label>
        <textarea
          name="message"
          rows={4}
          placeholder="A qué te dedicas y qué te gustaría gestionar con Zenzia"
          className={fieldClass}
          style={{ borderColor: LINE, color: INK }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: BLUE, fontFamily: FONT_MONO }}
      >
        {status === "loading" ? "Enviando…" : "Enviar mensaje →"}
      </button>
    </form>
  );
}
