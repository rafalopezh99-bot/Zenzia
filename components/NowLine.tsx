"use client";

import { useEffect, useState } from "react";
import { appLocalParts } from "@/lib/timezone";

// Línea que marca la hora actual (en horario de Sevilla/Madrid) sobre la
// columna del día de hoy en la agenda semanal, para ayudar a organizarse de
// un vistazo. Solo se pinta si "hoy" es uno de los días mostrados y la hora
// actual cae dentro de la franja visible (08:00–20:00).
//
// Empieza oculta (top = null) y se calcula ya en el useEffect, que solo
// corre en el cliente: si se calculara en el primer render, el servidor
// (SSR) y el navegador lo calcularían en instantes distintos y React se
// quejaría de un mismatch de hidratación.
export default function NowLine({
  dateStr,
  startHour,
  endHour,
  rowHeight,
}: {
  dateStr: string; // "YYYY-MM-DD" del día de esta columna
  startHour: number;
  endHour: number;
  rowHeight: number;
}) {
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    function update() {
      const p = appLocalParts(new Date());
      const today = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
      if (today !== dateStr || p.hour < startHour || p.hour >= endHour) {
        setTop(null);
        return;
      }
      setTop(((p.hour - startHour) * 60 + p.minute) / 60 * rowHeight);
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [dateStr, startHour, endHour, rowHeight]);

  if (top === null) return null;

  return (
    <div className="pointer-events-none absolute left-0 right-0 z-10 flex items-center" style={{ top }}>
      <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
      <div className="h-px flex-1 bg-red-500" />
    </div>
  );
}
