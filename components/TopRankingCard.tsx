import { Card } from "@/components/ui";

export interface RankingRow {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  badge: string;
}

// Lista "Top 5" con barra de progreso por fila — incentivada por el
// template que pasó Rafa ("Top Products"), pero con los únicos dos
// acentos de Zenzia (navy/celeste) en vez de un color distinto por fila:
// la barra pasa de navy a celeste según la posición del ranking (1º más
// oscuro → 5º más claro), así el orden se lee también por color.
const BAR_TONES = ["bg-brand", "bg-brand/80", "bg-mint", "bg-mint/80", "bg-mint/60"];

export function TopRankingCard({ title, emptyLabel, rows }: { title: string; emptyLabel: string; rows: RankingRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate/70">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, i) => (
            <li key={row.id} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-right text-xs font-semibold text-slate/70 tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink">{row.label}</span>
                  {row.sublabel && <span className="shrink-0 text-xs text-slate/70">{row.sublabel}</span>}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-deep">
                  <div
                    className={`h-full rounded-full ${BAR_TONES[i] ?? "bg-mint/60"}`}
                    style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-paper-deep px-2.5 py-1 text-xs font-semibold text-ink tabular-nums">
                {row.badge}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
