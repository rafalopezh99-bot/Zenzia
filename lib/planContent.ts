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
    name: "Start",
    claim: "Ordena tu consulta: clientes, agenda y cobros.",
    price: 19,
    from: false,
    setup: "Sin cuota de implantación",
    includes: null,
    features: [
      "Ficha de cliente con notas de cada sesión",
      "30 clientes nuevos al mes",
      "Agenda de citas",
      "Facturas en PDF · 30/mes",
      "Dashboard con tus números",
    ],
    cta: "Quiero Start",
    featured: false,
  },
  {
    key: "smart",
    name: "Smart",
    claim: "Pierde menos citas y deja que reserven solos.",
    price: 39,
    from: false,
    setup: "Implantación: 149 €",
    includes: "Todo lo de Start, más:",
    features: [
      "Recordatorios automáticos de citas",
      "Reservas online 24/7",
      "Bonos de sesiones",
      "Módulos de tu especialidad (pautas, evolución, rutinas…)",
      "Presupuestos y avisos de contactos web",
      "150 clientes y facturas al mes",
      "Gráficas de facturación completas",
    ],
    cta: "Quiero Smart",
    featured: true,
  },
  {
    key: "pro",
    name: "Pro",
    claim: "Consigue más clientes y fidelízalos.",
    price: 59,
    from: true,
    setup: "Implantación: desde 490 €",
    includes: "Todo lo de Smart, más:",
    features: [
      "Web propia con reservas integradas",
      "Recordatorios y avisos por WhatsApp",
      "Petición automática de reseñas de Google",
      "Aviso a clientes que llevan tiempo sin venir",
      "Portal del cliente (pautas, citas y facturas)",
      "Todo ilimitado",
      "Implantación y soporte prioritario",
    ],
    cta: "Solicitar auditoría",
    featured: false,
  },
];
