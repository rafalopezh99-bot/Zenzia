"use client";

import { useEffect, useRef, useState } from "react";

// Burbuja flotante del asistente virtual (plan Pro). Guarda el historial que
// devuelve el servidor tal cual (append-only) y muestra solo los textos.
type Bubble = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = ["¿Qué citas tengo mañana?", "¿Cuánto he facturado este mes?", "Redacta un recordatorio de cita para WhatsApp"];

export default function AssistantChat({ name }: { name?: string | null }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<unknown[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles, busy]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || busy) return;
    setInput("");
    setBubbles((b) => [...b, { role: "user", text: msg }]);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setHistory(data.history);
      setBubbles((b) => [...b, { role: "assistant", text: data.reply }]);
    } catch (e) {
      setBubbles((b) => [...b, { role: "assistant", text: e instanceof Error ? e.message : "No he podido responder." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl text-white shadow-lg transition hover:scale-105"
        aria-label="Asistente virtual"
        title="Asistente virtual"
      >
        {open ? "✕" : "✦"}
      </button>
      {open && (
        <div className="fixed bottom-24 right-4 z-40 flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="border-b border-line bg-brand px-4 py-3 text-white">
            <div className="text-sm font-bold">Asistente Zenzia</div>
            <div className="text-xs opacity-80">Pregúntame por tu agenda, clientes o facturación</div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {bubbles.length === 0 && (
              <div className="space-y-2">
                <p className="text-slate">¡Hola{name ? `, ${name}` : ""}! ¿En qué te ayudo?</p>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="block w-full rounded-xl border border-line px-3 py-2 text-left text-ink hover:border-brand">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {bubbles.map((b, i) => (
              <div key={i} className={b.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${
                    b.role === "user" ? "bg-brand text-white" : "bg-paper-deep text-ink"
                  }`}
                >
                  {b.text}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-slate">Pensando…</div>}
            <div ref={end} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-line p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe aquí…"
              className="flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brand"
            />
            <button disabled={busy} className="rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-50">
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  );
}
