// Tareas encargadas a los departamentos. Se guardan en el navegador del PC
// (localStorage), así el historial sigue ahí al volver a abrir la oficina.

export type Turno = { role: "user" | "assistant"; content: string };

export type Tarea = {
  id: string;
  depto: string;
  titulo: string;
  mensajes: Turno[];
  estado: "trabajando" | "lista" | "error";
  error?: string;
  // Qué están haciendo ahora mismo (pensando, buscando, escribiendo).
  actividad?: string;
  creada: number;
  actualizada: number;
  vista: boolean;
};

const CLAVE = "oficina.tareas.v1";

export function cargarTareas(): Tarea[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const tareas: Tarea[] = crudo ? JSON.parse(crudo) : [];
    // Si se cerró la oficina a mitad de una tarea, esa tarea quedó cortada.
    return tareas.map((t) =>
      t.estado === "trabajando"
        ? { ...t, estado: "error", error: "Se interrumpió al cerrar la oficina. Pulsa «Reintentar».", actividad: undefined }
        : t,
    );
  } catch {
    return [];
  }
}

export function guardarTareas(tareas: Tarea[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(tareas));
  } catch {
    // Sin almacenamiento disponible: la oficina sigue funcionando sin historial.
  }
}

export function tituloDe(texto: string): string {
  const linea = texto.trim().split("\n")[0];
  return linea.length > 70 ? linea.slice(0, 67) + "…" : linea;
}

export function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
