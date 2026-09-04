"use client";

import { useEffect, useState } from "react";

// Reloj en vivo del dashboard, siempre en hora de Sevilla/Madrid (con
// cambio de horario automático vía Intl — no depende de dónde esté el
// dispositivo del usuario). Se pinta ya con la hora correcta en el primer
// render (sin parpadeo) y luego se actualiza cada segundo.
function nowLabel() {
  const d = new Date();
  const date = d.toLocaleDateString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = d.toLocaleTimeString("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { date, time };
}

export default function LiveClock() {
  // Empieza en null a propósito: si se calculara la hora ya en el primer
  // render, el servidor (SSR) y el navegador la calcularían en instantes
  // distintos y React se quejaría de un mismatch de hidratación. Se rellena
  // en el useEffect, que solo corre en el cliente.
  const [label, setLabel] = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
    setLabel(nowLabel());
    const id = setInterval(() => setLabel(nowLabel()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <div className="text-xs capitalize text-slate/70">{label?.date ?? " "}</div>
      <div className="font-mono text-lg font-semibold tabular-nums text-ink">{label?.time ?? "--:--:--"}</div>
    </div>
  );
}
