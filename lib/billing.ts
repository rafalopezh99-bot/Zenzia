// Datos de facturación del cliente (contacts.custom_fields) y periodicidad
// con la que se le factura — para poder emitir facturas/presupuestos en
// PDF con sus datos fiscales completos, sin tener que pedirlos cada vez.

export const BILLING_FREQUENCIES = ["mensual", "trimestral", "semestral", "anual"] as const;

export type BillingFrequency = (typeof BILLING_FREQUENCIES)[number];

export const BILLING_FREQUENCY_LABEL: Record<BillingFrequency, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};
