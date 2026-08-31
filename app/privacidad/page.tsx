import { LegalLayout, LegalHeading } from "@/components/marketing-ui";

// Política de privacidad orientada a RGPD/LOPDGDD. Distingue dos papeles
// distintos, que es lo importante en un SaaS B2B como Zenzia:
// - Como responsable del tratamiento: los datos de quien escribe a través
//   de la landing o del email de contacto.
// - Como encargado del tratamiento: los datos que cada empresa cliente
//   introduce en su propia cuenta de Zenzia (sus contactos, sus citas...),
//   de los que esa empresa sigue siendo la responsable.
// Texto de partida estándar — conviene que lo revise un gestor o abogado
// antes de publicarlo, sobre todo si se añaden más integraciones o un
// formulario propio más adelante.
export default function PrivacidadPage() {
  return (
    <LegalLayout title="Política de privacidad" updated="agosto de 2026">
      <LegalHeading>1. Responsable del tratamiento</LegalHeading>
      <ul className="list-disc space-y-1 pl-5">
        <li>Titular: Rafael López Hidalgo (RL Digital Studios)</li>
        <li>NIF: 28831419-E</li>
        <li>Domicilio: Sevilla, España</li>
        <li>Email de contacto: rldigitalstudios1@gmail.com</li>
      </ul>

      <LegalHeading>2. Qué datos tratamos y con qué finalidad</LegalHeading>
      <p>
        Si nos escribes por email, a través del formulario de contacto de esta página o de nuestros canales de
        contacto para informarte sobre Zenzia, tratamos el nombre, el email y el contenido del mensaje que nos
        facilitas, con la única finalidad de responder a tu consulta y hacerte seguimiento de tu interés en Zenzia.
      </p>
      <p>
        Si tu negocio contrata Zenzia y usas la aplicación como cliente, los datos que introduces en tu cuenta
        (tus contactos, sus citas, notas, presupuestos, etc.) son responsabilidad de tu empresa. En ese caso,
        Rafael López Hidalgo actúa como encargado del tratamiento: aloja y procesa esos datos únicamente para
        prestar el servicio, siguiendo tus instrucciones, y no los usa para ningún otro fin.
      </p>

      <LegalHeading>3. Legitimación</LegalHeading>
      <p>
        El tratamiento de tus datos de contacto se basa en tu consentimiento al escribirnos. El tratamiento de los
        datos dentro de la aplicación Zenzia se basa en la ejecución del contrato de prestación del servicio entre
        tu empresa y RL Digital Studios.
      </p>

      <LegalHeading>4. Conservación</LegalHeading>
      <p>
        Los datos de contacto se conservan mientras sea necesario para atender tu consulta y, después, el tiempo
        legalmente exigible. Los datos dentro de tu cuenta de Zenzia se conservan mientras dure la relación
        contractual con tu empresa, y se eliminan o devuelven al finalizar dicha relación, salvo obligación legal
        de conservarlos.
      </p>

      <LegalHeading>5. Destinatarios y proveedores</LegalHeading>
      <p>
        No se ceden datos a terceros salvo obligación legal. Para el funcionamiento del sitio y de la aplicación se
        utilizan proveedores de infraestructura tecnológica que actúan como encargados del tratamiento conforme al
        RGPD, en concreto Supabase (base de datos y autenticación) y Netlify (alojamiento web).
      </p>

      <LegalHeading>6. Tus derechos</LegalHeading>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y
        portabilidad escribiendo a rldigitalstudios1@gmail.com. También tienes derecho a presentar una reclamación
        ante la Agencia Española de Protección de Datos (aepd.es) si consideras que no hemos tratado tus datos
        conforme a la normativa.
      </p>

      <LegalHeading>7. Seguridad</LegalHeading>
      <p>
        Se aplican medidas técnicas y organizativas razonables para proteger los datos frente a accesos no
        autorizados, pérdida o alteración, incluyendo el aislamiento de los datos de cada empresa cliente respecto
        al resto (cada cuenta solo ve su propia información).
      </p>
    </LegalLayout>
  );
}
