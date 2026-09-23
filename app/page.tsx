import { VERTICAL_CATALOG, VERTICAL_CATEGORIES } from "@/lib/verticals";
import { FONT_SANS, FONT_SERIF, PAPER, PAPER_DEEP, INK, SLATE, LINE, BLUE, BLUE_PALE, MINT } from "@/lib/marketing-theme";
import { Mono, MarketingHeader, MarketingFooter } from "@/components/marketing-ui";
import LandingContactForm from "@/components/LandingContactForm";
import DashboardMockup from "@/components/DashboardMockup";

// Landing pública de Zenzia (dominio raíz, zenzia.es). Identidad "Calma con
// autoridad": índigo + salvia sobre crema, titulares en Georgia, sin la
// voz "de código" (acceder(), monoespaciada por todas partes) de la
// versión anterior con estética RL Digital Studios. Secciones nuevas
// frente a la versión previa: "Servicios" (resumen de alto nivel) y
// "Automatizaciones" (problema → solución) — el resto (funcionalidades,
// pasos, sectores, comparación, contacto) es contenido ya existente,
// solo re-vestido con la paleta nueva. Vive fuera de (dashboard) y no
// requiere sesión.

const SERVICIOS = [
  { icon: "◎", title: "CRM de clientes", body: "Ficha completa de cada cliente: contacto, historial y notas en un mismo sitio." },
  { icon: "€", title: "Gestión de pagos", body: "Presupuestos, facturas y cobros recurrentes, con avisos de impago automáticos." },
  { icon: "▤", title: "Calendario centralizado", body: "Coordina citas, recordatorios y disponibilidad en un único calendario." },
  { icon: "⚡", title: "Automatizaciones", body: "Reglas que generan facturas, citas y avisos solos, sin que tengas que acordarte." },
  { icon: "▦", title: "Fichas y documentación", body: "Fichas de vehículo, fotos de antes y después, y consentimientos firmados." },
  { icon: "◐", title: "Mi Web", body: "Tu propia web, editable por ti mismo, sin depender de nadie para cambiarla." },
];

const FEATURES = [
  {
    n: "01",
    title: "Agenda y citas",
    body: "Calendario semanal y mensual, con el estado de cada cita a la vista. Nada se te escapa por tener la agenda repartida entre el móvil y la cabeza.",
  },
  {
    n: "02",
    title: "Contactos y seguimiento",
    body: "Ficha de cada cliente con la etapa por la que va pasando (lead, contactado, propuesta, cliente) y un resumen de cada conversación que has tenido con él.",
  },
  {
    n: "03",
    title: "Presupuestos y facturación",
    body: "Presupuestos, órdenes de trabajo y facturas simples, siempre ligados al contacto correspondiente. Todo en el mismo sitio donde vive el resto de su historial.",
  },
  {
    n: "04",
    title: "Fotos y consentimientos",
    body: "Galería antes/después y documentos firmados, para los negocios que los necesitan: estética, tatuajes, clínicas dentales, fisioterapia.",
  },
  {
    n: "05",
    title: "Bonos y paquetes",
    body: "Control de sesiones prepagadas para quien vende packs o bonos: cuántas quedan, cuántas se han usado, sin hojas de cálculo sueltas.",
  },
  {
    n: "06",
    title: "Configurado para tu sector",
    body: "Al entrar por primera vez eliges a qué te dedicas y Zenzia activa solo lo que te hace falta. Nada de módulos a medio usar estorbando en el menú.",
  },
];

const AUTOMATIZACIONES = [
  {
    problem: "Se me olvida pasar la factura del bono cada mes.",
    solution: "Facturación recurrente",
    body: "Genera y cobra las facturas de bonos y suscripciones cada mes, sin que muevas un dedo.",
  },
  {
    problem: "Me entero tarde de que un cliente no ha pagado.",
    solution: "Avisos de impago",
    body: "Te avisa en cuanto una factura no se cobra, para que actúes a tiempo.",
  },
  {
    problem: "Llevo la cuenta de las sesiones de cada bono a mano.",
    solution: "Consumo de bonos",
    body: "Cada sesión que usa un cliente se descuenta sola de su bono, sin apuntarlo a mano.",
  },
  {
    problem: "Creo cada cita de una clase semanal una a una.",
    solution: "Citas recurrentes",
    body: "Genera solas las citas de una clase o revisión periódica, sin crearlas una a una.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Cuéntanos tu negocio",
    body: "Nos dices a qué te dedicas y cómo trabajas ahora mismo: con Excel, WhatsApp, papel, o un poco de todo.",
  },
  {
    n: "02",
    title: "Lo configuramos a tu medida",
    body: "Te damos de alta y, al entrar, un asistente rápido activa los módulos de tu sector y deja tu cuenta lista para trabajar.",
  },
  {
    n: "03",
    title: "Empiezas a gestionar",
    body: "Entras a tu panel, ya con tu nombre y tu negocio configurados, y a partir de ahí todo queda centralizado en un solo sitio.",
  },
];

const CARD_HOVER = "transition-transform duration-200 hover:scale-[1.03]";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: PAPER, color: INK, fontFamily: FONT_SANS }}>
      <MarketingHeader />

      {/* ============ HERO ============ */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span
              className="mb-5 inline-block rounded-full px-3 py-1.5 text-[11px] uppercase tracking-wide"
              style={{ color: MINT, backgroundColor: "#E3EBE5" }}
            >
              Un producto de RL Digital Studios
            </span>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.15] sm:text-5xl" style={{ fontFamily: FONT_SERIF }}>
              El CRM que mete <span style={{ color: BLUE }}>orden</span> donde hoy hay caos
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed" style={{ color: SLATE }}>
              Agenda, clientes, facturación y hasta tu propia web, todo en un solo panel hecho a medida para tu tipo
              de negocio. Sin hojas de cálculo sueltas ni WhatsApps perdidos.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#contacto"
                className={`rounded-lg px-6 py-3 text-sm font-semibold text-white ${CARD_HOVER}`}
                style={{ backgroundColor: INK }}
              >
                Pedir una demo
              </a>
            </div>
          </div>

          <DashboardMockup />
        </div>
      </section>

      {/* ============ SERVICIOS ============ */}
      <section id="servicios" className="border-t" style={{ borderColor: LINE, backgroundColor: PAPER_DEEP }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: FONT_SERIF }}>
              Todo lo que necesita tu negocio, en un mismo sitio
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: SLATE }}>
              De la ficha del cliente al cobro de la factura, pasando por la agenda y los avisos que antes tenías
              que recordar tú.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICIOS.map((s) => (
              <div
                key={s.title}
                className={`flex min-h-[220px] flex-col rounded-2xl border p-7 ${CARD_HOVER}`}
                style={{ borderColor: LINE, backgroundColor: PAPER }}
              >
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: "#E3EBE5", color: MINT }}
                >
                  {s.icon}
                </div>
                <h3 className="text-[15px] font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: SLATE }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FUNCIONALIDADES ============ */}
      <section id="funcionalidades" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl" style={{ fontFamily: FONT_SERIF }}>
          Activa solo lo que tu negocio necesita
        </h2>
        <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.n}>
              <span className="text-xs" style={{ fontFamily: FONT_SERIF, color: BLUE }}>
                N.º {f.n}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: SLATE }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ AUTOMATIZACIONES ============ */}
      <section id="automatizaciones" className="border-t" style={{ borderColor: LINE, backgroundColor: PAPER_DEEP }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: FONT_SERIF }}>
              Cosas que Zenzia hace sola, sin que tengas que acordarte
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: SLATE }}>
              No es solo un sitio donde apuntar datos: hay tareas que antes hacías a mano y que ahora pasan solas.
            </p>
          </div>
          <p
            className="mx-auto mt-8 max-w-lg border-y py-5 text-center text-xl"
            style={{ borderColor: LINE, fontFamily: FONT_SERIF }}
          >
            Cuéntanos tu problema. Te enseñamos la solución.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AUTOMATIZACIONES.map((a) => (
              <div
                key={a.solution}
                className={`rounded-2xl border p-6 ${CARD_HOVER}`}
                style={{ borderColor: LINE, backgroundColor: PAPER }}
              >
                <span
                  className="mb-3 inline-block rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: BLUE_PALE, color: BLUE }}
                >
                  Automático
                </span>
                <p className="text-[12.5px] italic leading-relaxed" style={{ color: SLATE }}>
                  &quot;{a.problem}&quot;
                </p>
                <p className="mt-3 text-sm font-semibold" style={{ color: BLUE }}>
                  → {a.solution}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: SLATE }}>
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl" style={{ fontFamily: FONT_SERIF }}>
          De la primera llamada a usarlo, sin fricción
        </h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="text-3xl" style={{ fontFamily: FONT_SERIF, color: BLUE }}>
                {s.n}
              </span>
              <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: SLATE }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SECTORES ============ */}
      <section id="sectores" className="border-t" style={{ borderColor: LINE, backgroundColor: PAPER_DEEP }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl" style={{ fontFamily: FONT_SERIF }}>
            Pensado para todo tipo de negocios
          </h2>
          <p className="mt-4 max-w-xl text-sm" style={{ color: SLATE }}>
            Desde una clínica hasta un taller: eliges tu sector al darte de alta y Zenzia activa lo habitual para
            ese tipo de negocio. Después ajustas lo que quieras.
          </p>

          <div className="mt-12 space-y-10">
            {VERTICAL_CATEGORIES.map((category) => (
              <div key={category}>
                <span className="text-xs uppercase tracking-widest" style={{ color: SLATE }}>
                  {category}
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {VERTICAL_CATALOG.filter((v) => v.category === category).map((v) => (
                    <span
                      key={v.key}
                      className={`rounded-full border px-3 py-1.5 text-sm ${CARD_HOVER}`}
                      style={{ borderColor: LINE, backgroundColor: PAPER }}
                    >
                      {v.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ANTES / CON ZENZIA ============ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl" style={{ fontFamily: FONT_SERIF }}>
          Deja de repartir tu negocio entre cinco sitios
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border p-6" style={{ borderColor: LINE }}>
            <span className="text-xs uppercase tracking-widest" style={{ color: SLATE }}>
              Ahora mismo
            </span>
            <ul className="mt-4 space-y-3 text-sm" style={{ color: SLATE }}>
              <li>Agenda en el móvil, aparte de todo lo demás</li>
              <li>Conversaciones y acuerdos sueltos en WhatsApp</li>
              <li>Presupuestos en un Excel que solo entiendes tú</li>
              <li>Facturas sueltas, cada una en su sitio</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-6" style={{ borderColor: MINT, backgroundColor: "#E3EBE5" }}>
            <span className="text-xs uppercase tracking-widest" style={{ color: MINT }}>
              Con Zenzia
            </span>
            <ul className="mt-4 space-y-3 text-sm" style={{ color: INK }}>
              <li>Agenda, contactos, presupuestos y facturas en un solo panel</li>
              <li>El historial de cada cliente, siempre a mano</li>
              <li>Accesible desde cualquier dispositivo con conexión</li>
              <li>Configurado desde el primer día para tu sector</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ CONTACTO ============ */}
      <section id="contacto" className="border-t" style={{ borderColor: LINE, backgroundColor: PAPER_DEEP }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl" style={{ fontFamily: FONT_SERIF }}>
            ¿Quieres Zenzia en tu negocio?
          </h2>
          <p className="mt-4 max-w-xl text-sm" style={{ color: SLATE }}>
            Cuéntanos a qué te dedicas y te preparamos una demo con tu propio panel ya configurado.
          </p>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-xs uppercase tracking-widest" style={{ color: SLATE }}>
                  Email
                </span>
                <div className="mt-1 text-sm">rldigitalstudios1@gmail.com</div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest" style={{ color: SLATE }}>
                  Instagram
                </span>
                <div className="mt-1 text-sm">@rldigitalstudios</div>
              </div>
            </div>

            <LandingContactForm />
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
