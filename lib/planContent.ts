// Textos comerciales de los planes: los usa la web (app/page.tsx) y la
// pantalla de mejorar plan del panel (/planes). Los límites reales que
// aplica el panel están en lib/plans.ts — si cambian allí, actualizar aquí.
import type { PlanKey } from "@/lib/plans";

export interface PlanContent {
  key: PlanKey;
  name: string;
  claim: string;
  price: number;
  from: boolean;
  setup: string;
  includes: string | null;
  features: string[];
  cta: string;
  featured: boolean;
}

export const formatPlanPrice = (price: number) =>
  price.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const PLANS: PlanContent[] = [
  {
    key: "start",
    name: "Start",
    claim: "Ordena tu negocio: clientes, agenda y cobros.",
    price: 14.99,
    from: false,
    setup: "Sin cuota de implantación",
    includes: null,
    features: [
      "1 profesional",
      "Hasta 40 clientes",
      "Agenda por día, semana y mes",
      "Fichas de cliente con notas",
      "Servicios y cobros con un clic",
      "Facturas con VeriFactu, presupuestos y proformas",
      "WhatsApp, email y próxima cita de cada cliente",
    ],
    cta: "Contactar",
    featured: false,
  },
  {
    key: "smart",
    name: "Smart",
    claim: "Adaptado a tu sector y con las tareas repetitivas automatizadas.",
    price: 34.99,
    from: false,
    setup: "Implantación: 149,99 €",
    includes: "Todo lo de Start, más:",
    features: [
      "Clientes ilimitados y hasta 3 profesionales",
      "Módulos de tu sector (historial, seguimiento, pautas, rutinas…)",
      "Reservas online 24/7, configuradas por ti",
      "Recordatorios automáticos por email",
      "Petición de reseñas de Google y aviso a clientes inactivos",
      "Bonos de sesiones",
      "Consentimientos con firma online",
      "Estadísticas de tu negocio",
    ],
    cta: "Contactar",
    featured: true,
  },
  {
    key: "pro",
    name: "Pro",
    claim: "La IA trabaja contigo y tu negocio crece.",
    price: 49.99,
    from: false,
    setup: "Implantación: 249,99 €",
    includes: "Todo lo de Smart, más:",
    features: [
      "Hasta 10 profesionales",
      "Asistente de IA para tu agenda y tus clientes",
      "Portal del cliente (pautas, citas y facturas)",
      "Web propia con reservas integradas",
      "Soporte prioritario",
      "Próximamente: notas con IA, lista de espera, pago online y conexiones con otras apps",
    ],
    cta: "Contactar",
    featured: false,
  },
];
