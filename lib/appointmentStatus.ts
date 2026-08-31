// Compartido entre la vista de lista (/citas) y la de calendario
// (/citas/calendario) para no duplicar las etiquetas y colores de estado.

export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

export const APPOINTMENT_STATUS_TONE: Record<string, "green" | "amber" | "red" | "neutral"> = {
  scheduled: "amber",
  completed: "green",
  cancelled: "red",
  no_show: "neutral",
};
