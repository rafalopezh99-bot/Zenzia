import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { CURSO_ORDER } from "@/lib/academia";

const SIN_CURSO = "Sin curso asignado";

export default async function GruposPage() {
  const supabase = createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, custom_fields")
    .order("full_name");

  // Un grupo por curso, con los alumnos que tienen ese curso en
  // custom_fields.curso (mismo campo que rellena /contactos/nuevo). Los que
  // todavía no tienen curso asignado van a un grupo aparte al final, en vez
  // de desaparecer de la vista.
  const groups = new Map<string, { id: string; full_name: string }[]>();
  for (const c of contacts ?? []) {
    const curso: string = (c as any).custom_fields?.curso || SIN_CURSO;
    if (!groups.has(curso)) groups.set(curso, []);
    groups.get(curso)!.push({ id: c.id, full_name: c.full_name });
  }

  // Orden: el mismo de siempre (1º ESO → 4º ESO → Bachillerato → EVAU),
  // luego cualquier curso que no esté en esa lista, y "Sin curso" al final.
  const orderedCursos = [
    ...CURSO_ORDER.filter((curso) => groups.has(curso)),
    ...[...groups.keys()].filter((curso) => curso !== SIN_CURSO && !CURSO_ORDER.includes(curso)),
    ...(groups.has(SIN_CURSO) ? [SIN_CURSO] : []),
  ];

  return (
    <div>
      <PageHeader title="Grupos" />

      {orderedCursos.length === 0 && (
        <p className="text-sm text-slate/70">Todavía no hay alumnos dados de alta.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orderedCursos.map((curso) => {
          const alumnos = groups.get(curso)!;
          return (
            <Card key={curso}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">{curso}</h2>
                <span className="rounded-full bg-paper-deep px-2 py-0.5 text-xs font-semibold text-slate">
                  {alumnos.length}
                </span>
              </div>
              <ul className="space-y-1 text-sm">
                {alumnos.map((a) => (
                  <li key={a.id}>
                    <Link href={`/contactos/${a.id}`} className="text-slate hover:text-brand">
                      {a.full_name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
