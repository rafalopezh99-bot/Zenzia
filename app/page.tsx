import { VERTICAL_CATALOG, VERTICAL_CATEGORIES } from "@/lib/verticals";
import { FONT_SANS, FONT_MONO, PAPER, PAPER_DEEP, INK, SLATE, LINE, BLUE, BLUE_PALE } from "@/lib/marketing-theme";
import { Mono, MarketingHeader, MarketingFooter } from "@/components/marketing-ui";
import LandingContactForm from "@/components/LandingContactForm";
import DashboardMockup from "@/components/DashboardMockup";

// Landing pública de Zenzia (dominio raíz, zenzia.es). Contenido pensado
// como el de un CRM SaaS al uso (funcionalidades, sectores, cómo funciona),
// pero con la estética de rldigitalstudios.com: fondo "paper" claro, texto
// casi negro, titulares enormes en negrita, etiquetas/nav en monoespaciada
// mayúscula, acentos en el azul-verdoso de la marca. Nada que ver con el
// tema oscuro del panel — esta página vive fuera de (dashboard) y no
// requiere sesión.
//
// Las fuentes (Inter / IBM Plex Mono) se cargan como <link> en app/layout.tsx,
// no con next/font/google — así el navegador las pide, no el build.
// Cabecera/pie/tokens de color compartidos con las páginas legales están en
// components/marketing-ui.tsx y lib/marketing-theme.ts.

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
    body: "Galería antes/después y documentos firmados, para los negocios que los necesitan — estética, tatuajes, clínicas dentales, fisioterapia.",
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

const STEPS = [
  {
    n: "01",
    title: "Cuéntanos tu negocio",
    body: "Nos dices a qué te dedicas y cómo trabajas ahora mismo — con Excel, WhatsApp, papel, o un poco de todo.",
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

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: PAPER, color: INK, fontFamily: FONT_SANS }}>
      <MarketingHeader />

      {/* ============ HERO ============ */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1
              className="max-w-3xl text-5xl font-black uppercase leading-[1.05] sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}
            >
              Todo tu negocio
              <br />
              en un solo panel
            </h1>
            <p className="mt-6 max-w-xl text-lg" style={{ color: SLATE }}>
              Zenzia centraliza tus contactos, tu agenda, tus presupuestos y tu facturación en un único sitio,
              configurado desde el primer día para tu tipo de negocio.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#contacto"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ backgroundColor: BLUE, fontFamily: FONT_MONO }}
              >
                Solicita tu acceso →
              </a>
              <a
                href="#funcionalidades"
                className="text-sm uppercase tracking-wide underline-offset-4 hover:underline"
                style={{ fontFamily: FONT_MONO, color: INK }}
              >
                Ver funcionalidades ↓
              </a>
            </div>
          </div>

          <DashboardMockup />
        </div>
      </section>

      {/* ============ FUNCIONALIDADES ============ */}
      <section id="funcionalidades" className="border-t" style={{ borderColor: LINE, backgroundColor: PAPER_DEEP }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl text-2xl font-black uppercase leading-tight sm:text-3xl">
            Todo lo que necesita tu negocio para no perder clientes por el camino
          </h2>
          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.n}>
                <Mono className="text-xs" style={{ color: BLUE }}>
                  N.º {f.n}
                </Mono>
                <h3 className="mt-2 text-lg font-bold uppercase tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: SLATE }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECTORES ============ */}
      <section id="sectores" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl text-2xl font-black uppercase leading-tight sm:text-3xl">
          Pensado para todo tipo de negocios
        </h2>
        <p className="mt-4 max-w-xl text-sm" style={{ color: SLATE }}>
          Desde una clínica hasta un taller: eliges tu sector al darte de alta y Zenzia activa lo habitual para ese
          tipo de negocio. Después ajustas lo que quieras.
        </p>

        <div className="mt-12 space-y-10">
          {VERTICAL_CATEGORIES.map((category) => (
            <div key={category}>
              <Mono className="text-xs uppercase tracking-widest" style={{ color: SLATE }}>
                {category}
              </Mono>
              <div className="mt-3 flex flex-wrap gap-2">
                {VERTICAL_CATALOG.filter((v) => v.category === category).map((v) => (
                  <span
                    key={v.key}
                    className="rounded-full border px-3 py-1.5 text-sm"
                    style={{ borderColor: LINE, backgroundColor: PAPER_DEEP }}
                  >
                    {v.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section className="border-t" style={{ borderColor: LINE, backgroundColor: PAPER_DEEP }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl text-2xl font-black uppercase leading-tight sm:text-3xl">Cómo funciona</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <Mono className="text-xs" style={{ color: BLUE }}>
                  PASO {s.n}
                </Mono>
                <h3 className="mt-2 text-base font-bold uppercase tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: SLATE }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ANTES / CON ZENZIA ============ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl text-2xl font-black uppercase leading-tight sm:text-3xl">
          Deja de repartir tu negocio entre cinco sitios
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border p-6" style={{ borderColor: LINE }}>
            <Mono className="text-xs uppercase tracking-widest" style={{ color: SLATE }}>
              Ahora mismo
            </Mono>
            <ul className="mt-4 space-y-3 text-sm" style={{ color: SLATE }}>
              <li>Agenda en el móvil, aparte de todo lo demás</li>
              <li>Conversaciones y acuerdos sueltos en WhatsApp</li>
              <li>Presupuestos en un Excel que solo entiendes tú</li>
              <li>Facturas sueltas, cada una en su sitio</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-6" style={{ borderColor: BLUE, backgroundColor: BLUE_PALE }}>
            <Mono className="text-xs uppercase tracking-widest" style={{ color: BLUE }}>
              Con Zenzia
            </Mono>
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
          <h2 className="max-w-2xl text-2xl font-black uppercase leading-tight sm:text-3xl">
            ¿Quieres Zenzia en tu negocio?
          </h2>
          <p className="mt-4 max-w-xl text-sm" style={{ color: SLATE }}>
            Cuéntanos a qué te dedicas y te preparamos una demo con tu propio panel ya configurado.
          </p>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div className="flex flex-col gap-6">
              <div>
                <Mono className="text-xs uppercase tracking-widest" style={{ color: SLATE }}>
                  Email
                </Mono>
                <div className="mt-1 text-sm">rldigitalstudios1@gmail.com</div>
              </div>
              <div>
                <Mono className="text-xs uppercase tracking-widest" style={{ color: SLATE }}>
                  Instagram
                </Mono>
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
