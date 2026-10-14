import { LegalLayout, LegalHeading } from "@/components/marketing-ui";

export const metadata = { title: "Condiciones de contratación" };

// Condiciones generales de contratación del servicio Zenzia (SaaS). Texto de
// partida: conviene que lo revise un gestor o abogado antes de cobrar.
export default function CondicionesPage() {
  return (
    <LegalLayout title="Condiciones generales de contratación" updated="octubre de 2026">
      <p>
        Estas condiciones regulan la contratación y el uso de Zenzia, el software de gestión online ofrecido por Rafael
        López Hidalgo (NIF 28831419-E), con domicilio en Sevilla, España, y email de contacto zenzia.co@gmail.com (en
        adelante, «Zenzia»). Al crear una cuenta, el cliente (autónomo o empresa) declara haberlas leído y aceptado.
      </p>

      <LegalHeading>1. Objeto del servicio</LegalHeading>
      <p>
        Zenzia es un servicio de software en la nube para la gestión de clientes, agenda, facturación y, según el plan,
        reservas online, recordatorios, portal del cliente y otras funciones. El servicio se presta «tal cual», con las
        funciones descritas en la web para cada plan en el momento de la contratación.
      </p>

      <LegalHeading>2. Cuenta, prueba gratuita y alta</LegalHeading>
      <p>
        El cliente debe facilitar datos veraces y es responsable de custodiar sus credenciales. Cada cuenta nueva
        dispone de una prueba gratuita de 14 días sin compromiso. Al terminar, para seguir usando el servicio es
        necesario contratar un plan; si no se contrata, el acceso queda suspendido y los datos se conservan durante al
        menos 30 días para que el cliente pueda contratar o solicitarlos.
      </p>

      <LegalHeading>3. Planes, precios y pago</LegalHeading>
      <p>
        Los planes y precios vigentes son los publicados en zenzia.es. Los precios no incluyen IVA salvo que se indique
        lo contrario. La suscripción es mensual y se cobra por adelantado; la cuota de implantación, cuando exista, se
        paga una sola vez. Zenzia emitirá la factura correspondiente a cada pago. Los cambios de precio se comunicarán
        con al menos 30 días de antelación y el cliente podrá darse de baja antes de que se apliquen.
      </p>

      <LegalHeading>4. Duración, baja y cambio de plan</LegalHeading>
      <p>
        La suscripción se renueva automáticamente cada mes. El cliente puede cambiar de plan o darse de baja en
        cualquier momento; la baja surte efecto al final del periodo ya pagado, sin reembolso de la parte no consumida.
        Tras la baja, el cliente puede solicitar la exportación de sus datos durante 30 días; pasado ese plazo podrán
        ser eliminados, salvo los que deban conservarse por obligación legal.
      </p>

      <LegalHeading>5. Uso aceptable</LegalHeading>
      <p>
        El cliente se compromete a usar Zenzia conforme a la ley y a no introducir contenidos ilícitos, no enviar
        comunicaciones no solicitadas a sus clientes y no intentar acceder a datos de otros usuarios. Zenzia podrá
        suspender una cuenta que incumpla estas condiciones, avisando previamente salvo en casos graves.
      </p>

      <LegalHeading>6. Datos de los clientes del cliente</LegalHeading>
      <p>
        Los datos que el cliente introduce sobre sus propios clientes o pacientes son responsabilidad suya. Zenzia los
        trata únicamente como encargado del tratamiento, según el{" "}
        <a href="/encargado" className="underline">
          contrato de encargado del tratamiento
        </a>
        , que forma parte de estas condiciones.
      </p>

      <LegalHeading>7. Facturación electrónica y VeriFactu</LegalHeading>
      <p>
        Zenzia facilita la emisión de facturas y su registro en el sistema VERI*FACTU de la Agencia Tributaria a través
        de un proveedor autorizado, cuando la función esté activada. El cliente es el responsable de sus obligaciones
        fiscales y de la exactitud de los datos de sus facturas.
      </p>

      <LegalHeading>8. Disponibilidad y responsabilidad</LegalHeading>
      <p>
        Zenzia procura una disponibilidad continua del servicio y realiza copias de seguridad, pero no garantiza que
        esté libre de interrupciones por mantenimiento o causas ajenas. La responsabilidad de Zenzia frente al cliente
        se limita, salvo dolo o culpa grave, al importe pagado por el cliente en los 12 meses anteriores al hecho que
        la origine.
      </p>

      <LegalHeading>9. Propiedad intelectual</LegalHeading>
      <p>
        El software, la marca y los contenidos de Zenzia pertenecen a su titular. El cliente obtiene un derecho de uso
        no exclusivo e intransferible mientras dure la suscripción. Los datos introducidos por el cliente siguen
        siendo suyos.
      </p>

      <LegalHeading>10. Modificaciones, ley aplicable y contacto</LegalHeading>
      <p>
        Zenzia puede actualizar estas condiciones avisando al cliente con antelación razonable. Se rigen por la
        legislación española; para cualquier controversia las partes se someten a los juzgados y tribunales de
        Sevilla, salvo que la ley disponga otro fuero. Para cualquier duda: zenzia.co@gmail.com o WhatsApp 673 895 732.
      </p>
    </LegalLayout>
  );
}
