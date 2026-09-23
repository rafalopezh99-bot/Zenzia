import { createClient } from "@/lib/supabase/server";
import { addProgress } from "@/lib/actions/progress";
import { Card, PageHeader, Badge, Input, Select, Textarea, PrimaryButton, tableWrap, tableEl, theadEl, thEl, tdEl, trEl } from "@/components/ui";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology, showsAcademiaFields } from "@/lib/terminology";
import { appLocalParts, fromAppLocalInput } from "@/lib/timezone";

// Módulo "seguimiento": en academia es un control de horas gastadas este
// mes por alumno, que se rellena solo según las clases del calendario van
// terminando (ver complete_finished_academia_appointments en Supabase). El
// resto de verticales sigue con la métrica genérica de siempre (peso,
// dolor, medidas...) y su propio formulario de entradas.
export default async function SeguimientoPage() {
  const supabase = createClient();
  const { vertical } = await getCurrentCompanyProfile();
  const terms = getTerminology(vertical);
  const showAcademia = showsAcademiaFields(vertical);

  if (showAcademia) {
    // Antes de leer, se procesan las clases que ya hayan terminado desde la
    // última vez que alguien miró el panel — así las horas de esta pantalla
    // están al día sin esperar al ciclo diario. Y justo después, con las
    // horas ya al día, se comprueba quién se ha pasado de su bono este mes
    // y se le manda el aviso a /notificaciones si hace falta (mismo cálculo
    // que esta pantalla, ver notify_academia_hour_overages en Supabase).
    await supabase.rpc("complete_finished_academia_appointments");
    await supabase.rpc("notify_academia_hour_overages");

    const nowParts = appLocalParts(new Date());
    const monthStart = fromAppLocalInput(`${nowParts.year}-${String(nowParts.month).padStart(2, "0")}-01T00:00`);
    const nextMonth = nowParts.month === 12 ? { year: nowParts.year + 1, month: 1 } : { year: nowParts.year, month: nowParts.month + 1 };
    const monthEnd = fromAppLocalInput(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}-01T00:00`);

    const [{ data: appointments }, { data: activeBonos }] = await Promise.all([
      supabase
        .from("appointments")
        .select("contact_id, starts_at, ends_at, contacts(full_name)")
        .eq("status", "completed")
        .gte("starts_at", monthStart.toISOString())
        .lt("starts_at", monthEnd.toISOString()),
      // El bono activo más reciente de cada alumno (mismo criterio que
      // complete_finished_academia_appointments), para poder enseñar
      // "horas este mes / horas del bono" en la misma fila.
      supabase
        .from("packages")
        .select("contact_id, total_sessions, created_at, bono_types(unit)")
        .eq("active", true)
        .not("bono_type_id", "is", null)
        .order("created_at", { ascending: false }),
    ]);

    const bonoByContact = new Map<string, { totalHours: number; isHoras: boolean }>();
    (activeBonos ?? []).forEach((p: any) => {
      // Ordenado por created_at desc: la primera vez que aparece un
      // contact_id es su bono activo más reciente — el resto se ignora.
      if (bonoByContact.has(p.contact_id)) return;
      const unit = p.bono_types?.unit;
      bonoByContact.set(p.contact_id, { totalHours: Number(p.total_sessions), isHoras: unit === "horas" });
    });

    const hoursByContact = new Map<string, { name: string; hours: number }>();
    (appointments ?? []).forEach((a: any) => {
      const name = a.contacts?.full_name ?? "—";
      const hours = (new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 3600000;
      const prev = hoursByContact.get(a.contact_id);
      hoursByContact.set(a.contact_id, { name, hours: (prev?.hours ?? 0) + hours });
    });
    const rows = Array.from(hoursByContact.entries()).sort((a, b) => b[1].hours - a[1].hours);

    const monthLabel = monthStart.toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "Europe/Madrid" });

    return (
      <div>
        <PageHeader title="Seguimiento" />
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">
            Horas gastadas este mes <span className="normal-case text-slate/50">({monthLabel})</span>
          </h2>
          <p className="mb-4 text-sm text-slate/70">
            Se suma sola al terminar cada {terms.appointment.toLowerCase()} del calendario, según su duración. Si un
            alumno se pasa de las horas de su bono, llega un aviso a Notificaciones.
          </p>
          <div className={tableWrap}>
            <table className={tableEl}>
              <thead className={theadEl}>
                <tr>
                  <th className={thEl}>{terms.contact}</th>
                  <th className={thEl}>Horas este mes</th>
                  <th className={thEl}>Bono</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([contactId, { name, hours }]) => {
                  const bono = bonoByContact.get(contactId);
                  const overLimit = bono?.isHoras && hours > bono.totalHours;
                  return (
                    <tr key={contactId} className={trEl}>
                      <td className={tdEl}>{name}</td>
                      <td className={tdEl}>
                        <span className={overLimit ? "font-semibold text-red-600" : ""}>
                          {hours.toFixed(2).replace(/\.00$/, "")} h
                        </span>
                        {bono?.isHoras && (
                          <span className="text-slate/50"> / {bono.totalHours.toFixed(2).replace(/\.00$/, "")} h</span>
                        )}
                      </td>
                      <td className={tdEl}>
                        {overLimit ? (
                          <Badge tone="red">Se pasa de horas</Badge>
                        ) : bono?.isHoras ? (
                          <Badge tone="green">Dentro del bono</Badge>
                        ) : (
                          <span className="text-slate/50">Sin bono de horas</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr className={trEl}>
                    <td className={tdEl} colSpan={3}>
                      Sin {terms.appointments.toLowerCase()} completadas todavía este mes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  const { data: contacts } = await supabase.from("contacts").select("id, full_name").order("full_name");
  const { data: entries } = await supabase
    .from("activities")
    .select("id, created_at, custom_fields, contacts(full_name)")
    .eq("type", "progress")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader title="Seguimiento de progreso" />

      <Card className="mb-6">
        <form action={addProgress} className="flex flex-wrap items-end gap-2 text-sm">
          <Select name="contact_id" required>
            <option value="">{terms.contact}</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Input name="label" placeholder="Métrica (ej. peso, dolor)" required />
          <Input name="value" placeholder="Valor" required className="w-24" />
          <PrimaryButton>Añadir</PrimaryButton>
        </form>
      </Card>

      <Card>
        <ul className="space-y-2 text-sm">
          {(entries ?? []).map((e: any) => (
            <li key={e.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
              <span className="text-slate/70">{new Date(e.created_at).toLocaleString("es-ES")}</span>{" — "}
              <span className="font-medium text-ink">{e.contacts?.full_name}</span>:{" "}
              <span className="text-slate">
                {e.custom_fields?.label} = {e.custom_fields?.value}
              </span>
            </li>
          ))}
          {(entries ?? []).length === 0 && <li className="text-slate/70">Sin entradas todavía.</li>}
        </ul>
      </Card>
    </div>
  );
}
