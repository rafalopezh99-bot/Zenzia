"use client";

import { useState } from "react";

// Panel de pestañas reutilizable — mismo patrón "titular + beneficio +
// detalle que cambia con pestañas" que monday.com/crm usa dos veces en su
// página (capacidades y funcionalidades). Genérico: recibe sus propias
// pestañas por props para poder usarse en más de una sección de
// app/page.tsx con contenido real de Zenzia en cada una.

export type TabDef = {
  key: string;
  label: string;
  color: "coral" | "accent" | "teal" | "amber";
  title: string;
  body: string;
  bullets: string[];
};

const DOT_COLOR: Record<string, string> = {
  coral: "bg-mk-coral",
  accent: "bg-mk-accent",
  teal: "bg-mk-teal",
  amber: "bg-mk-amber",
};

const TEXT_COLOR: Record<string, string> = {
  coral: "text-mk-coral",
  accent: "text-mk-accent",
  teal: "text-mk-teal",
  amber: "text-mk-amber",
};

export default function FeatureTabs({ tabs, label }: { tabs: TabDef[]; label: string }) {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              i === active
                ? "border-mk-ink bg-mk-ink text-white"
                : "border-mk-line bg-mk-bg text-mk-muted hover:border-mk-ink hover:text-mk-ink"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${DOT_COLOR[t.color]}`} />
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        className="mt-8 grid gap-8 rounded-3xl border border-mk-line bg-mk-raised p-8 sm:p-10 lg:grid-cols-[1fr_1fr]"
      >
        <div>
          <span className={`text-xs font-bold uppercase tracking-widest ${TEXT_COLOR[tab.color]}`}>
            {tab.label}
          </span>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-mk-ink">{tab.title}</h3>
          <p className="mt-4 text-sm leading-relaxed text-mk-muted">{tab.body}</p>
        </div>
        <ul className="flex flex-col justify-center gap-3">
          {tab.bullets.map((b) => (
            <li
              key={b}
              className="flex items-center gap-3 rounded-xl border border-mk-line bg-mk-bg px-4 py-3 text-sm font-medium text-mk-ink"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[tab.color]}`} />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
