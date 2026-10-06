// Mockup animado del panel de Zenzia para el hero de la landing. Es solo
// CSS (sin datos reales, sin JS) — las animaciones viven en app/globals.css
// bajo "Dashboard mockup (landing)". Tercera piel: tarjeta clara con
// sombra suave y acento violeta, a tono con la identidad nueva de la web
// pública (ver app/page.tsx) — mismo marcado y animaciones que antes,
// solo con los tokens .mk actuales.

const STATS = [
  { label: "Citas hoy", value: "12", delta: "+3" },
  { label: "Leads nuevos", value: "4", delta: "+2" },
  { label: "Facturación (mes)", value: "2.480€", delta: "+18%" },
];

const BARS = [38, 58, 46, 74, 52, 88, 64];

export default function DashboardMockup() {
  return (
    <div className="dm-window border border-mk-line bg-mk-bg shadow-xl shadow-mk-accent/10">
      <div className="dm-titlebar border-mk-line bg-mk-raised">
        <span className="dm-dot bg-mk-coral" />
        <span className="dm-dot bg-mk-amber" />
        <span className="dm-dot bg-mk-teal" />
        <span className="dm-titlebar-label text-mk-muted">app.zenzia.es</span>
      </div>

      <div className="dm-body">
        <div className="dm-stats">
          {STATS.map((s) => (
            <div key={s.label} className="dm-stat border-mk-line">
              <div className="dm-stat-label text-mk-muted">{s.label}</div>
              <div className="dm-stat-value text-mk-ink">{s.value}</div>
              <div className="dm-stat-delta text-mk-teal">{s.delta}</div>
            </div>
          ))}
        </div>

        <div className="dm-chart">
          {BARS.map((h, i) => (
            <span
              key={i}
              className={`dm-bar ${i === BARS.length - 2 ? "bg-mk-accent" : "bg-mk-accent-dim"}`}
              style={{
                height: `${h}%`,
                animationDelay: `${i * 0.12}s, ${0.6 + i * 0.15}s`,
              }}
            />
          ))}
        </div>

        <div className="dm-toast border-mk-line bg-mk-raised">
          <span className="dm-toast-dot bg-mk-teal" />
          <div>
            <div className="dm-toast-title text-mk-ink">Nuevo lead</div>
            <div className="dm-toast-sub text-mk-muted">Laura M. · hace un momento</div>
          </div>
        </div>
      </div>
    </div>
  );
}
