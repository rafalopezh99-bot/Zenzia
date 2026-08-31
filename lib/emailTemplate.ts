// Genera el texto de la plantilla de contacto a partir de los datos del
// cliente potencial. Función pura (sin acceso a red ni a BD) para poder
// usarla tanto en el servidor como en un componente cliente
// (components/ContactarClienteButton.tsx), que es donde de verdad se usa:
// no se manda ningún email, solo se enseña el texto para copiarlo a mano.
export function buildContactEmail(input: {
  contactName: string;
  businessName: string;
  businessType: string;
  serviceOffer: string;
}): { subject: string; body: string } {
  const contactName = input.contactName.trim();
  const businessName = input.businessName.trim();
  const businessType = input.businessType.trim();
  const serviceOffer = input.serviceOffer.trim();

  const subject = businessName ? `Una propuesta para ${businessName}` : "Una propuesta para tu negocio";

  const businessRef = businessName
    ? `${businessName}${businessType ? ` (${businessType})` : ""}`
    : businessType || "tu negocio";

  const body = `Hola${contactName ? ` ${contactName}` : ""},

Soy Rafa, de RL Digital Studios. Escribo porque he visto ${businessRef} y creo que os podría venir muy bien ${
    serviceOffer || "lo que os puedo ofrecer"
  }.

Si os viene bien, me encantaría contaros más en una llamada breve o por aquí mismo, sin compromiso.

Un saludo,
Rafa
RL Digital Studios`;

  return { subject, body };
}
