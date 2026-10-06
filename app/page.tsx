import { VERTICAL_CATEGORIES, VERTICAL_CATALOG } from "@/lib/verticals";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-ui";
import LandingContactForm from "@/components/LandingContactForm";
import DashboardMockup from "@/components/DashboardMockup";
import FeatureTabs, { type TabDef } from "@/components/FeatureTabs";

// Contenido de la sección de precios. Los límites reales que aplica el
// panel están en lib/plans.ts — si cambian allí, actualizar aquí también.
const PLANS = [
  {
    name: "Start",
    claim: "Organiza tus clientes, tu agenda y tus cobros.",
    price: 29,
    from: false,
    setup: "Sin cuota de implantación",
    includes: null,
    features: [
      "Clientes con ficha y notas · 30 nuevos/mes",
      "Agenda de citas",
      "Facturas en PDF · 30/mes",
      "Dashboard con tus números",
      "1 usuario",
    ],
    cta: "Quiero Start",
    featured: false,
  },
  {
    name: "Smart",
    claim: "Recibe reservas online y olvídate de los recordatorios.",
    price: 59,
    from: false,
    setup: "Implantación: 290 €",
    includes: "Todo lo de Start, más:",
    features: [
      "Reservas online 24/7",
      "Recordatorios de citas por email",
      "Todos los módulos de tu sector",
      "Notificaciones de contactos web",
      "150 clientes y facturas/mes",
      "Presupuestos · 50/mes",
      "Gráficas de facturación completas",
      "Proveedores · 3 usuarios",
    ],
    cta: "Quiero Smart",
    featured: true,
  },
  {
    name: "Pro",
    claim: "Te digitalizamos el negocio y lo mantenemos.",
    price: 119,
    from: true,
    setup: "Implantación: desde 690 €",
    includes: "Todo lo de Smart, más:",
    features: [
      "Web profesional conectada a Zenzia",
      "Recordatorios por WhatsApp",
      "Todo ilimitado",
      "Usuarios ilimitados",
      "Auditoría y automatizaciones a medida",
      "Mantenimiento y soporte prioritario",
      "Hosting y dominio el primer año",
    ],
    cta: "Solicitar auditoría",
    featured: false,
  },
];

// Landing pública de Zenzia (dominio raíz, zenzia.es). Quinta versión del
// rediseño 2026. Rafa pidió esta vez calcar la ARQUITECTURA de
// monday.com/crm sección por sección (no solo "inspirarse" como la v4):
// cabecera con CTA repetido, hero con selector de sector + captura de
// producto, panel de capacidades en pestañas, banda de personalización,
// panel de funcionalidades en pestañas, proceso de principio a fin, banda
// final con captura de producto + CTA, pie de página.
//
// Lo que NO se calca, por una razón concreta en cada caso:
// - El texto de monday.com es suyo y está protegido por derechos de autor
//   — aquí todo el copy es original de Zenzia, solo sigue el mismo tipo
//   de titular/ritmo que el suyo, sección por sección.
// - La franja de "logos de clientes conocidos" (Uber, Coca-Cola...) no se
//   reproduce: Zenzia no tiene esos clientes, y poner logos ajenos sería
//   falso.
// - La insignia "+1.000 reseñas en G2" tampoco: Zenzia no tiene reseñas
//   en G2, inventar esa cifra sería engañoso.
// - El pie de página mega-column (Carreras, Prensa, Partners...) no
//   aplica a un producto de una sola persona — se queda en el pie simple
//   y honesto de siempre.
// Todo el contenido real (módulos, automatizaciones, sectores) es el
// mismo que en las versiones anteriores. Vive fuera de (dashboard) y no
// requiere sesión.

const HERO_SECTORES = ["nutricion", "psicologia", "entrenador_personal", "fisio", "coaching", "academia", "peluqueria", "pilates_yoga"];

const CAPACIDADES_TABS: TabDef[] = [
  {
    key: "bono",
    label: "Bonos",
    color: "coral",
    title: "Los bonos se descuentan solos",
    body: "Cada sesión que usa un cliente se resta de su bono en el momento, sin que tengas que apuntarlo tú a mano ni llevar la cuenta en un cuaderno.",
    bullets: ["Consumo automático por sesión", "Aviso cuando queda poco", "Sin hojas de cálculo sueltas"],
  },
  {
    key: "factura",
    label: "Facturación",
    color: "accent",
    title: "Las facturas recurrentes se generan solas",
    body: "Bonos, suscripciones y sesiones fijas: la factura del mes se crea y se asocia al contacto sin que tengas que acordarte ni montarla tú.",
    bullets: ["Facturación recurrente mensual", "Siempre ligada al contacto", "Un sitio para todo el historial"],
  },
  {
    key: "impago",
    label: "Impagos",
    color: "teal",
    title: "Te enteras de un impago en el momento",
    body: "En cuanto una factura no se cobra, te llega el aviso — no un mes después, cuando revisas el banco y ya es tarde para reclamarlo con naturalidad.",
    bullets: ["Aviso inmediato", "Historial de pagos por cliente", "Nada que revisar a mano"],
  },
  {
    key: "citas",
    label: "Citas recurrentes",
    color: "amber",
    title: "Las citas de cada semana se crean solas",
    body: "Una clase semanal, una revisión periódica: la defines una vez y Zenzia sigue creando las siguientes citas sin que repitas el proceso cada semana.",
    bullets: ["Se repiten solas", "Mismo hueco, cada semana", "Editable si cambia algo puntual"],
  },
];

const MODULOS_TABS: TabDef[] = [
  {
    key: "agenda",
    label: "Agenda",
    color: "coral",
    title: "Tu día, de un vistazo",
    body: "Calendario semanal y mensual, con el estado de cada cita a la vista. Nada se te escapa por tener la agenda repartida entre el móvil y la cabeza.",
    bullets: ["Vista semana y mes", "Estado de cada cita", "Recordatorios automáticos"],
  },
  {
    key: "clientes",
    label: "Clientes",
    color: "accent",
    title: "Cada cliente, con su historia",
    body: "Ficha de cada cliente con la etapa por la que va pasando (lead, contactado, propuesta, cliente) y un resumen de cada conversación que has tenido con él.",
    bullets: ["Ficha completa por contacto", "Etapas de seguimiento", "Historial de conversaciones"],
  },
  {
    key: "presupuestos",
    label: "Presupuestos",
    color: "teal",
    title: "Presupuestos que se convierten en factura",
    body: "Órdenes de trabajo y presupuestos simples, siempre ligados al contacto correspondiente — y cuando se aprueban, a un clic de convertirse en factura.",
    bullets: ["Ligados al contacto", "De presupuesto a factura", "Sin duplicar datos"],
  },
  {
    key: "fotos",
    label: "Fotos y consentimientos",
    color: "amber",
    title: "Documentación en condiciones",
    body: "Galería de antes/después y documentos firmados, para los negocios que los necesitan: estética, tatuajes, clínicas dentales, fisioterapia.",
    bullets: ["Galería antes/después", "Consentimientos firmados", "Todo en la ficha del cliente"],
  },
  {
    key: "miweb",
    label: "Mi Web",
    color: "coral",
    title: "Tu web, sin depender de nadie",
    body: "Una página propia, editable por ti mismo desde el panel. Y si prefieres algo a medida, te la construyo yo — conectada a tu CRM desde el primer día.",
    bullets: ["Editable desde el panel", "A medida si lo prefieres", "Leads directos a tu CRM"],
  },
];

const PIPELINE = [
  { stage: "Lead", body: "Alguien escribe desde tu web o te lo recomiendan.", color: "coral" as const },
  { stage: "Contactado", body: "Le respondes y queda registrado en su ficha.", color: "accent" as const },
  { stage: "Propuesta", body: "Le mandas presupuesto, ligado a su contacto.", color: "teal" as const },
  { stage: "Cliente", body: "Agenda, facturas y seguimiento, todo en un sitio.", color: "amber" as const },
];

const DOT: Record<string, string> = {
  coral: "bg-mk-coral",
  accent: "bg-mk-accent",
  teal: "bg-mk-teal",
  amber: "bg-mk-amber",
};
const BORDER: Record<string, string> = {
  coral: "border-mk-coral",
  accent: "border-mk-accent",
  teal: "border-mk-teal",
  amber: "border-mk-amber",
};
const TEXT: Record<string, string> = {
  coral: "text-mk-coral",
  accent: "text-mk-accent",
  teal: "text-mk-teal",
  amber: "text-mk-amber",
};

const EYEBROW = "text-xs font-bold uppercase tracking-widest text-mk-accent";
const H2 = "text-2xl font-black tracking-tight text-mk-ink sm:text-3xl";

export default function LandingPage() {
  return (
    <div className="mk min-h-screen">
      <MarketingHeader />

      {/* ============ HERO ============ */}
      <section className="border-b border-mk-line">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-14 sm:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <h1 className="max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-mk-ink sm:text-5xl">
                El CRM que se adapta a tu negocio, no al revés
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-mk-muted">
                Vende y gestiona más rápido con el panel más directo para autónomos, con automatizaciones
                que trabajan solas y tu propia web incluida.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {HERO_SECTORES.map((key) => {
                  const v = VERTICAL_CATALOG.find((x) => x.key === key)!;
                  return (
                    <a
                      key={key}
                      href="#sectores"
                      className="rounded-full border border-mk-line bg-mk-bg px-3.5 py-1.5 text-xs font-medium text-mk-muted transition hover:border-mk-accent hover:text-mk-ink"
                    >
                      {v.label}
                    </a>
                  );
                })}
                <a
                  href="#sectores"
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-mk-accent hover:underline"
                >
                  y más →
                </a>
              </div>

              <div className="mt-8">
                <a
                  href="#contacto"
                  className="inline-block rounded-full bg-mk-accent px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Pedir una demo
                </a>
                <p className="mt-2.5 text-xs text-mk-muted">✦ Te la preparo yo mismo, sin compromiso</p>
              </div>
            </div>

            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ============ CAPACIDADES (pestañas, posición "con IA" de monday) ============ */}
      <section id="automatizaciones" className="border-b border-mk-line">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <span className={EYEBROW}>Lo que hace solo</span>
          <h2 className={`mt-2 ${H2}`}>Mantén el control, sin esfuerzo</h2>
          <div className="mt-10">
            <FeatureTabs tabs={CAPACIDADES_TABS} label="Automatizaciones de Zenzia" />
          </div>
        </div>
      </section>

      {/* ============ PERSONALIZACIÓN ============ */}
      <section className="border-b border-mk-line bg-mk-raised">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <span className={EYEBROW}>Configuración</span>
          <h2 className={`mx-auto mt-2 max-w-2xl ${H2}`}>Personaliza en minutos, según tu sector</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mk-muted">
            Nada de empezar desde cero: eliges a qué te dedicas y Zenzia activa los módulos que de verdad vas a
            usar. Ajustas lo que quieras después, sin tocar código ni pedirle nada a nadie.
          </p>
          <a
            href="#contacto"
            className="mt-6 inline-block rounded-full border border-mk-ink px-6 py-2.5 text-sm font-semibold text-mk-ink transition hover:bg-mk-ink hover:text-white"
          >
            Pedir una demo
          </a>
        </div>
      </section>

      {/* ============ FUNCIONALIDADES (pestañas) ============ */}
      <section id="funcionalidades" className="border-b border-mk-line">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <span className={EYEBROW}>Funcionalidades</span>
          <h2 className={`mt-2 ${H2}`}>Todo lo que necesita tu negocio, en un mismo sitio</h2>
          <div className="mt-10">
            <FeatureTabs tabs={MODULOS_TABS} label="Funcionalidades de Zenzia" />
          </div>
        </div>
      </section>

      {/* ============ DESARROLLO WEB ============ */}
      <section id="desarrollo-web" className="border-b border-mk-line bg-mk-raised">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <span className={EYEBROW}>Desarrollo web</span>
              <h2 className={`mt-2 ${H2}`}>Tu negocio, también en la web</h2>
              <p className="mt-4 text-sm leading-relaxed text-mk-muted">
                Igual que con el CRM, nada de plantillas genéricas: una web pensada para cómo trabajas, conectada
                con el resto de tu gestión.
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {[
                { t: "Tu web incluida", b: "El módulo Mi Web, editable por ti mismo desde el panel.", c: "coral" as const },
                { t: "A medida, si lo prefieres", b: "Te la diseño y construyo yo, igual que a otros negocios.", c: "teal" as const },
                { t: "Conectada con tu CRM", b: "Quien te escribe entra directo como lead, sin copiar nada.", c: "amber" as const },
              ].map((item) => (
                <li key={item.t} className="flex items-start gap-3 rounded-xl border border-mk-line bg-mk-bg p-4">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[item.c]}`} />
                  <div>
                    <p className="text-sm font-bold text-mk-ink">{item.t}</p>
                    <p className="mt-0.5 text-sm text-mk-muted">{item.b}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ PROCESO DE PRINCIPIO A FIN ============ */}
      <section className="border-b border-mk-line">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <span className={EYEBROW}>De principio a fin</span>
          <h2 className={`mt-2 ${H2}`}>De primer contacto a cliente fijo, sin perder el hilo</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-4">
            {PIPELINE.map((p, i) => (
              <div key={p.stage} className="relative">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${BORDER[p.color]} font-black ${TEXT[p.color]}`}
                  >
                    {i + 1}
                  </span>
                  {i < PIPELINE.length - 1 && <span className="hidden h-0.5 flex-1 bg-mk-line sm:block" />}
                </div>
                <h3 className="mt-3 text-base font-bold text-mk-ink">{p.stage}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mk-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECTORES ============ */}
      <section id="sectores" className="border-b border-mk-line bg-mk-raised">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className={EYEBROW}>Sectores</span>
          <h2 className={`mt-2 ${H2}`}>Pensado para todo tipo de negocios</h2>
          <p className="mt-4 max-w-xl text-sm text-mk-muted">
            Desde una clínica hasta un taller: eliges tu sector al darte de alta y Zenzia activa lo habitual para
            ese tipo de negocio. Después ajustas lo que quieras.
          </p>

          <div className="mt-12 space-y-8">
            {VERTICAL_CATEGORIES.map((category, i) => {
              const color = (["coral", "accent", "teal", "amber"] as const)[i % 4];
              return (
                <div key={category}>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-mk-ink">
                    <span className={`h-2 w-2 rounded-full ${DOT[color]}`} />
                    {category}
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {VERTICAL_CATALOG.filter((v) => v.category === category).map((v) => (
                      <span
                        key={v.key}
                        className="rounded-full border border-mk-line bg-mk-bg px-3.5 py-1.5 text-sm text-mk-ink transition hover:border-mk-accent"
                      >
                        {v.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ PLANES ============ */}
      <section id="planes" className="border-b border-mk-line">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className={EYEBROW}>Planes</span>
          <h2 className={`mt-2 ${H2}`}>Un único precio por negocio</h2>
          <p className="mt-4 max-w-xl text-sm text-mk-muted">Sin pagar por usuario. Empieza en Start y crece cuando lo necesites.</p>
          <div className="mt-12 grid overflow-hidden rounded-3xl border border-mk-line md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col border-mk-line p-8 md:border-r md:last:border-r-0 ${p.featured ? "bg-mk-raised" : "bg-mk-bg"}`}
              >
                {p.featured && (
                  <span className="absolute left-8 top-4 rounded-full bg-mk-coral px-3 py-1 text-[11px] font-bold tracking-wider text-white">
                    RECOMENDADO
                  </span>
                )}
                <span className="mt-4 text-sm font-bold text-mk-coral">Zenzia {p.name}</span>
                <h3 className="mt-2 min-h-[3.5rem] text-lg font-bold text-mk-ink">{p.claim}</h3>
                <div className="mt-4 text-4xl font-black text-mk-accent">
                  {p.from && <span className="mr-1 text-sm text-mk-coral">Desde</span>}
                  {p.price} €<span className="ml-1 text-sm font-normal text-mk-muted">/mes</span>
                </div>
                <p className="mt-1 text-xs text-mk-muted">{p.setup}</p>
                {p.includes && <p className="mt-6 text-sm font-bold text-mk-accent">{p.includes}</p>}
                <ul className={`${p.includes ? "mt-2" : "mt-6"} flex-1 space-y-2 text-sm text-mk-ink`}>
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="font-bold text-mk-coral">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contacto"
                  className={`mt-8 rounded-xl px-4 py-3 text-center text-sm font-bold ${
                    p.featured ? "bg-mk-accent text-white" : "border border-mk-line text-mk-ink"
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ZENZIA EN ACCIÓN (posición "vídeo/demo" de monday) ============ */}
      <section className="bg-mk-ink">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-mk-amber">Zenzia en acción</span>
          <h2 className="mx-auto mt-2 max-w-xl text-2xl font-black tracking-tight text-white sm:text-3xl">
            Así se ve un negocio con Zenzia dentro
          </h2>
          <div className="mx-auto mt-10 max-w-xl text-left">
            <DashboardMockup />
          </div>
          <a
            href="#contacto"
            className="mt-10 inline-block rounded-full bg-mk-accent px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Pedir una demo
          </a>
        </div>
      </section>

      {/* ============ CONTACTO ============ */}
      <section id="contacto">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className={EYEBROW}>Hablamos</span>
          <h2 className={`mt-2 ${H2}`}>¿Organizamos tu negocio?</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-mk-muted">
            Cuéntame a qué te dedicas y te preparo una demo con tu panel ya configurado — te contesto yo mismo,
            normalmente en menos de 24 horas.
          </p>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-mk-muted">Email</span>
              <div className="mt-1 text-sm text-mk-ink">zenzia.co@gmail.com</div>
            </div>

            <LandingContactForm />
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
