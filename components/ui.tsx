import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, ButtonHTMLAttributes, TextareaHTMLAttributes } from "react";

// Sistema de diseño compartido de Zenzia: oscuro casi negro, acentos en
// degradado verde/violeta, tarjetas redondeadas con borde suave. Todo el
// panel usa estas piezas para que cambiar el look en un sitio lo cambie
// en todos lados.

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-400/80">{eyebrow}</div>
        )}
        <h1 className="bg-gradient-to-r from-emerald-300 to-violet-400 bg-clip-text text-2xl font-bold text-transparent">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0d1420]/70 p-5 shadow-[0_0_40px_-20px_rgba(52,211,153,0.25)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-lg border border-white/10 bg-[#0a0f19] px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-400/60 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 ${
        props.className ?? ""
      }`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`rounded-lg border border-white/10 bg-[#0a0f19] px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-400/60 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 ${
        props.className ?? ""
      }`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-lg border border-white/10 bg-[#0a0f19] px-3 py-2 text-sm text-neutral-100 focus:border-emerald-400/60 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 ${
        props.className ?? ""
      }`}
    />
  );
}

// Clase de texto plano para usarla en elementos que no pueden ser un
// <button> (p. ej. <Link>, donde anidar un <button> dentro de un <a> no es
// válido en HTML).
export const primaryButtonClass =
  "inline-block rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:brightness-110";

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-emerald-400/50 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15 disabled:hover:text-neutral-300 ${
        props.className ?? ""
      }`}
    />
  );
}

const BADGE_TONES: Record<string, string> = {
  neutral: "bg-white/5 text-neutral-300",
  green: "bg-emerald-400/10 text-emerald-300",
  amber: "bg-amber-400/10 text-amber-300",
  red: "bg-red-400/10 text-red-300",
  violet: "bg-violet-400/10 text-violet-300",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "violet";
}) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_TONES[tone]}`}>{children}</span>;
}

// Clases reutilizables para tablas (se aplican directamente, no como
// componente, porque <table>/<tr>/<td> necesitan quedarse como elementos
// nativos para que el HTML sea válido).
export const tableWrap = "overflow-hidden rounded-2xl border border-white/10";
export const tableEl = "w-full text-left text-sm";
export const theadEl = "bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500";
export const thEl = "px-4 py-3 font-medium";
export const tdEl = "px-4 py-3";
export const trEl = "border-t border-white/5 transition hover:bg-white/[0.02]";
