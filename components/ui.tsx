import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, ButtonHTMLAttributes, TextareaHTMLAttributes } from "react";

// Sistema de diseño compartido de Zenzia: la misma estética "paper" clara
// de la landing pública (zenzia.es) y de rldigitalstudios.com — fondo casi
// blanco, texto casi negro, acentos en el azul-verdoso de marca. Antes este
// archivo pintaba un panel oscuro con degradados verde/violeta; ahora usa
// los mismos tokens que lib/marketing-theme.ts, expuestos como colores de
// Tailwind (paper/paper-deep/ink/slate/line/brand) en tailwind.config.ts.
// Todo el panel usa estas piezas para que cambiar el look en un sitio lo
// cambie en todos lados.

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
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand">{eyebrow}</div>}
        <h1 className="text-2xl font-black uppercase tracking-tight text-ink">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}>{children}</div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 ${
        props.className ?? ""
      }`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 ${
        props.className ?? ""
      }`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 ${
        props.className ?? ""
      }`}
    />
  );
}

// Clase de texto plano para usarla en elementos que no pueden ser un
// <button> (p. ej. <Link>, donde anidar un <button> dentro de un <a> no es
// válido en HTML).
export const primaryButtonClass =
  "inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110";

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

// Mismo tratamiento visual que PrimaryButton pero para enlaces secundarios
// ("Ver semana", "Ver mes"...) que necesitan ir en un <Link>, no en un
// <button> — evita que cada página repita la misma cadena de clases suelta.
export const secondaryLinkClass =
  "inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand";

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full border border-line px-3 py-1.5 text-xs font-medium text-slate transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-slate ${
        props.className ?? ""
      }`}
    />
  );
}

const BADGE_TONES: Record<string, string> = {
  neutral: "bg-paper-deep text-slate",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
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
export const tableWrap = "overflow-x-auto rounded-2xl border border-line";
export const tableEl = "w-full text-left text-sm";
export const theadEl = "bg-paper-deep text-xs uppercase tracking-wide text-slate";
export const thEl = "px-4 py-3 font-medium";
export const tdEl = "px-4 py-3";
export const trEl = "border-t border-line transition hover:bg-paper-deep";
