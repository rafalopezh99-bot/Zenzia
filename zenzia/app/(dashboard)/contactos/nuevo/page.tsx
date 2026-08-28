import { createContact } from "@/lib/actions/contacts";

export default function NuevoContactoPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Nuevo contacto</h1>
      <form action={createContact} className="max-w-sm space-y-3">
        <input
          name="full_name"
          placeholder="Nombre completo"
          required
          className="w-full rounded bg-neutral-800 p-2 text-sm"
        />
        <input name="phone" placeholder="Teléfono" className="w-full rounded bg-neutral-800 p-2 text-sm" />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full rounded bg-neutral-800 p-2 text-sm"
        />
        <button className="rounded bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900">
          Guardar
        </button>
      </form>
    </div>
  );
}
