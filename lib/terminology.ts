// Vocabulario que ve el usuario, ajustado por tipo de negocio (vertical).
// El modelo de datos es el mismo para todos (contacts, appointments...),
// solo cambian las palabras que se le muestran a cada cliente para que su
// panel hable el idioma de su negocio en vez de un genérico "Contactos" /
// "Citas". Añadir un vertical nuevo aquí es opcional: si no está, se usan
// las palabras por defecto.

export interface Terminology {
  contact: string; // "Contacto" / "Alumno"
  contacts: string; // "Contactos" / "Alumnos"
  newContact: string; // "Nuevo contacto" / "Nuevo alumno"
  appointment: string; // "Cita" / "Clase"
  appointments: string; // "Citas" / "Clases"
  newAppointment: string; // "Nueva cita" / "Nueva clase"
  agendaLabel: string; // nombre del módulo de agenda en el menú y como título
}

const DEFAULT_TERMS: Terminology = {
  contact: "Contacto",
  contacts: "Contactos",
  newContact: "Nuevo contacto",
  appointment: "Cita",
  appointments: "Citas",
  newAppointment: "Nueva cita",
  agendaLabel: "Agenda",
};

const VERTICAL_TERMS: Record<string, Partial<Terminology>> = {
  academia: {
    contact: "Alumno",
    contacts: "Alumnos",
    newContact: "Nuevo alumno",
    appointment: "Clase",
    appointments: "Clases",
    newAppointment: "Nueva clase",
    agendaLabel: "Calendario",
  },
};

export function getTerminology(vertical?: string | null): Terminology {
  const overrides = vertical ? VERTICAL_TERMS[vertical] : undefined;
  return { ...DEFAULT_TERMS, ...overrides };
}

// Campos de seguimiento de leads (tipo de negocio, Instagram, contactado a
// través de, etapa del pipeline, enlace de demo/presupuesto). Se muestran
// para todas las cuentas — cualquier empresa que gestiona sus propios
// contactos quiere saber cómo llegó el lead y en qué punto de la venta
// está — excepto "academia": un alumno no es un lead que se está
// intentando cerrar, así que esos campos no pegan en la pestaña de
// alumnos (ver showsAcademiaFields, que sí les da sus propios campos:
// curso, asignaturas...).
export function showsAgencyPipeline(vertical?: string | null): boolean {
  return vertical !== "academia";
}

// Curso, bono (tarifario) y asignaturas solo tienen sentido para clases
// particulares — el resto de verticales sigue con el alta de contacto tal
// cual estaba.
export function showsAcademiaFields(vertical?: string | null): boolean {
  return vertical === "academia";
}
