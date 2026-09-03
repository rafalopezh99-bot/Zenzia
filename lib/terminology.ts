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
    agendaLabel: "Clases",
  },
};

export function getTerminology(vertical?: string | null): Terminology {
  const overrides = vertical ? VERTICAL_TERMS[vertical] : undefined;
  return { ...DEFAULT_TERMS, ...overrides };
}

// Los campos de pipeline de ventas (etapa del lead, enlace de demo, tipo de
// negocio del prospecto) solo tienen sentido para RL Digital Studios
// vendiendo Zenzia a nuevos clientes — no para una empresa real usando
// Zenzia para gestionar a sus propios contactos/alumnos/pacientes.
export function showsAgencyPipeline(vertical?: string | null): boolean {
  return vertical === "agencia";
}

// Curso, bono (tarifario) y asignaturas solo tienen sentido para clases
// particulares — el resto de verticales sigue con el alta de contacto tal
// cual estaba.
export function showsAcademiaFields(vertical?: string | null): boolean {
  return vertical === "academia";
}
