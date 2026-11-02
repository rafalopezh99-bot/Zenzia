import { VERTICAL_CATEGORIES, VERTICAL_CATALOG } from "@/lib/verticals";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-ui";
import LandingContactForm from "@/components/LandingContactForm";
import ProAppPreview from "@/components/ProAppPreview";
import FeatureTabs, { type TabDef } from "@/components/FeatureTabs";
import { formatPlanPrice, PLANS } from "@/lib/planContent";

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
    key: "reservas",
    label: "Reservas",
    color: "coral",
    title: "Tus clientes reservan solos, a cualquier hora",
    body: "Compartes tu enlace y cada cliente ve un calendario con tus huecos libres, elige día y hora y deja sus datos. Sin cuentas ni llamadas, y la cita entra directa en tu agenda.",
    bullets: ["Horario y duración a tu medida", "Solo se ven los huecos libres", "Sin que el cliente cree una cuenta"],
  },
  {
    key: "recordatorios",
    label: "Recordatorios",
    color: "accent",
    title: "Menos citas perdidas, sin perseguir a nadie",
    body: "Cada cliente recibe por email un recordatorio antes de su cita, sin que tengas que acordarte de avisarle uno a uno.",
    bullets: ["Se envían solos", "Con los datos de cada cita", "Un olvido menos para ti"],
  },
  {
    key: "cobros",
    label: "Cobros",
    color: "teal",
    title: "Sabes quién te debe y desde cuándo",
    body: "Lo cobrado con su tick verde y lo pendiente con el tiempo que lleva sin pagarse. Y con un botón reclamas por WhatsApp, con el mensaje ya escrito.",
    bullets: ["Cobrado y pendiente, de un vistazo", "Aviso del pago más antiguo", "Reclamar por WhatsApp con un toque"],
  },
  {
    key: "resenas",
    label: "Reseñas",
    color: "amber",
    title: "Más reseñas y clientes que vuelven",
    body: "Después de la cita, Zenzia pide la reseña de Google por ti. Y te avisa de los clientes que llevan tiempo sin venir para que puedas recuperarlos.",
    bullets: ["Petición de reseña automática", "Aviso de clientes inactivos", "Disponible desde Smart"],
  },
];

const MODULOS_TABS: TabDef[] = [
  {
    key: "agenda",
    label: "Agenda",
    color: "coral",
    title: "Tu día, de un vistazo",
    body: "Vista por día, semana y mes, también desde el móvil. Si trabajáis varios, cada profesional tiene su agenda y puedes filtrarla con un toque.",
    bullets: ["Día, semana y mes", "Agenda por profesional", "Pensada también para el móvil"],
  },
  {
    key: "clientes",
    label: "Clientes",
    color: "accent",
    title: "Cada cliente, con su historia",
    body: "Ficha con sus datos, notas de cada sesión y su historial. Desde la lista le escribes por WhatsApp o email, o saltas a su próxima cita.",
    bullets: ["Notas de cada sesión", "WhatsApp y email a un toque", "Importa tus clientes desde Excel"],
  },
  {
    key: "facturas",
    label: "Facturas",
    color: "teal",
    title: "Factura sin salir de la agenda",
    body: "Cobra una cita y la factura queda hecha. Presupuestos y proformas en el mismo sitio, con facturación VeriFactu y exportación para tu gestor.",
    bullets: ["De la cita a la factura", "VeriFactu", "Presupuestos y proformas"],
  },
  {
    key: "sector",
    label: "Tu sector",
    color: "amber",
    title: "Módulos pensados para lo que haces",
    body: "Historial, seguimiento, pautas o rutinas según tu actividad. Eliges tu sector y Zenzia activa lo que de verdad vas a usar.",
    bullets: ["Historial y seguimiento", "Bonos de sesiones", "Consentimientos con firma online"],
  },
  {
    key: "asistente",
    label: "Asistente de IA",
    color: "coral",
    title: "Pregunta y Zenzia te responde",
    body: "En el plan Pro, un asistente de IA te dice qué citas tienes, te ayuda con tu agenda y te ahorra buscar entre pantallas.",
    bullets: ["Consulta tu agenda", "Te ayuda con tus clientes", "Incluido en Pro"],
  },
];

const PIPELINE = [
  { stage: "Reserva", body: "El cliente elige día y hora, o la apuntas tú.", color: "coral" as const },
  { stage: "Recordatorio", body: "Le llega un aviso antes de la cita, sin que hagas nada.", color: "accent" as const },
  { stage: "Sesión", body: "Apuntas tus notas en su ficha, con todo su historial.", color: "teal" as const },
  { stage: "Cobro", body: "Cobras, facturas y sabes qué queda pendiente.", color: "amber" as const },
];

const WEB_CARDS = [
  { t: "Diseñada para tu negocio", b: "Una web hecha a medida, sin plantillas genéricas, que explica lo que haces y funciona bien en el móvil.", c: "coral" as const },
  { t: "La editas tú, sin depender de nadie", b: "Cambias textos, fotos y álbumes, y añades secciones directamente sobre tu web, desde Zenzia.", c: "accent" as const },
  { t: "Sabes qué funciona", b: "Visitas y clics en tus enlaces en un panel sencillo, explicado para que lo entienda cualquiera.", c: "teal" as const },
  { t: "Unida a tu gestión", b: "Enlaza tu web con las reservas de Zenzia para que quien te encuentra pueda pedir cita al momento.", c: "amber" as const },
];

const WEB_STEPS = [
  { t: "Me cuentas tu proyecto", b: "Qué haces, a quién te diriges y qué quieres conseguir." },
  { t: "La diseñamos y construimos", b: "Vas viendo la web real y la ajustamos contigo." },
  { t: "La publicamos y es tuya", b: "A partir de ahí puedes cambiar sus contenidos cuando quieras." },
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
          <div>
            <div>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-mk-ink sm:text-5xl">
                Tu negocio en orden y bien visible en internet
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-mk-muted">
                Zenzia es el CRM para gestionar citas, clientes y cobros desde un solo panel. Y si necesitas web, te la
                diseño a medida para que puedas editarla tú.
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
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/registro"
                    className="inline-block rounded-full bg-mk-accent px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Probar el CRM 14 días gratis
                  </a>
                  <a
                    href="#desarrollo-web"
                    className="inline-block rounded-full border border-mk-ink px-7 py-3.5 text-sm font-semibold text-mk-ink transition hover:bg-mk-ink hover:text-white"
                  >
                    Quiero una web
                  </a>
                </div>
                <p className="mt-2.5 text-xs text-mk-muted">
                  Prueba sin tarjeta · o{" "}
                  <a href="https://wa.me/34673895732?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20Zenzia" target="_blank" rel="noopener noreferrer" className="underline hover:text-mk-ink">
                    escríbeme por WhatsApp
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-12">
              <ProAppPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ============ CAPACIDADES (pestañas, posición "con IA" de monday) ============ */}
      <section id="automatizaciones" className="border-b border-mk-line">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <span className={EYEBROW}>CRM · Lo que hace por ti</span>
          <h2 className={`mt-2 ${H2}`}>Menos tareas repetidas, más tiempo para tus clientes</h2>
          <div className="mt-10">
            <FeatureTabs tabs={CAPACIDADES_TABS} label="Automatizaciones de Zenzia" />
          </div>
        </div>
      </section>

      {/* ============ PERSONALIZACIÓN ============ */}
      <section className="border-b border-mk-line bg-mk-raised">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <span className={EYEBROW}>CRM · A tu medida</span>
          <h2 className={`mx-auto mt-2 max-w-2xl ${H2}`}>Se adapta a tu sector, no al revés</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mk-muted">
            Eliges a qué te dedicas y Zenzia activa los módulos que vas a usar. Tus horarios, tus servicios y tus
            reservas los configuras tú desde tu perfil, sin tocar código.
          </p>
          <a
            href="/registro"
            className="mt-6 inline-block rounded-full border border-mk-ink px-6 py-2.5 text-sm font-semibold text-mk-ink transition hover:bg-mk-ink hover:text-white"
          >
            Probar el CRM 14 días gratis
          </a>
        </div>
      </section>

      {/* ============ FUNCIONALIDADES (pestañas) ============ */}
      <section id="funcionalidades" className="border-b border-mk-line">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <span className={EYEBROW}>CRM · Funcionalidades</span>
          <h2 className={`mt-2 ${H2}`}>Todo tu día a día, en un mismo sitio</h2>
          <div className="mt-10">
            <FeatureTabs tabs={MODULOS_TABS} label="Funcionalidades de Zenzia" />
          </div>
        </div>
      </section>

      {/* ============ PROCESO DE PRINCIPIO A FIN ============ */}
      <section className="border-b border-mk-line">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <span className={EYEBROW}>CRM · De principio a fin</span>
          <h2 className={`mt-2 ${H2}`}>De la reserva al cobro, sin perder el hilo</h2>
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

      {/* ============ DESARROLLO WEB ============ */}
      <section id="desarrollo-web" className="border-b border-mk-line bg-mk-ink">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="text-xs font-bold uppercase tracking-widest text-mk-amber">Desarrollo web</span>
          <h2 className="mt-2 max-w-2xl text-2xl font-black tracking-tight text-white sm:text-3xl">
            Una web a medida que no te ata a nadie
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80">
            Además del CRM, diseño y construyo webs para negocios. Te la entrego lista y con un editor para que cambies
            tú mismo los textos y las fotos, sin pagar a alguien cada vez que necesitas actualizar algo.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {WEB_CARDS.map((item) => (
              <li key={item.t} className="flex items-start gap-3 rounded-xl border border-mk-line bg-mk-bg p-5">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[item.c]}`} />
                <div>
                  <p className="text-sm font-bold text-mk-ink">{item.t}</p>
                  <p className="mt-1 text-sm text-mk-muted">{item.b}</p>
                </div>
              </li>
            ))}
          </ul>
          <h3 className="mt-14 text-lg font-bold text-white">Cómo trabajamos</h3>
          <ol className="mt-5 grid gap-6 sm:grid-cols-3">
            {WEB_STEPS.map((step, i) => (
              <li key={step.t}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-mk-amber font-black text-mk-amber">{i + 1}</span>
                <p className="mt-3 text-base font-bold text-white">{step.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/80">{step.b}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <a
              href="#contacto"
              className="inline-block rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-mk-ink transition hover:brightness-95"
            >
              Pedir presupuesto de mi web
            </a>
            <p className="mt-2.5 text-xs text-white/80">El precio depende de cada proyecto. Te lo digo antes de empezar.</p>
          </div>
        </div>
      </section>

      {/* ============ SECTORES ============ */}
      <section id="sectores" className="border-b border-mk-line bg-mk-raised">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className={EYEBROW}>Sectores</span>
          <h2 className={`mt-2 ${H2}`}>Para negocios que trabajan con citas</h2>
          <p className="mt-4 max-w-xl text-sm text-mk-muted">
            Sobre todo clínicas y profesionales de la salud y el bienestar, y cualquier negocio con agenda. Eliges tu
            sector al darte de alta y ajustas lo que quieras después.
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
          <span className={EYEBROW}>Planes del CRM</span>
          <h2 className={`mt-2 ${H2}`}>Elige el plan que necesita tu negocio</h2>
          <p className="mt-4 max-w-xl text-sm text-mk-muted">Pruébalo gratis 14 días. Para contratar un plan, escríbeme por el formulario de contacto y lo dejamos activado. La web a medida se presupuesta aparte.</p>
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
                  {formatPlanPrice(p.price)} €<span className="ml-1 text-sm font-normal text-mk-muted">/mes</span>
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
          <span className="text-xs font-bold uppercase tracking-widest text-mk-amber">14 días gratis</span>
          <h2 className="mx-auto mt-2 max-w-xl text-2xl font-black tracking-tight text-white sm:text-3xl">
            Pruébalo con tu propio negocio
          </h2>
          <a
            href="/registro"
            className="mt-10 inline-block rounded-full bg-mk-accent px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Probar el CRM 14 días gratis
          </a>
        </div>
      </section>

      {/* ============ CONTACTO ============ */}
      <section id="contacto">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className={EYEBROW}>Hablamos</span>
          <h2 className={`mt-2 ${H2}`}>¿Hablamos de tu CRM o de tu web?</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-mk-muted">
            Cuéntame a qué te dedicas y qué necesitas. Te contesto yo mismo, normalmente en menos de 24 horas.
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

      {/* Datos estructurados para Google (empresa + producto con sus planes). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: "Zenzia",
                url: "https://zenzia.es",
                logo: "https://zenzia.es/zenzia-icon.png",
                email: "zenzia.co@gmail.com",
                telephone: "+34673895732",
                areaServed: "ES",
                sameAs: ["https://share.google/ODzMS9pfn3emLD7PD"],
              },
              {
                "@type": "SoftwareApplication",
                name: "Zenzia",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                description: "CRM para negocios que trabajan con citas: agenda, clientes, facturación con VeriFactu, reservas online y recordatorios. También desarrollo web a medida.",
                offers: PLANS.map((p) => ({ "@type": "Offer", name: `Zenzia ${p.name}`, price: p.price, priceCurrency: "EUR" })),
              },
            ],
          }),
        }}
      />

      {/* Botón flotante de WhatsApp */}
      <a
        href="https://wa.me/34673895732?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20Zenzia"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.04c-.25.69-1.45 1.32-2 1.36-.51.05-1 .24-3.37-.7-2.84-1.12-4.65-4.04-4.79-4.23-.14-.19-1.14-1.52-1.14-2.9 0-1.38.72-2.06.98-2.34.25-.28.55-.35.73-.35l.53.01c.17.01.4-.06.62.48.24.57.8 1.95.87 2.09.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.3.37-.42.5-.14.14-.29.29-.12.57.17.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.45.12.61-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.63-.14.26.09 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.69-.17 1.37Z" />
        </svg>
      </a>

      {/* Métricas de visitas y clics (las mismas que el plan Web de los clientes). */}
      <script src="/zz/site.js" data-company="5a279e59-d107-4341-80a2-f33bb5f71b24" defer />
    </div>
  );
}
