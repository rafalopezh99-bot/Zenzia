// Icono "i" pequeño con explicación al pasar el ratón o tocarlo (sin JS).
export default function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <span
        tabIndex={0}
        role="button"
        aria-label={text}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate/50 text-[10px] font-bold leading-none text-slate outline-none focus:border-brand focus:text-brand"
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-6 z-20 w-56 rounded-lg bg-ink px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-paper opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
