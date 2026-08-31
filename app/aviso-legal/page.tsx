import { LegalLayout, LegalHeading } from "@/components/marketing-ui";

// Aviso legal según el art. 10 de la Ley 34/2002 (LSSI-CE). Texto de
// partida estándar para un autónomo — no sustituye la revisión de un
// gestor o abogado antes de publicarlo de cara al público.
export default function AvisoLegalPage() {
  return (
    <LegalLayout title="Aviso legal" updated="agosto de 2026">
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
        Información y de Comercio Electrónico (LSSI-CE), se facilitan a continuación los siguientes datos:
      </p>

      <LegalHeading>1. Datos identificativos</LegalHeading>
      <ul className="list-disc space-y-1 pl-5">
        <li>Titular: Rafael López Hidalgo</li>
        <li>NIF: 28831419-E</li>
        <li>Nombre comercial: RL Digital Studios / Zenzia</li>
        <li>Domicilio: Sevilla, España</li>
        <li>Email de contacto: rldigitalstudios1@gmail.com</li>
        <li>Actividad: diseño web, marketing digital y desarrollo de software (Zenzia, CRM para negocios de cita previa)</li>
      </ul>

      <LegalHeading>2. Objeto</LegalHeading>
      <p>
        El presente aviso legal regula el uso del sitio web zenzia.es (en adelante, "el sitio") y de la aplicación
        Zenzia a la que da acceso. La navegación por el sitio atribuye la condición de usuario del mismo e implica
        la aceptación de las condiciones recogidas en este aviso legal.
      </p>

      <LegalHeading>3. Condiciones de uso</LegalHeading>
      <p>
        El usuario se compromete a hacer un uso adecuado de los contenidos y servicios que se ofrecen a través del
        sitio y a no emplearlos para incurrir en actividades ilícitas o contrarias a la buena fe y al ordenamiento
        legal, o que de cualquier forma puedan dañar, inutilizar o deteriorar el sitio o impedir su normal
        funcionamiento.
      </p>

      <LegalHeading>4. Propiedad intelectual e industrial</LegalHeading>
      <p>
        El contenido de este sitio (textos, diseño, código, marca "Zenzia" y logotipos) es propiedad de Rafael
        López Hidalgo, salvo que se indique expresamente lo contrario, y está protegido por la normativa vigente en
        materia de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o
        transformación sin autorización previa.
      </p>

      <LegalHeading>5. Responsabilidad</LegalHeading>
      <p>
        Se procurará que la información contenida en el sitio sea exacta y esté actualizada, si bien no se garantiza
        la ausencia de errores. El titular no se hace responsable de los daños derivados de un uso indebido del
        sitio o de la interrupción del servicio por causas ajenas a su control.
      </p>

      <LegalHeading>6. Legislación aplicable</LegalHeading>
      <p>
        Las presentes condiciones se rigen por la legislación española. Para cualquier controversia derivada del
        acceso o uso del sitio, las partes se someten a los Juzgados y Tribunales de Sevilla, salvo que la
        normativa de consumidores y usuarios establezca otro fuero.
      </p>
    </LegalLayout>
  );
}
