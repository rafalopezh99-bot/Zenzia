import Link from "next/link";
import { primaryButtonClass } from "@/components/ui";
import { cookies } from "next/headers";
import { setDefaultAgendaView } from "@/lib/actions/agendaView";

// Selector Día / Semana / Mes de la agenda, compartido por /citas (día y
// semana) y /citas/calendario (mes), más el botón de nueva cita y el de
// fijar la vista actual como la que se abre por defecto.
export default function AgendaViewSwitch({
  current,
  newLabel,
}: {
  current: "day" | "week" | "month";
  newLabel: string;
}) {
  const defaultView = cookies().get("agenda_view")?.value ?? "week";
  const views = [
    { key: "day", label: "Día", href: "/citas?view=day" },
    { key: "week", label: "Semana", href: "/citas?view=week" },
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
      {defaultView === current ? (
        <span className="text-xs text-slate">★ Vista predeterminada</span>
      ) : (
        <form action={setDefaultAgendaView.bind(null, current)}>
          <button type="submit" className="text-xs text-brand hover:underline">
            ☆ Fijar como predeterminada
          </button>
        </form>
      )}
      <Link href="/citas/nueva" className={primaryButtonClass}>
        {newLabel}
      </Link>
    </div>
  );
}
