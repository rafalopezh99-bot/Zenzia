import { FONT_MONO, INK, SLATE, LINE, BLUE, BLUE_PALE, PAPER, PAPER_DEEP, MINT } from "@/lib/marketing-theme";

// Mockup animado del panel de Zenzia para el hero de la landing. Es solo
// CSS (sin datos reales, sin JS) — las animaciones (barras que "respiran",
// aviso de lead que entra y sale en bucle, punto que parpadea) viven en
// app/globals.css bajo "Dashboard mockup (landing)". Datos de ejemplo,
// no conectados a ninguna cuenta real.

const STATS = [
  { label: "Citas hoy", value: "12", delta: "+3" },
  { label: "Leads nuevos", value: "4", delta: "+2" },
  { label: "Facturación (mes)", value: "2.480€", delta: "+18%" },
];

const BARS = [38, 58, 46, 74, 52, 88, 64];

export default function DashboardMockup() {
  return (
    <div className="dm-window" style={{ borderColor: LINE, backgroundColor: "#FFFFFF" }}>
      <div className="dm-titlebar" style={{ borderColor: LINE, backgroundColor: PAPER_DEEP }}>
        <span className="dm-dot" style={{ backgroundColor: "#E4877B" }} />
        <span className="dm-dot" style={{ backgroundColor: "#E8C468" }} />
        <span className="dm-dot" style={{ backgroundColor: MINT }} />
        <span className="dm-titlebar-label" style={{ fontFamily: FONT_MONO, color: SLATE }}>
          app.zenzia.es
        </span>
      </div>

      <div className="dm-body">
        <div className="dm-stats">
          {STATS.map((s) => (
            <div key={s.label} className="dm-stat" style={{ borderColor: LINE }}>
              <div className="dm-stat-label" style={{ fontFamily: FONT_MONO, color: SLATE }}>
                {s.label}
              </div>
              <div className="dm-stat-value" style={{ color: INK }}>
                {s.value}
              </div>
              <div className="dm-stat-delta" style={{ color: BLUE }}>
                {s.delta}
              </div>
            </div>
          ))}
        </div>

        <div className="dm-chart">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="dm-bar"
              style={{
                height: `${h}%`,
                backgroundColor: i === BARS.length - 2 ? BLUE : BLUE_PALE,
                animationDelay: `${i * 0.12}s, ${0.6 + i * 0.15}s`,
              }}
            />
          ))}
        </div>

        <div className="dm-toast" style={{ borderColor: LINE, backgroundColor: PAPER }}>
          <span className="dm-toast-dot" style={{ backgroundColor: MINT }} />
          <div>
            <div className="dm-toast-title" style={{ color: INK }}>
              Nuevo lead
            </div>
            <div className="dm-toast-sub" style={{ fontFamily: FONT_MONO, color: SLATE }}>
              Laura M. · hace un momento
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
