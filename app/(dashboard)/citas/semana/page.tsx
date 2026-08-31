import { redirect } from "next/navigation";

// La vista semanal es ahora la vista principal de Agenda, servida en
// /citas. Esta ruta se mantiene como redirección para no romper enlaces
// antiguos, preservando el parámetro ?week= si venía informado.
export default function SemanaRedirectPage({ searchParams }: { searchParams: { week?: string } }) {
  const query = searchParams.week ? `?week=${searchParams.week}` : "";
  redirect(`/citas${query}`);
}
