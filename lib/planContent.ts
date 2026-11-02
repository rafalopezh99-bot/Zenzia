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

export const PLANS: PlanContent[] = [
  {
    key: "start",
    name: "Gratis",
    claim: "Ordena tu negocio sin pagar nada.",
    price: 0,
    from: false,
    setup: "Gratis para siempre, sin tarjeta",
    includes: null,
    features: [
      "1 profesional",
      "Hasta 50 clientes",
      "Agenda por día, semana y mes",
      "Fichas de cliente con notas",
      "Servicios y cobros apuntados a mano",
      "WhatsApp, email y próxima cita de cada cliente",
    ],
    cta: "Crear cuenta gratis",
    featured: false,
  },
  {
    key: "smart",
    name: "Smart",
    claim: "Adaptado a tu sector y con las tareas repetitivas automatizadas.",
    price: 49,
    from: false,
    setup: "14 días de prueba gratis",
    includes: "Todo lo de Gratis, más:",
    features: [
      "Clientes ilimitados y hasta 3 profesionales",
      "Módulos de tu sector (historial, seguimiento, pautas, rutinas…)",
      "Facturas con VeriFactu, presupuestos y proformas",
      "Reservas online 24/7, configuradas por ti",
      "Recordatorios automáticos por email",
      "Petición de reseñas de Google y aviso a clientes inactivos",
      "Bonos de sesiones",
      "Consentimientos con firma online",
      "Estadísticas de tu negocio",
    ],
    cta: "Probar 14 días gratis",
    featured: true,
  },
  {
    key: "pro",
    name: "Pro",
    claim: "La IA trabaja contigo y tu negocio crece.",
    price: 89,
    from: false,
    setup: "14 días de prueba gratis",
    includes: "Todo lo de Smart, más:",
    features: [
      "Hasta 10 profesionales",
      "Asistente de IA para tu agenda y tus clientes",
      "Portal del cliente (pautas, citas y facturas)",
      "Web propia con reservas integradas",
      "Soporte prioritario",
      "Próximamente: notas con IA, lista de espera, pago online y conexiones con otras apps",
    ],
    cta: "Probar 14 días gratis",
    featured: false,
  },
];
