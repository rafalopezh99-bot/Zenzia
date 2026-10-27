"use client";

import { useEffect, useState } from "react";
import type { Empleado } from "@/lib/departamentos";

export type Animo = "trabajando" | "libre" | "aviso";

// Gestos que hacen cuando no tienen tarea, para que la oficina se vea viva.
const GESTOS = ["quieto", "cafe", "mirar", "estirarse", "quieto", "mirar"] as const;
type Gesto = (typeof GESTOS)[number];

function useGesto(activo: boolean): Gesto {
  const [gesto, setGesto] = useState<Gesto>("quieto");
  useEffect(() => {
    if (!activo) {
      setGesto("quieto");
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const siguiente = () => {
      setGesto(GESTOS[Math.floor(Math.random() * GESTOS.length)]);
      t = setTimeout(siguiente, 2500 + Math.random() * 4000);
    };
    t = setTimeout(siguiente, Math.random() * 3000);
    return () => clearTimeout(t);
  }, [activo]);
  return gesto;
}

export function Muneco({
  empleado,
  animo,
  bocadillo,
  colorDepto,
}: {
  empleado: Empleado;
  animo: Animo;
  bocadillo?: string;
  colorDepto: string;
}) {
  const gesto = useGesto(animo !== "trabajando");
  const clases = ["puesto", `animo-${animo}`, animo === "trabajando" ? "" : `gesto-${gesto}`].join(" ");
  // Desfase aleatorio estable para que no tecleen todos al compás.
  const [retraso] = useState(() => `${(Math.random() * -1.2).toFixed(2)}s`);

  return (
    <div className={clases} style={{ animationDelay: retraso }} title={`${empleado.nombre} · ${empleado.rol}`}>
      {bocadillo && <div className="bocadillo">{bocadillo}</div>}
      <svg viewBox="0 0 64 92" className="muneco" aria-hidden>
        {/* Plumbob, el rombo de los Sims: verde libre, amarillo trabajando, azul con aviso */}
        <g className="plumbob">
          <polygon points="32,2 38,11 32,20 26,11" />
          <polygon points="32,2 38,11 32,11" className="brillo" />
        </g>

        {/* Silla */}
        <rect x="14" y="40" width="36" height="34" rx="9" fill="#3d4655" />

        <g className="cuerpo">
          {/* Cuerpo */}
          <rect x="19" y="47" width="26" height="26" rx="10" fill={empleado.camisa} />
          {/* Brazos */}
          <g className="brazo brazo-i">
            <rect x="13" y="52" width="9" height="18" rx="4.5" fill={empleado.camisa} />
            <circle cx="17.5" cy="70" r="3.6" fill={empleado.piel} />
          </g>
          <g className="brazo brazo-d">
            <rect x="42" y="52" width="9" height="18" rx="4.5" fill={empleado.camisa} />
            <circle cx="46.5" cy="70" r="3.6" fill={empleado.piel} />
          </g>
          {/* Taza de café (solo en el gesto "cafe") */}
          <g className="taza">
            <rect x="43" y="58" width="8" height="9" rx="2" fill="#ffffff" stroke="#c9ced6" strokeWidth="1" />
            <path d="M51 60 q4 2.5 0 5" stroke="#c9ced6" strokeWidth="1.5" fill="none" />
          </g>
          {/* Cabeza */}
          <g className="cabeza">
            <rect x="29" y="40" width="6" height="7" fill={empleado.piel} />
            <circle cx="32" cy="32" r="12" fill={empleado.piel} />
            <path d="M20 31 q0 -13 12 -13 q12 0 12 13 q-3 -6 -12 -6 q-9 0 -12 6z" fill={empleado.pelo} />
            <g className="ojos">
              <circle cx="27.5" cy="33" r="1.6" fill="#1b1b1b" />
              <circle cx="36.5" cy="33" r="1.6" fill="#1b1b1b" />
            </g>
            <path d="M28.5 38 q3.5 2.5 7 0" stroke="#7a3b2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <circle cx="24.5" cy="37" r="1.8" fill="#ff8a7a" opacity="0.35" />
            <circle cx="39.5" cy="37" r="1.8" fill="#ff8a7a" opacity="0.35" />
          </g>
        </g>

        {/* Mesa y portátil (lo vemos por detrás, con el logo encendido si trabaja) */}
        <rect x="2" y="72" width="60" height="7" rx="2" fill="#b98a5e" />
        <rect x="6" y="79" width="4" height="13" fill="#8e6641" />
        <rect x="54" y="79" width="4" height="13" fill="#8e6641" />
        <path d="M20 72 l3 -16 h18 l3 16z" fill="#c9ced6" />
        <circle cx="32" cy="64" r="3" className="logo-portatil" fill={colorDepto} />
      </svg>
      <div className="placa">
        <strong>{empleado.nombre}</strong>
        <span>{empleado.rol}</span>
      </div>
    </div>
  );
}
