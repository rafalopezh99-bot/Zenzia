// Plantillas de notas de sesión por sector (se insertan en la cita).
const SOAP = "S (subjetivo): \nO (objetivo / exploración): \nA (valoración): \nP (plan / próxima sesión): ";

const BY_VERTICAL: Record<string, { label: string; text: string }[]> = {
  fisio: [
    { label: "Evaluación inicial", text: "Motivo de consulta: \nInicio y evolución: \nDolor (EVA 0-10): \nExploración / balance articular: \nTests: \nDiagnóstico fisioterápico: \nObjetivos: \nPlan de tratamiento: " },
    { label: "Sesión (SOAP)", text: SOAP },
    { label: "Ejercicios para casa", text: "Ejercicios pautados:\n1. \n2. \n3. \nFrecuencia: \nObservaciones: " },
  ],
  nutricion: [
    { label: "Primera consulta", text: "Objetivo: \nPeso: \nAltura: \nIMC: \n% grasa: \nPerímetro cintura: \nHábitos / alergias / intolerancias: \nRecordatorio 24 h: \nPauta inicial: " },
    { label: "Revisión", text: "Peso: \n% grasa: \nAdherencia a la pauta (1-10): \nDificultades: \nCambios en la pauta: " },
  ],
  psicologia: [
    { label: "Primera sesión", text: "Motivo de consulta: \nHistoria del problema: \nAntecedentes: \nObjetivos terapéuticos: \nImpresión clínica: \nPlan: " },
    { label: "Sesión de seguimiento", text: "Temas trabajados: \nEstado emocional: \nTareas acordadas: \nObservaciones: \nPróxima sesión: " },
  ],
  entrenador_personal: [
    { label: "Valoración", text: "Objetivo: \nNivel / experiencia: \nLesiones: \nTests (fuerza, resistencia, movilidad): \nPlan de entrenamiento: " },
    { label: "Sesión", text: "Calentamiento: \nBloque principal: \nCargas / series / repeticiones: \nSensaciones (RPE): \nPróxima sesión: " },
  ],
};
BY_VERTICAL.osteopatia = BY_VERTICAL.fisio;
BY_VERTICAL.podologia = BY_VERTICAL.fisio;
BY_VERTICAL.logopedia = [{ label: "Sesión (SOAP)", text: SOAP }];
BY_VERTICAL.pilates_yoga = BY_VERTICAL.entrenador_personal;
BY_VERTICAL.coaching = BY_VERTICAL.psicologia;

export function noteTemplatesFor(vertical: string | null) {
  return (vertical && BY_VERTICAL[vertical]) || [{ label: "Sesión (SOAP)", text: SOAP }];
}
