"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEPARTAMENTOS, type Departamento } from "@/lib/departamentos";
import { cargarTareas, guardarTareas, nuevoId, tituloDe, type Tarea, type Turno } from "@/lib/tareas";
import { crearEdificio } from "@/lib/edificio";
import { Panel } from "./Panel";

const FRASES_TRABAJO = ["Manos a la obra", "Dame un segundo…", "Interesante…", "¡Ya casi!", "Revisando…"];

type EstadoSala = { animo: "libre" | "trabajando" | "aviso"; bocadillo?: string; estado: string; avisos: number };

export function Oficina() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargado, setCargado] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const controladores = useRef(new Map<string, AbortController>());

  useEffect(() => {
    setTareas(cargarTareas());
    setCargado(true);
  }, []);

  useEffect(() => {
    if (cargado) guardarTareas(tareas);
  }, [tareas, cargado]);

  const actualizar = useCallback((id: string, cambio: (t: Tarea) => Tarea) => {
    setTareas((ts) => ts.map((t) => (t.id === id ? cambio(t) : t)));
  }, []);

  const ejecutar = useCallback(
    async (id: string, depto: string, mensajes: Turno[], vistaAlAcabar: () => boolean) => {
      const ctrl = new AbortController();
      controladores.current.set(id, ctrl);
      let respuesta = "";
      let error: string | undefined;

      try {
        const res = await fetch("/api/tarea", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ departamento: depto, mensajes }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const cuerpo = await res.json().catch(() => null);
          throw new Error(cuerpo?.error ?? `Error ${res.status}`);
        }

        const lector = res.body.getReader();
        const dec = new TextDecoder();
        let resto = "";
        for (;;) {
          const { value, done } = await lector.read();
          if (done) break;
          resto += dec.decode(value, { stream: true });
          const lineas = resto.split("\n");
          resto = lineas.pop() ?? "";
          for (const l of lineas) {
            if (!l.trim()) continue;
            const ev = JSON.parse(l) as { t: string; v?: string };
            if (ev.t === "texto") {
              respuesta += ev.v ?? "";
              const parcial = respuesta;
              actualizar(id, (t) => ({
                ...t,
                mensajes: [...mensajes, { role: "assistant", content: parcial }],
                actualizada: Date.now(),
              }));
            } else if (ev.t === "estado") {
              actualizar(id, (t) => ({ ...t, actividad: ev.v }));
            } else if (ev.t === "error") {
              error = ev.v;
            }
          }
        }
      } catch (e) {
        error = ctrl.signal.aborted ? "Tarea cancelada." : e instanceof Error ? e.message : "Error desconocido";
      } finally {
        controladores.current.delete(id);
      }

      const final: Turno[] = respuesta ? [...mensajes, { role: "assistant", content: respuesta }] : mensajes;
      actualizar(id, (t) => ({
        ...t,
        mensajes: final,
        estado: error && !respuesta ? "error" : "lista",
        error,
        actividad: undefined,
        actualizada: Date.now(),
        vista: vistaAlAcabar(),
      }));
    },
    [actualizar],
  );

  const abiertoRef = useRef(abierto);
  abiertoRef.current = abierto;

  const encargar = useCallback(
    (depto: string, texto: string) => {
      const mensajes: Turno[] = [{ role: "user", content: texto }];
      const tarea: Tarea = {
        id: nuevoId(),
        depto,
        titulo: tituloDe(texto),
        mensajes,
        estado: "trabajando",
        actividad: "Leyendo el encargo…",
        creada: Date.now(),
        actualizada: Date.now(),
        vista: true,
      };
      setTareas((ts) => [tarea, ...ts]);
      void ejecutar(tarea.id, depto, mensajes, () => abiertoRef.current === depto);
      return tarea.id;
    },
    [ejecutar],
  );

  const continuar = useCallback(
    (tarea: Tarea, texto: string | null) => {
      // texto null = reintentar el último encargo tal cual.
      const base = tarea.mensajes[tarea.mensajes.length - 1]?.role === "assistant" && texto === null
        ? tarea.mensajes.slice(0, -1)
        : tarea.mensajes;
      const mensajes: Turno[] = texto === null ? base : [...base, { role: "user", content: texto }];
      if (mensajes[mensajes.length - 1]?.role !== "user") return;
      actualizar(tarea.id, (t) => ({
        ...t,
        mensajes,
        estado: "trabajando",
        error: undefined,
        actividad: "Leyendo el encargo…",
        actualizada: Date.now(),
      }));
      void ejecutar(tarea.id, tarea.depto, mensajes, () => abiertoRef.current === tarea.depto);
    },
    [actualizar, ejecutar],
  );

  const cancelar = useCallback((id: string) => controladores.current.get(id)?.abort(), []);
  const borrar = useCallback((id: string) => {
    controladores.current.get(id)?.abort();
    setTareas((ts) => ts.filter((t) => t.id !== id));
  }, []);
  const marcarVistas = useCallback((depto: string) => {
    setTareas((ts) => ts.map((t) => (t.depto === depto && !t.vista ? { ...t, vista: true } : t)));
  }, []);

  useEffect(() => {
    if (abierto) marcarVistas(abierto);
  }, [abierto, tareas, marcarVistas]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const enCurso = tareas.filter((t) => t.estado === "trabajando").length;
  const deptoAbierto = DEPARTAMENTOS.find((d) => d.id === abierto);

  return (
    <div className="app">
      <header className="cabecera">
        <div>
          <h1>Oficina ZENZIA</h1>
          <p>Pulsa un departamento para encargarle una tarea.</p>
        </div>
        <Reloj enCurso={enCurso} />
      </header>

      <main>
        <Edificio tareas={tareas} onAbrir={setAbierto} />
      </main>

      {deptoAbierto && (
        <Panel
          depto={deptoAbierto}
          tareas={tareas.filter((t) => t.depto === deptoAbierto.id)}
          onCerrar={() => setAbierto(null)}
          onEncargar={(texto) => encargar(deptoAbierto.id, texto)}
          onContinuar={continuar}
          onCancelar={cancelar}
          onBorrar={borrar}
        />
      )}
    </div>
  );
}

function Reloj({ enCurso }: { enCurso: number }) {
  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    setAhora(new Date());
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="reloj">
      <span className="hora">{ahora?.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) ?? "--:--"}</span>
      <span className={enCurso ? "chip chip-trabajando" : "chip"}>
        {enCurso ? `${enCurso} ${enCurso === 1 ? "tarea" : "tareas"} en marcha` : "Todo el equipo libre"}
      </span>
    </div>
  );
}

// El edificio se dibuja con lib/edificio.js (mismo código que la versión de
// una sola página); aquí solo se le pasa el estado de cada departamento.
function Edificio({ tareas, onAbrir }: { tareas: Tarea[]; onAbrir: (id: string) => void }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const escena = useRef<ReturnType<typeof crearEdificio> | null>(null);
  const onAbrirRef = useRef(onAbrir);
  onAbrirRef.current = onAbrir;

  useEffect(() => {
    if (!contenedor.current) return;
    escena.current = crearEdificio(contenedor.current, {
      deptos: DEPARTAMENTOS,
      onAbrir: (id: string) => onAbrirRef.current(id),
    });
    return () => {
      escena.current?.destruir();
      escena.current = null;
    };
  }, []);

  useEffect(() => {
    const estados: Record<string, EstadoSala> = {};
    for (const d of DEPARTAMENTOS) {
      const suyas = tareas.filter((t) => t.depto === d.id);
      const activa = suyas.find((t) => t.estado === "trabajando");
      const avisos = suyas.filter((t) => !t.vista).length;
      estados[d.id] = {
        animo: activa ? "trabajando" : avisos ? "aviso" : "libre",
        bocadillo: activa ? activa.actividad ?? FRASES_TRABAJO[d.id.length % FRASES_TRABAJO.length] : undefined,
        avisos,
        estado: activa
          ? `Trabajando: ${activa.titulo}`
          : avisos
            ? `¡Tienen ${avisos === 1 ? "algo listo" : `${avisos} cosas listas`} para ti!`
            : `Libres · ${suyas.length} ${suyas.length === 1 ? "tarea hecha" : "tareas hechas"}`,
      };
    }
    escena.current?.actualizar(estados);
  }, [tareas]);

  return <div ref={contenedor} />;
}
