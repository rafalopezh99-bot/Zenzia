"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Gráfica de barras para facturación mensual/anual. Los colores no se
// pasan como hex: se leen las variables CSS del tema (--color-brand/
// --color-line/--color-slate) directamente como valor de "fill"/"stroke" —
// los navegadores modernos resuelven var() dentro de atributos SVG, así
// que la gráfica cambia sola de claro a oscuro igual que el resto del
// panel, sin JS que escuche el cambio de tema.
export function BillingBarChart({ data }: { data: { label: string; total: number }[] }) {
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return <div className="flex h-56 items-center justify-center text-sm text-slate/70">Todavía no hay facturas pagadas en este periodo.</div>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-slate)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-line)" }}
          />
          <YAxis
            tick={{ fill: "var(--color-slate)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k €` : `${v} €`)}
          />
          <Tooltip
            cursor={{ fill: "var(--color-paper-deep)" }}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: 12,
              fontSize: 13,
              color: "var(--color-ink)",
            }}
            labelStyle={{ color: "var(--color-slate)", marginBottom: 4 }}
            formatter={(value) => [`${Number(value ?? 0).toFixed(2)} €`, "Facturado"]}
          />
          <Bar dataKey="total" fill="var(--color-brand)" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
