// Métodos de pago que maneja el negocio (clases particulares): efectivo o
// Bizum. Un solo sitio para las etiquetas, reutilizado en Facturación y en
// el historial de pagos.
export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  bizum: "Bizum",
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABEL);
