"use client";

import { useState } from "react";
import { submitLandingContact } from "@/lib/actions/landingContact";

// Único componente cliente de la landing — necesita estado local para
// mostrar "enviando" / "gracias" / error sin recargar la página. Llama a
// la Server Action directamente, mismo patrón que app/login/page.tsx.
// Estilos propios con los tokens .mk actuales (claro + violeta).
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

  const fieldClass =
    "w-full rounded-xl border border-mk-line bg-mk-bg px-4 py-2.5 text-sm text-mk-ink placeholder:text-mk-muted/60 focus:border-mk-accent focus:outline-none focus:ring-2 focus:ring-mk-accent/20";
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mk-muted";

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-mk-line bg-mk-raised p-6 text-sm text-mk-ink">
        Gracias — hemos recibido tu mensaje. Te contestamos en breve a tu email.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-mk-line bg-mk-raised p-6">
      {/* Honeypot anti-spam: oculto para personas, visible para bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nombre</label>
          <input name="full_name" required className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" name="email" required className={fieldClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>¿Qué necesitas?</label>
        <select name="interest" defaultValue="ambos" className={fieldClass}>
          <option value="crm">CRM de gestión</option>
          <option value="web">Desarrollo web</option>
          <option value="ambos">Las dos cosas / no estoy seguro</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Cuéntanos tu negocio</label>
        <textarea
          name="message"
          rows={4}
          placeholder="A qué te dedicas y qué te gustaría gestionar con Zenzia"
          className={fieldClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-mk-accent px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {status === "loading" ? "Enviando…" : "Enviar mensaje →"}
      </button>
    </form>
  );
}
