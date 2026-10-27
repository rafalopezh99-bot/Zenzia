"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEPARTAMENTOS, type Departamento } from "@/lib/departamentos";
import { cargarTareas, guardarTareas, nuevoId, tituloDe, type Tarea, type Turno } from "@/lib/tareas";
import { Muneco, type Animo } from "./Muneco";
import { Panel } from "./Panel";

const FRASES_TRABAJO = ["Manos a la obra", "Dame un segundo…", "Interesante…", "¡Ya casi!", "Revisando…"];

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

      <main className="planta">
        {DEPARTAMENTOS.map((d) => (
          <Sala
            key={d.id}
            depto={d}
            tareas={tareas.filter((t) => t.depto === d.id)}
            onAbrir={() => setAbierto(d.id)}
          />
        ))}
        <SalaDescanso />
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

function Sala({ depto, tareas, onAbrir }: { depto: Departamento; tareas: Tarea[]; onAbrir: () => void }) {
  const activa = tareas.find((t) => t.estado === "trabajando");
  const avisos = tareas.filter((t) => !t.vista).length;
  const [frase] = useState(() => Math.floor(Math.random() * FRASES_TRABAJO.length));

  const animo: Animo = activa ? "trabajando" : avisos ? "aviso" : "libre";

  return (
    <button
      type="button"
      className={`sala ${activa ? "sala-activa" : ""}`}
      style={{ ["--c" as string]: depto.color, ["--suelo" as string]: depto.suelo }}
      onClick={onAbrir}
      aria-label={`Abrir ${depto.nombre}`}
    >
      <div className="pared">
        <div className="cartel">
          <span className="cartel-nombre">{depto.nombre}</span>
          <span className="cartel-lema">{depto.lema}</span>
        </div>
        {avisos > 0 && <span className="globo-aviso">{avisos}</span>}
        <div className="cuadro" />
      </div>
      <div className="suelo">
        {depto.empleados.map((e, i) => (
          <Muneco
            key={e.nombre}
            empleado={e}
            animo={animo}
            colorDepto={depto.color}
            bocadillo={activa && i === 0 ? activa.actividad ?? FRASES_TRABAJO[frase] : undefined}
          />
        ))}
        <div className="planta-maceta" />
      </div>
      <div className="pie-sala">
        {activa ? (
          <span className="estado-sala trabajando">Trabajando: {activa.titulo}</span>
        ) : avisos ? (
          <span className="estado-sala aviso">¡Tienen {avisos === 1 ? "algo listo" : `${avisos} cosas listas`} para ti!</span>
        ) : (
          <span className="estado-sala">Libres · {tareas.length} {tareas.length === 1 ? "tarea" : "tareas"} hechas</span>
        )}
      </div>
    </button>
  );
}

function SalaDescanso() {
  return (
    <div className="sala sala-descanso" style={{ ["--c" as string]: "#7a8699", ["--suelo" as string]: "#efe9e1" }}>
      <div className="pared">
        <div className="cartel">
          <span className="cartel-nombre">Office</span>
          <span className="cartel-lema">Café y descanso</span>
        </div>
        <div className="ventana" />
      </div>
      <div className="suelo suelo-descanso">
        <div className="cafetera">
          <div className="vapor" />
        </div>
        <div className="sofa" />
        <div className="paseante">
          <svg viewBox="0 0 40 70" aria-hidden>
            <circle cx="20" cy="14" r="10" fill="#f1c7a3" />
            <path d="M10 13 q0 -11 10 -11 q10 0 10 11 q-3 -5 -10 -5 q-7 0 -10 5z" fill="#2b2b2b" />
            <circle cx="16.5" cy="15" r="1.3" fill="#1b1b1b" />
            <circle cx="23.5" cy="15" r="1.3" fill="#1b1b1b" />
            <rect x="11" y="25" width="18" height="22" rx="7" fill="#163e6e" />
            <rect className="pierna pierna-i" x="13" y="45" width="6" height="18" rx="3" fill="#2f3542" />
            <rect className="pierna pierna-d" x="21" y="45" width="6" height="18" rx="3" fill="#2f3542" />
          </svg>
        </div>
        <div className="planta-maceta" />
      </div>
      <div className="pie-sala">
        <span className="estado-sala">Aquí se recargan pilas</span>
      </div>
    </div>
  );
}
