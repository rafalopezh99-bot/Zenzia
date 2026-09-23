import type { SiteTemplateComponent } from "./types";

// Plantilla "moderno_oscuro": diseño oscuro tipo agencia/tech — servicios
// numerados (N.º 01, 02...), cabecera con marca en monoespaciada, CTA en
// color de acento sobre fondo oscuro. Pensada para negocios que quieren
// una imagen más "digital" que la plantilla genérica (agencias, estudios,
// software, marcas con identidad fuerte).
const ModernoOscuro: SiteTemplateComponent = ({ data: d, accentColor }) => {
  const services = d.services ?? [];
  const waHref = d.whatsapp ? `https://wa.me/${String(d.whatsapp).replace(/\D/g, "")}` : undefined;

  return (
    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", background: "#0F1113", color: "#F5F6F5" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: "1px solid #23262a",
        }}
      >
        <strong style={{ fontSize: 15, letterSpacing: "0.02em" }}>{d.brand}</strong>
        <nav style={{ display: "flex", gap: 20, fontSize: 12, color: "#9aa0a6" }}>
          <span>Servicios</span>
          <span>Nosotros</span>
          <span>Contacto</span>
        </nav>
      </header>

      <section style={{ padding: "80px 32px 64px", maxWidth: 720 }}>
        <h1 style={{ margin: "0 0 16px", fontSize: 34, lineHeight: 1.2, fontWeight: 700 }}>{d.heroTitle}</h1>
        <p style={{ margin: "0 0 28px", color: "#9aa0a6", fontSize: 15, lineHeight: 1.6 }}>{d.heroSub}</p>
        {d.heroCta && (
          <a
            href={waHref ?? "#"}
            style={{
              display: "inline-block",
              background: accentColor,
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {d.heroCta} →
          </a>
        )}
      </section>

      {services.length > 0 && (
        <section style={{ padding: "0 32px 64px" }}>
          <h2 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9aa0a6", marginBottom: 24 }}>
            Servicios
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, background: "#23262a" }}>
            {services.map((s, i) => (
              <div key={i} style={{ background: "#0F1113", padding: "24px 20px" }}>
                <span style={{ display: "block", fontSize: 11, color: accentColor, marginBottom: 10 }}>
                  N.º {String(i + 1).padStart(2, "0")}
                </span>
                <b style={{ display: "block", marginBottom: 6, fontSize: 14 }}>{s.name}</b>
                <span style={{ fontSize: 12.5, color: "#9aa0a6", lineHeight: 1.5 }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.about && (
        <section style={{ padding: "0 32px 64px", maxWidth: 640, fontSize: 13.5, color: "#c7ccca", lineHeight: 1.7 }}>{d.about}</section>
      )}

      <section style={{ background: "#17191b", padding: "40px 32px", borderTop: "1px solid #23262a" }}>
        <b style={{ display: "block", marginBottom: 12, fontSize: 13 }}>Contacto</b>
        <div style={{ fontSize: 13, color: "#c7ccca", marginBottom: 4 }}>{d.phone}</div>
        <div style={{ fontSize: 13, color: "#c7ccca" }}>{d.address}</div>
      </section>

      <footer
        style={{
          padding: "18px 32px",
          fontSize: 11,
          color: "#6b7280",
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #23262a",
        }}
      >
        <span>{d.instagram}</span>
        <span>{d.copyright}</span>
      </footer>
    </div>
  );
};

export default ModernoOscuro;
