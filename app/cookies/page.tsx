import { LegalLayout, LegalHeading } from "@/components/marketing-ui";

// Política de cookies honesta con lo que hay realmente hoy: la landing no
// instala ninguna cookie de analítica ni publicidad, y la aplicación solo
// usa la cookie de sesión, técnica/necesaria. Si en el futuro se añade
// analítica (Google Analytics, Meta Pixel...) hay que actualizar esto y
// montar un banner de consentimiento — hoy no hace falta porque no se usa
// ninguna cookie no esencial.
export default function CookiesPage() {
  return (
    <LegalLayout title="Política de cookies" updated="agosto de 2026">
      <p>
        Una cookie es un pequeño archivo que un sitio web guarda en tu navegador. Esto es lo que usamos, y lo que
        no, en zenzia.es y en la aplicación Zenzia.
      </p>

      <LegalHeading>1. Esta página (zenzia.es)</LegalHeading>
      <p>
        La página que estás viendo ahora mismo no instala ninguna cookie propia de analítica ni de publicidad.
        Únicamente carga las tipografías del sitio desde Google Fonts, lo que puede implicar una conexión técnica
        con los servidores de Google para descargarlas, sin que se instale ninguna cookie de seguimiento en tu
        navegador por ello.
      </p>

      <LegalHeading>2. La aplicación Zenzia (panel)</LegalHeading>
      <p>
        Cuando inicias sesión en tu panel de Zenzia, se instala una cookie técnica de sesión, necesaria para
        mantenerte identificado mientras usas el servicio. Es una cookie estrictamente necesaria para el
        funcionamiento del servicio contratado y, por tanto, no requiere tu consentimiento previo (art. 22.2 de la
        LSSI-CE).
      </p>

      <LegalHeading>3. Si esto cambia</LegalHeading>
      <p>
        Si en el futuro incorporamos cookies de analítica, publicidad o de terceros no esenciales, actualizaremos
        esta política y te pediremos tu consentimiento explícito antes de instalarlas, mediante un aviso visible en
        el sitio.
      </p>

      <LegalHeading>4. Cómo gestionar las cookies desde tu navegador</LegalHeading>
      <p>
        Puedes eliminar o bloquear las cookies en cualquier momento desde la configuración de tu navegador. Ten en
        cuenta que, si bloqueas la cookie de sesión de la aplicación, no podrás mantener la sesión iniciada en tu
        panel de Zenzia.
      </p>
    </LegalLayout>
  );
}
