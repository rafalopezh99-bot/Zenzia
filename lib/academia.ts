// Constantes propias del vertical academia (clases particulares), compartidas
// entre el alta de alumno (/contactos/nuevo) y la vista de grupos (/grupos)
// para que ambas usen el mismo orden de curso.

export const CURSOS: { nivel: string; opciones: string[] }[] = [
  { nivel: "ESO", opciones: ["1º ESO", "2º ESO", "3º ESO", "4º ESO"] },
  { nivel: "Bachillerato", opciones: ["1º Bachillerato", "2º Bachillerato"] },
  { nivel: "Otros", opciones: ["Selectividad / EVAU"] },
];

// Lista plana de cursos en el orden en que deben mostrarse (grupos, etc.).
export const CURSO_ORDER: string[] = CURSOS.flatMap((g) => g.opciones);
