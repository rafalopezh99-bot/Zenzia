"use client";

import { useRef, useState } from "react";

// Firma con el dedo o el ratón; se envía como PNG (data URL) en un campo oculto.
export default function SignaturePad({ name }: { name: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState("");
  const drawing = useRef(false);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) * e.currentTarget.width) / r.width, ((e.clientY - r.top) * e.currentTarget.height) / r.height];
  };

  return (
    <div>
      <canvas
        ref={canvas}
        width={600}
        height={200}
        className="w-full touch-none rounded-xl border border-line bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = e.currentTarget.getContext("2d")!;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#0f1f33";
          ctx.beginPath();
          const [x, y] = pos(e);
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const [x, y] = pos(e);
          const ctx = e.currentTarget.getContext("2d")!;
          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={(e) => {
          drawing.current = false;
          setValue(e.currentTarget.toDataURL("image/png"));
        }}
      />
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className="mt-1 text-xs text-slate hover:text-ink"
        onClick={() => {
          canvas.current?.getContext("2d")?.clearRect(0, 0, 600, 200);
          setValue("");
        }}
      >
        Borrar firma
      </button>
    </div>
  );
}
