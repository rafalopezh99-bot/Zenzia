import type { SiteTemplateComponent } from "./types";

// Plantilla "rl_digital_studios": réplica del diseño real de
// rldigitalstudios.com (paleta, tipografía, marca entre "< />", titular
// gigante en mayúsculas con el remate en color de acento, tarjetas de
// servicio numeradas N.º 01-04, títulos de sección con palabra de fondo
// gigante). Pensada para el propio sitio de RL Digital Studios y, más
// adelante, para clientes con una identidad similar (agencias, estudios,
// marcas de perfil técnico).
const BG = "#F7F8F6";
const INK = "#0F1113";
const MUTED = "#5B6A63";
const LINE = "#D6DEDA";

function accentLastWords(title: string | undefined, accent: string, n = 2) {
  const words = (title ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const splitAt = Math.max(words.length - n, 0);
  const head = words.slice(0, splitAt).join(" ");
  const tail = words.slice(splitAt).join(" ");
  return (
    <>
      {head ? head + " " : ""}
      <span style={{ color: accent }}>{tail}</span>
    </>
  );
}

function SectionWatermark({ word }: { word: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "clamp(48px, 12vw, 140px)",
        fontWeight: 900,
        color: "#EAECE9",
        whiteSpace: "nowrap",
        letterSpacing: "-0.02em",
        userSelect: "none",
        zIndex: 0,
      }}
    >
      {word}
    </div>
  );
}

const RLDigitalStudios: SiteTemplateComponent = ({ data: d, accentColor }) => {
  const services = d.services ?? [];
  const waHref = d.whatsapp ? `https://wa.me/${String(d.whatsapp).replace(/\D/g, "")}` : undefined;
  const font = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";
  const headlineFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

  return (
    <div style={{ background: BG, color: INK, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 40px",
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <div style={{ fontFamily: font, fontSize: 15, fontWeight: 600 }}>
          <span style={{ color: accentColor }}>{"<"}</span>
          {(d.brand ?? "").split(" ")[0] || "RL"}
          <span style={{ color: accentColor }}>{"/>"}</span>{" "}
          <span style={{ color: MUTED, fontWeight: 400 }}>{(d.brand ?? "").split(" ").slice(1).join(" ")}</span>
        </div>
        <nav style={{ display: "flex", gap: 28, fontFamily: font, fontSize: 11, letterSpacing: "0.05em", color: MUTED }}>
          <span>INICIO</span>
          <span>SERVICIOS</span>
          <span>NOSOTROS</span>
          <span>CONTACTO</span>
        </nav>
        <a
          href={waHref ?? "#contacto"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${INK}`,
            borderRadius: 999,
            padding: "8px 16px",
            fontFamily: font,
            fontSize: 12,
            color: INK,
            textDecoration: "none",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, display: "inline-block" }} />
          contactar()
        </a>
      </header>

      {/* Hero */}
      <section style={{ padding: "88px 40px 64px", maxWidth: 760 }}>
        <h1
          style={{
            fontFamily: headlineFont,
            fontSize: "clamp(34px, 5.5vw, 64px)",
            fontWeight: 900,
            lineHeight: 1.05,
            textTransform: "uppercase",
            margin: "0 0 20px",
          }}
        >
          {accentLastWords(d.heroTitle, accentColor)}
        </h1>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 32px", maxWidth: 480, lineHeight: 1.6 }}>{d.heroSub}</p>
        {d.heroCta && (
          <a
            href={waHref ?? "#contacto"}
            style={{
              display: "inline-block",
              background: INK,
              color: BG,
              padding: "16px 30px",
              borderRadius: 2,
              fontFamily: font,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            {d.heroCta} →
          </a>
        )}
      </section>

      <div style={{ height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

      {/* Servicios */}
      {services.length > 0 && (
        <section style={{ position: "relative", padding: "72px 40px", overflow: "hidden" }}>
          <SectionWatermark word="SERVICIOS" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                textAlign: "center",
                fontFamily: font,
                fontSize: 12,
                letterSpacing: "0.08em",
                color: MUTED,
                marginBottom: 48,
              }}
            >
              TODO LO QUE NECESITA TU MARCA
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
              {services.map((s, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 4, padding: "26px 22px" }}>
                  <span style={{ display: "block", fontFamily: font, fontSize: 12, color: accentColor, marginBottom: 14 }}>
                    N.º {String(i + 1).padStart(2, "0")}
                  </span>
                  <b style={{ display: "block", marginBottom: 10, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.01em" }}>
                    {s.name}
                  </b>
                  <span style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nosotros */}
      {d.about && (
        <section style={{ position: "relative", padding: "72px 40px", overflow: "hidden", borderTop: `1px solid ${LINE}` }}>
          <SectionWatermark word="NOSOTROS" />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: INK }}>{d.about}</p>
          </div>
        </section>
      )}

      {/* Contacto */}
      <section id="contacto" style={{ position: "relative", padding: "72px 40px", overflow: "hidden", background: INK, color: BG }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: headlineFont, fontSize: 28, fontWeight: 800, margin: "0 0 12px", textTransform: "uppercase" }}>
            Hablemos de tu proyecto
          </h2>
          <p style={{ color: "#9aa0a6", fontSize: 14, marginBottom: 32 }}>
            Cuéntanos qué necesita tu negocio y te respondemos con una propuesta clara.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", fontFamily: font, fontSize: 13 }}>
            {d.phone && <div>{d.phone}</div>}
            {d.address && <div>{d.address}</div>}
          </div>
          {d.heroCta && waHref && (
            <a
              href={waHref}
              style={{
                display: "inline-block",
                marginTop: 32,
                background: accentColor,
                color: "#fff",
                padding: "14px 28px",
                borderRadius: 2,
                fontFamily: font,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Escríbenos por WhatsApp →
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          fontFamily: font,
          fontSize: 11,
          color: MUTED,
        }}
      >
        <span>
          <span style={{ color: accentColor }}>{"<"}</span>
          {(d.brand ?? "").split(" ")[0] || "RL"}
          <span style={{ color: accentColor }}>{"/>"}</span>
        </span>
        <span>{d.instagram}</span>
        <span>{d.copyright}</span>
      </footer>
    </div>
  );
};

export default RLDigitalStudios;
