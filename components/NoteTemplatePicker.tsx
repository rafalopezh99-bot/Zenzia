"use client";

// Inserta una plantilla de notas en el textarea de la cita (id="session-notes").
export default function NoteTemplatePicker({ templates }: { templates: { label: string; text: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-slate">Plantilla:</span>
      {templates.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={() => {
            const el = document.getElementById("session-notes") as HTMLTextAreaElement | null;
            if (!el) return;
            el.value = el.value ? `${el.value}\n\n${t.text}` : t.text;
            el.focus();
          }}
          className="rounded-full border border-line px-2.5 py-1 text-ink hover:border-brand"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
