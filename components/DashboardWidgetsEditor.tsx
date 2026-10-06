"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDashboardWidgets } from "@/lib/actions/dashboardWidgets";
import type { WidgetDef, WidgetKey } from "@/lib/widgets";
import { GhostButton, PrimaryButton } from "@/components/ui";

// Botón "Editar panel" + panel desplegable con una casilla por widget
// disponible. Nada de arrastrar para reordenar (no hacía falta para lo que
// pidió Rafa: "poner los que quiera y quitar el que no le guste") — el
// orden siempre es el del catálogo (lib/widgets.ts), solo cambia qué se ve.
export default function DashboardWidgetsEditor({
  catalog,
  enabledKeys,
}: {
  catalog: WidgetDef[];
  enabledKeys: WidgetKey[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<WidgetKey>>(new Set(enabledKeys));
  const [saving, setSaving] = useState(false);

  function toggle(key: WidgetKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveDashboardWidgets(Array.from(selected));
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <GhostButton type="button" onClick={() => setOpen((v) => !v)}>
        {open ? "Cerrar" : "Editar panel"}
      </GhostButton>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-line bg-surface p-4 shadow-lg">
            <h2 className="mb-1 text-sm font-semibold text-ink">Widgets del panel</h2>
            <p className="mb-3 text-xs text-slate">Elige qué tarjetas quieres ver en tu dashboard.</p>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {catalog.map((w) => (
                <label
                  key={w.key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-paper-deep"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(w.key)}
                    onChange={() => toggle(w.key)}
                    className="h-4 w-4 rounded border-line accent-brand"
                  />
                  {w.label}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <PrimaryButton type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </PrimaryButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
