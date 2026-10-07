import { redirect } from "next/navigation";

// Los presupuestos viven ahora dentro de Facturación (pestaña Presupuestos).
export default function PresupuestosPage() {
  redirect("/facturacion?tab=presupuestos");
}
