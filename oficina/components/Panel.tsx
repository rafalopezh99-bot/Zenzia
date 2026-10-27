"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Departamento } from "@/lib/departamentos";
import { markdownAHtml } from "@/lib/markdown";
import type { Tarea } from "@/lib/tareas";

type Props = {
  depto: Departamento;
  tareas: Tarea[];
  onCerrar: () => void;
  onEncargar: (texto: string) => string;
  onContinuar: (tarea: Tarea, texto: string | null) => void;
  onCancelar: (id: string) => void;
  onBorrar: (id: string) => void;
};

export function Panel({ depto, tareas, onCerrar, onEncargar, onContinuar, onCancelar, onBorrar }: Props) {
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const tarea = tareas.find((t) => t.id === seleccionada) ?? null;

  useEffect(() => setSeleccionada(null), [depto.id]);

  return (
    <div className="velo" onClick={onCerrar}>
      <aside
        className="panel"
        style={{ ["--c" as string]: depto.color, ["--suelo" as string]: depto.suelo }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={depto.nombre}
      >
        <header className="panel-cabecera">
          {tarea ? (
            <button className="boton-texto" onClick={() => setSeleccionada(null)}>
              ← Tareas de {depto.nombre}
            </button>
          ) : (
            <div>
              <h2>{depto.nombre}</h2>
              <p className="equipo">{depto.empleados.map((e) => `${e.nombre} (${e.rol})`).join(" · ")}</p>
            </div>
          )}
          <button className="cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        {tarea ? (
          <DetalleTarea
            tarea={tarea}
            onContinuar={(texto) => onContinuar(tarea, texto)}
            onCancelar={() => onCancelar(tarea.id)}
            onBorrar={() => {
              onBorrar(tarea.id);
              setSeleccionada(null);
            }}
          />
        ) : (
          <div className="panel-cuerpo">
            <NuevaTarea depto={depto} onEncargar={(texto) => setSeleccionada(onEncargar(texto))} />
            <h3 className="subtitulo">Tareas</h3>
            {tareas.length === 0 ? (
              <p className="vacio">Aún no les has encargado nada. ¡Están deseando!</p>
            ) : (
              <ul className="lista-tareas">
                {tareas.map((t) => (
                  <li key={t.id}>
                    <button onClick={() => setSeleccionada(t.id)}>
                      <span className="lista-titulo">{t.titulo}</span>
                      <span className="lista-meta">
                        <Estado tarea={t} />
                        <span>{new Date(t.creada).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function Estado({ tarea }: { tarea: Tarea }) {
  if (tarea.estado === "trabajando") return <span className="chip chip-trabajando">Trabajando</span>;
  if (tarea.estado === "error") return <span className="chip chip-error">Con problemas</span>;
  return <span className="chip chip-lista">Lista</span>;
}

function NuevaTarea({ depto, onEncargar }: { depto: Departamento; onEncargar: (texto: string) => void }) {
  const [texto, setTexto] = useState("");
  const enviar = () => {
    if (!texto.trim()) return;
    onEncargar(texto.trim());
    setTexto("");
  };
  return (
    <div className="nueva">
      <label htmlFor="encargo">¿Qué necesitas de {depto.nombre}?</label>
      <textarea
        id="encargo"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar();
        }}
        placeholder="Describe la tarea con todo el detalle que quieras…"
        rows={4}
        autoFocus
      />
      <div className="sugerencias">
        {depto.sugerencias.map((s) => (
          <button key={s} type="button" onClick={() => setTexto(s)}>
            {s}
          </button>
        ))}
      </div>
      <button className="boton" onClick={enviar} disabled={!texto.trim()}>
        Encargar tarea
      </button>
      <span className="ayuda">Ctrl + Enter para enviar</span>
    </div>
  );
}

function DetalleTarea({
  tarea,
  onContinuar,
  onCancelar,
  onBorrar,
}: {
  tarea: Tarea;
  onContinuar: (texto: string | null) => void;
  onCancelar: () => void;
  onBorrar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const trabajando = tarea.estado === "trabajando";
  const ultima = tarea.mensajes[tarea.mensajes.length - 1];

  useEffect(() => {
    if (trabajando) finRef.current?.scrollIntoView({ block: "end" });
  }, [tarea.mensajes, trabajando]);

  const copiar = async () => {
    const respuesta = [...tarea.mensajes].reverse().find((m) => m.role === "assistant");
    if (!respuesta) return;
    try {
      await navigator.clipboard.writeText(respuesta.content);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Sin permiso de portapapeles: no pasa nada.
    }
  };

  const enviar = () => {
    if (!texto.trim() || trabajando) return;
    onContinuar(texto.trim());
    setTexto("");
  };

  return (
    <div className="panel-cuerpo detalle">
      <div className="hilo">
        {tarea.mensajes.map((m, i) => (
          <Mensaje key={i} rol={m.role} contenido={m.content} />
        ))}
        {trabajando && (
          <div className="actividad">
            <span className="puntos">
              <i />
              <i />
              <i />
            </span>
            {tarea.actividad ?? "Trabajando…"}
          </div>
        )}
        {tarea.error && <div className="aviso-error">{tarea.error}</div>}
        <div ref={finRef} />
      </div>

      <div className="acciones">
        {trabajando ? (
          <button className="boton-sec" onClick={onCancelar}>
            Cancelar tarea
          </button>
        ) : (
          <>
            <button className="boton-sec" onClick={copiar} disabled={ultima?.role !== "assistant"}>
              {copiado ? "¡Copiado!" : "Copiar respuesta"}
            </button>
            {(tarea.estado === "error" || ultima?.role === "user") && (
              <button className="boton-sec" onClick={() => onContinuar(null)}>
                Reintentar
              </button>
            )}
            <button className="boton-sec peligro" onClick={onBorrar}>
              Borrar
            </button>
          </>
        )}
      </div>

      <div className="seguir">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar();
          }}
          placeholder={trabajando ? "Espera a que terminen…" : "Pide cambios o sigue con la tarea…"}
          rows={2}
          disabled={trabajando}
        />
        <button className="boton" onClick={enviar} disabled={trabajando || !texto.trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
}

function Mensaje({ rol, contenido }: { rol: "user" | "assistant"; contenido: string }) {
  const html = useMemo(() => (rol === "assistant" ? markdownAHtml(contenido) : ""), [rol, contenido]);
  if (rol === "user") return <div className="msg msg-tu">{contenido}</div>;
  return <div className="msg msg-equipo md" dangerouslySetInnerHTML={{ __html: html }} />;
}
