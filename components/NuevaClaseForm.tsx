"use client";

import { useState } from "react";
import { Card, Input, Select, Textarea, PrimaryButton } from "@/components/ui";
import { createAppointment, createClassSchedule } from "@/lib/actions/appointments";

const WEEKDAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

const TAB_ACTIVE = "bg-brand text-white";
const TAB_INACTIVE = "border border-line text-slate hover:border-brand hover:text-brand";

// Formulario de alta de cita/clase con dos modos: una clase puntual (fecha
// + duración) o un horario recurrente (día de la semana + franja horaria,
// para no tener que dar de alta cada semana a mano). El desplegable de
// alumno muestra el curso de cada uno (cuando lo tiene) para saber de un
// vistazo con qué horario del grupo encaja.
export default function NuevaClaseForm({
  contacts,
  contactLabel,
  defaultStartsAt,
  services = [],
}: {
  contacts: { id: string; full_name: string; curso: string | null }[];
  contactLabel: string;
  // Fecha/hora ya rellena al venir de pulsar un hueco libre de la agenda.
  defaultStartsAt?: string;
  // Catálogo de servicios: al elegir uno se rellena la duración.
  services?: { id: string; name: string; duration_min: number; price: number }[];
}) {
  const [mode, setMode] = useState<"puntual" | "recurrente">("puntual");
  const [duration, setDuration] = useState<number>(services?.[0]?.duration_min ?? 60);

  const contactSelect = (
    <Select name="contact_id" required className="w-full">
      <option value="">Selecciona {contactLabel.toLowerCase()}</option>
      {contacts.map((c) => (
        <option key={c.id} value={c.id}>
          {c.full_name}
          {c.curso ? ` — ${c.curso}` : ""}
        </option>
      ))}
    </Select>
  );

  return (
    <Card className="max-w-sm">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("puntual")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mode === "puntual" ? TAB_ACTIVE : TAB_INACTIVE
          }`}
        >
          Puntual
        </button>
        <button
          type="button"
          onClick={() => setMode("recurrente")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mode === "recurrente" ? TAB_ACTIVE : TAB_INACTIVE
          }`}
        >
          Recurrente
        </button>
      </div>

      {mode === "puntual" ? (
        <form action={createAppointment} className="space-y-3">
          {contactSelect}
          <Input name="starts_at" type="datetime-local" required defaultValue={defaultStartsAt} className="w-full" />
          {services.length > 0 && (
            <Select
              name="service_id"
              defaultValue={services[0].id}
              onChange={(e) => setDuration(services.find((s) => s.id === e.target.value)?.duration_min ?? duration)}
              className="w-full"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_min} min · {Number(s.price).toFixed(2)} €
                </option>
              ))}
              <option value="">Sin servicio</option>
            </Select>
          )}
          <label className="block text-xs text-slate">
            Duración (minutos)
            <Input
              name="duration_min"
              type="number"
              step="5"
              min="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <Textarea name="notes" placeholder="Notas" className="w-full" />
          <PrimaryButton>Guardar</PrimaryButton>
        </form>
      ) : (
        <form action={createClassSchedule} className="space-y-3">
          {contactSelect}
          <Select name="weekday" required defaultValue="" className="w-full">
            <option value="">Día de la semana</option>
            {WEEKDAYS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Input name="start_time" type="time" required className="w-full" />
            <Input name="end_time" type="time" required className="w-full" />
          </div>
          <Textarea name="notes" placeholder="Notas" className="w-full" />
          <p className="text-xs text-slate/70">
            Se creará esta clase automáticamente cada semana, ese día y a esa hora.
          </p>
          <PrimaryButton>Guardar horario</PrimaryButton>
        </form>
      )}
    </Card>
  );
}
