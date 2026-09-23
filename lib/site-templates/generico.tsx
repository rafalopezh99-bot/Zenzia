import type { SiteTemplateComponent } from "./types";

// Plantilla "generico": el layout original con el que arrancó el módulo
// Mi Web. Sirve de plantilla por defecto y de red de seguridad cuando un
// company_modules apunta a un template_key que todavía no existe.
const Generico: SiteTemplateComponent = ({ data: d, accentColor }) => {
  const services = d.services ?? [];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111" }}>
      <header style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #eee" }}>
        <strong>{d.brand}</strong>
      </header>

      <section style={{ background: accentColor, color: "#fff", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ margin: "0 0 12px" }}>{d.heroTitle}</h1>
        <p style={{ margin: "0 0 20px", opacity: 0.9 }}>{d.heroSub}</p>
        {d.heroCta && (
          <a
            href={d.whatsapp ? `https://wa.me/${String(d.whatsapp).replace(/\D/g, "")}` : "#"}
            style={{ background: "#fff", color: "#111", padding: "10px 20px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}
          >
            {d.heroCta}
          </a>
        )}
      </section>

      {services.length > 0 && (
        <section style={{ padding: "32px 24px" }}>
          <h2 style={{ textAlign: "center", fontSize: 14, textTransform: "uppercase", color: "#666" }}>Servicios</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginTop: 16 }}>
            {services.map((s, i) => (
              <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <b style={{ display: "block", marginBottom: 4 }}>{s.name}</b>
                <span style={{ fontSize: 13, color: "#555" }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.about && <section style={{ padding: "0 24px 32px", color: "#444", fontSize: 14, lineHeight: 1.6 }}>{d.about}</section>}

      <section style={{ background: "#f7f7f6", padding: "24px" }}>
        <b>Contacto</b>
        <div>{d.phone}</div>
        <div>{d.address}</div>
      </section>

      <footer style={{ padding: "16px 24px", fontSize: 12, color: "#888", display: "flex", justifyContent: "space-between" }}>
        <span>{d.instagram}</span>
        <span>{d.copyright}</span>
      </footer>
    </div>
  );
};

export default Generico;
