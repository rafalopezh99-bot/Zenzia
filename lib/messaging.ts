// Envío de emails (Resend) y WhatsApp (API de WhatsApp Business de Meta).
// Sin las variables de entorno configuradas, el envío se omite sin error.

export async function sendEmail(to: string, subject: string, html: string, replyTo?: string | null) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Zenzia <avisos@zenzia.es>",
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  return res.ok;
}

// Mensaje de plantilla aprobada en Meta (WHATSAPP_TEMPLATE, p. ej.
// "recordatorio_cita" con parámetros {{1}} nombre, {{2}} negocio, {{3}} fecha).
export async function sendWhatsAppTemplate(phone: string, params: string[]) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return false;
  let to = phone.replace(/\D/g, "");
  if (to.length === 9) to = `34${to}`;
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE ?? "recordatorio_cita",
        language: { code: "es" },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      },
    }),
  });
  return res.ok;
}

export function escapeHtml(v: unknown) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
