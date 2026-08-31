import { createProspect } from "@/lib/actions/prospects";
import { Card, PageHeader, Input, Textarea, PrimaryButton } from "@/components/ui";

export default function NuevoClientePage() {
  return (
    <div>
      <PageHeader title="Nuevo cliente potencial" />
      <Card className="max-w-md">
        <form action={createProspect} className="space-y-3">
          <Input name="contact_name" placeholder="Nombre de contacto" required className="w-full" />
          <Input name="email" type="email" placeholder="Email de contacto" className="w-full" />
          <Input name="instagram_handle" placeholder="Instagram de contacto (usuario, sin @)" className="w-full" />
          <Input name="business_type" placeholder="Tipo de negocio (ej. peluquería, clínica dental...)" className="w-full" />
          <Input name="business_name" placeholder="Nombre del negocio" className="w-full" />
          <Textarea name="service_offer" placeholder="Qué servicio quieres ofrecerle" className="w-full" rows={3} />
          <PrimaryButton>Guardar</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
