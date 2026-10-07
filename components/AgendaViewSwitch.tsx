import Link from "next/link";
import { primaryButtonClass } from "@/components/ui";

// Selector Día / Semana / Mes de la agenda, compartido por /citas (día y
// semana) y /citas/calendario (mes), más el botón de nueva cita.
export default function AgendaViewSwitch({
  current,
  newLabel,
}: {
  current: "day" | "week" | "month";
  newLabel: string;
}) {
  const views = [
    { key: "day", label: "Día", href: "/citas?view=day" },
    { key: "week", label: "Semana", href: "/citas" },
    { key: "month", label: "Mes", href: "/citas/calendario" },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-full border border-line p-1">
        {views.map((v) => (
          <Link
            key={v.key}
            href={v.href}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              v.key === current ? "bg-brand text-white" : "text-slate hover:text-ink"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>
      <Link href="/citas/nueva" className={primaryButtonClass}>
        {newLabel}
      </Link>
    </div>
  );
}
