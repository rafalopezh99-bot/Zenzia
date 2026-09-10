"use client";

import { useEffect, useState, type ReactNode } from "react";

type ThemePref = "light" | "dark" | "system";
const STORAGE_KEY = "zenzia-theme";

function applyTheme(pref: ThemePref) {
  const resolved =
    pref === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : pref;
  document.documentElement.setAttribute("data-theme", resolved);
}

const OPTIONS: { key: ThemePref; label: string; icon: ReactNode }[] = [
  {
    key: "light",
    label: "Claro",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M8 1.2v1.6M8 13.2v1.6M14.8 8h-1.6M2.8 8H1.2M12.7 3.3l-1.13 1.13M4.43 11.57L3.3 12.7M12.7 12.7l-1.13-1.13M4.43 4.43L3.3 3.3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "dark",
    label: "Oscuro",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M13.8 9.9A6 6 0 0 1 6.1 2.2a6 6 0 1 0 7.7 7.7Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "system",
    label: "Auto",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="3" width="13" height="8.4" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 14h5M8 11.4V14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

// Selector claro/oscuro/automático del panel. El script de arranque en
// app/layout.tsx ya pinta el tema correcto antes del primer render (para
// no dar un flash de color); este componente solo gestiona la preferencia
// guardada y reacciona si cambia el tema del sistema operativo mientras la
// pestaña sigue abierta en modo "automático".
export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setPref(stored === "light" || stored === "dark" ? stored : "system");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(pref);
    if (pref !== "system") return;
    // En modo automático, si el usuario cambia el tema del sistema con la
    // pestaña abierta, el panel se actualiza sin recargar.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref, mounted]);

  const choose = (next: ThemePref) => {
    setPref(next);
    if (next === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-paper-deep p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => choose(opt.key)}
          aria-pressed={mounted && pref === opt.key}
          title={opt.label}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
            mounted && pref === opt.key ? "bg-surface text-brand shadow-sm" : "text-slate hover:text-ink"
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
