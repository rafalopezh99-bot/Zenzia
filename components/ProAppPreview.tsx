// Vista de Zenzia Pro por dentro para la web pública. Reproduce el panel real
// (menú, próxima cita, cifras, agenda y avisos) con datos de ejemplo.
const NAV: [string, string][] = [
  ["Dashboard", "M3 11l9-8 9 8M5 10v10h14V10"],
  ["Pacientes", "M16 20v-2a4 4 0 0 0-8 0v2M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"],
  ["Estadísticas", "M4 19l5-6 4 3 7-9"],
  ["Notificaciones", "M18 16V11a6 6 0 0 0-12 0v5l-2 2h16zM10 21h4"],
  ["Agenda", "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4"],
  ["Historial", "M6 3h9l4 4v14H6zM9 12h6M9 16h6"],
  ["Seguimiento", "M3 12h4l3-7 4 14 3-7h4"],
  ["Bonos", "M4 7h16v4a2 2 0 0 0 0 4v2H4v-2a2 2 0 0 0 0-4z"],
  ["Facturación", "M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21zM10 8h4M10 12h4"],
  ["Cobros", "M3 7h18v11H3zM3 11h18"],
  ["Mi web", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"],
];
const STATS = [
  ["128", "Pacientes activos"],
  ["5", "Próximas citas"],
  ["2", "Notificaciones nuevas"],
  ["4.280,00 €", "Ganado este mes"],
];
const CITAS = [
  ["09:00", "Sara Molina", "Fisioterapia"],
  ["10:00", "Javier Ruiz", "Sesión de bono"],
  ["10:45", "Elena Campos", "Valoración inicial"],
  ["11:30", "Pablo Núñez", "Punción seca"],
  ["16:00", "Marta Gil", "Suelo pélvico"],
];
const AVISOS = [
  ["2 facturas sin cobrar", "130,00 € en total"],
  ["1 cita sin cobrar", "Ya ha pasado y no consta el cobro"],
  ["2 notificaciones nuevas", "Reservas y avisos por revisar"],
];

export default function ProAppPreview() {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-2xl border border-mk-line bg-white shadow-xl">
        <div className="flex items-center gap-2 border-b border-mk-line bg-mk-raised px-4 py-2.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-mk-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-mk-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-mk-line" />
          <span className="ml-2 text-xs text-mk-muted">app.zenzia.es/dashboard</span>
        </div>
        <div className="flex text-left text-[#0b2a4a]">
          <div className="hidden w-52 shrink-0 flex-col gap-0.5 bg-[#0b2a4a] p-3 text-[13px] text-[#dce7f1] md:flex" aria-hidden="true">
            <div className="px-2.5 pb-3 pt-1 text-2xl font-semibold tracking-tight text-white">
              Zenz<span className="text-[#5fc2ef]">ia</span>
            </div>
            {NAV.map(([label, d], i) => (
              <div key={label} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-medium ${i === 0 ? "bg-[#163e6e] text-white" : ""}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                  <path d={d} />
                </svg>
                {label}
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-1 bg-[#f4f8fb] p-4 sm:p-6">
            <div className="text-xl font-bold tracking-tight sm:text-2xl">¡Hola, Laura!</div>
            <div className="mt-3 rounded-2xl bg-[#0b2a4a] p-4 text-[#dce7f1] sm:max-w-md">
              <div className="text-xs text-[#c5d6e6]">Tu próxima cita · lun, 2 nov, 09:00</div>
              <div className="mt-0.5 text-lg font-semibold text-white">Sara Molina</div>
              <div className="text-sm">Fisioterapia</div>
              <div className="mt-3 flex gap-2 text-center text-xs font-semibold">
                <span className="flex-1 rounded-lg bg-white py-2 text-[#0b2a4a]">Ver ficha</span>
                <span className="flex-1 rounded-lg border border-[#5f7f9e] py-2 text-white">WhatsApp</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {STATS.map(([value, label]) => (
                <div key={label} className="rounded-xl border border-[#dce7f1] bg-white p-3">
                  <div className="text-lg font-bold tabular-nums">{value}</div>
                  <div className="text-xs text-[#4d6880]">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-5">
              <div className="rounded-xl border border-[#dce7f1] bg-white p-4 lg:col-span-3">
                <div className="mb-1 text-sm font-semibold">Agenda de hoy</div>
                {CITAS.map(([hour, name, service]) => (
                  <div key={hour} className="flex items-center gap-3 border-t border-[#edf3f8] py-1.5 first-of-type:border-t-0">
                    <span className="w-11 shrink-0 text-xs font-semibold tabular-nums">{hour}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{name}</span>
                      <span className="block truncate text-[11px] text-[#4d6880]">{service}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[#dce7f1] bg-white p-4 lg:col-span-2">
                <div className="mb-1 text-sm font-semibold">Necesita tu atención</div>
                {AVISOS.map(([title, sub]) => (
                  <div key={title} className="flex items-center justify-between gap-2 border-t border-[#edf3f8] py-2 first-of-type:border-t-0">
                    <span className="min-w-0">
                      <span className="block text-xs font-medium">{title}</span>
                      <span className="block text-[11px] text-[#4d6880]">{sub}</span>
                    </span>
                    <span className="shrink-0 rounded-md bg-[#e3ecf6] px-2 py-1 text-[11px] font-semibold text-[#163e6e]">Ver</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-mk-muted">Zenzia Pro por dentro. Datos de ejemplo.</figcaption>
    </figure>
  );
}
