import { LegalLayout, LegalHeading } from "@/components/marketing-ui";

export const metadata = { title: "Contrato de encargado del tratamiento" };

// Contrato de encargado del tratamiento (art. 28 RGPD) entre el cliente de
// Zenzia (responsable) y Zenzia (encargado). Texto de partida: conviene que
// lo revise un abogado, sobre todo por los datos de salud.
export default function EncargadoPage() {
  return (
    <LegalLayout title="Contrato de encargado del tratamiento" updated="octubre de 2026">
      <p>
        Este contrato regula, conforme al artículo 28 del Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018
        (LOPDGDD), el tratamiento de datos personales que Rafael López Hidalgo (NIF 28831419-E), titular de Zenzia
        («el Encargado»), realiza por cuenta del cliente que contrata Zenzia («el Responsable»). Se acepta al crear la
        cuenta y forma parte de las{" "}
        <a href="/condiciones" className="underline">
          condiciones de contratación
        </a>
        .
      </p>

      <LegalHeading>1. Objeto, duración y naturaleza</LegalHeading>
      <p>
        El Encargado trata los datos solo para prestar el servicio Zenzia: alojamiento, gestión de la agenda, fichas de
        clientes, facturación, envío de recordatorios y comunicaciones que el Responsable active, y soporte técnico. El
        contrato dura lo mismo que la suscripción.
      </p>

      <LegalHeading>2. Datos y personas afectadas</LegalHeading>
      <p>
        Clientes, pacientes o alumnos del Responsable y sus representantes: datos identificativos y de contacto, datos
        de citas, facturación y, cuando el Responsable los registre, datos de salud y notas de sesión (categorías
        especiales del art. 9 RGPD). También datos de los usuarios del Responsable que acceden a Zenzia.
      </p>

      <LegalHeading>3. Obligaciones del Encargado</LegalHeading>
      <ul className="list-disc space-y-1 pl-5">
        <li>Tratar los datos solo siguiendo las instrucciones documentadas del Responsable y para la finalidad indicada.</li>
        <li>Garantizar la confidencialidad de las personas autorizadas a tratarlos.</li>
        <li>
          Aplicar medidas de seguridad adecuadas: cifrado en tránsito y en reposo, control de acceso por cuenta,
          aislamiento de los datos de cada cliente, registro de accesos a las fichas, verificación en dos pasos
          opcional y copias de seguridad.
        </li>
        <li>Ayudar al Responsable a atender los derechos de los interesados (acceso, rectificación, supresión, portabilidad…).</li>
        <li>Notificar al Responsable, sin dilación indebida y en un máximo de 48 horas, cualquier violación de seguridad de los datos.</li>
        <li>Al terminar el servicio, devolver o suprimir los datos según indique el Responsable, salvo obligación legal de conservarlos.</li>
        <li>Poner a disposición del Responsable la información necesaria para demostrar el cumplimiento de este contrato.</li>
      </ul>

      <LegalHeading>4. Subencargados</LegalHeading>
      <p>
        El Responsable autoriza al Encargado a recurrir a los siguientes proveedores, que ofrecen garantías conformes
        al RGPD: Supabase (base de datos y autenticación), Netlify (alojamiento), Resend (envío de emails), Verifacti
        (registro de facturas en VERI*FACTU), Stripe (cobro de la suscripción), Anthropic (asistente virtual, si se
        usa) y Meta (WhatsApp Business, si se activa). El Encargado informará de cualquier cambio para que el
        Responsable pueda oponerse.
      </p>

      <LegalHeading>5. Transferencias internacionales</LegalHeading>
      <p>
        Cuando algún subencargado trate datos fuera del Espacio Económico Europeo, se hará con las garantías del
        capítulo V del RGPD (decisión de adecuación o cláusulas contractuales tipo).
      </p>

      <LegalHeading>6. Obligaciones del Responsable</LegalHeading>
      <p>
        El Responsable garantiza que tiene base legal para tratar los datos que introduce en Zenzia, incluido, cuando
        proceda, el consentimiento informado de sus pacientes para el tratamiento de datos de salud, y que informa a
        los interesados de que usa Zenzia como proveedor.
      </p>

      <LegalHeading>7. Contacto</LegalHeading>
      <p>Para cualquier cuestión sobre protección de datos: zenzia.co@gmail.com.</p>
    </LegalLayout>
  );
}
