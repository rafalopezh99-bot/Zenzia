// Enlace de WhatsApp a partir de un teléfono tal como lo escribe el negocio.
// Un móvil español sin prefijo (9 dígitos) necesita el 34 para abrir bien.
export function whatsappUrl(phone: string | null | undefined, text?: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.length === 9 ? `34${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
