"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mientras haya algo pendiente (p. ej. facturas esperando respuesta de
// VeriFactu), recarga los datos de la página cada `seconds` segundos sin
// recargar el navegador. Se detiene sola a los 3 minutos.
export default function AutoRefresh({ active, seconds = 5 }: { active: boolean; seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const started = Date.now();
    const id = setInterval(() => {
      if (Date.now() - started > 3 * 60 * 1000) return clearInterval(id);
      router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [active, seconds, router]);
  return null;
}
