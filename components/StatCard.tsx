import { Card } from "@/components/ui";
import type { IconComponent } from "@/components/icons";

// Tarjeta de estadística con icono — mismo patrón que los dashboards tipo
// admin (icono en una placa de color + número grande + etiqueta), pero con
// los únicos dos acentos de marca de Zenzia (navy/celeste) en vez de un
// color distinto por tarjeta: la placa cambia de intensidad, no de tono,
// así las 5 estadísticas se leen como un mismo sistema, no como iconos
// sueltos. "tone" solo se sale de esa regla para dinero (verde, igual que
// el resto de la app marca lo cobrado) y avisos (ámbar).
const TONE_CLASSES: Record<"brand" | "mint" | "money" | "amber" | "slate", string> = {
  brand: "bg-brand text-white",
  mint: "bg-mint text-white",
  money: "bg-emerald-500 text-white dark:bg-emerald-500/90",
  amber: "bg-amber-500 text-white dark:bg-amber-500/90",
  slate: "bg-paper-deep text-slate",
};

export function StatCard({
  icon: Icon,
  value,
  label,
  tone = "brand",
}: {
  icon: IconComponent;
  value: string | number;
  label: string;
  tone?: "brand" | "mint" | "money" | "amber" | "slate";
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
        <Icon />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-semibold text-ink">{value}</div>
        <div className="text-sm leading-snug text-slate">{label}</div>
      </div>
    </Card>
  );
}
