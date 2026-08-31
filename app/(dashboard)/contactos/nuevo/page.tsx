import { createContact } from "@/lib/actions/contacts";
import { Card, PageHeader, Input, PrimaryButton } from "@/components/ui";

export default function NuevoContactoPage() {
  return (
    <div>
      <PageHeader title="Nuevo contacto" />
      <Card className="max-w-sm">
        <form action={createContact} className="space-y-3">
          <Input name="full_name" placeholder="Nombre completo" required className="w-full" />
          <Input name="phone" placeholder="Teléfono" className="w-full" />
          <Input name="email" type="email" placeholder="Email" className="w-full" />
          <Input name="demo_url" type="url" placeholder="Enlace de la demo (opcional)" className="w-full" />
          <PrimaryButton>Guardar</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
