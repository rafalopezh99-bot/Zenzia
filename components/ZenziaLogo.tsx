// Logotipo de Zenzia dibujado en SVG (antes era un PNG): "Zenz" en navy e
// "ia" en el celeste del punto de la i, tipografía Outfit (cargada en
// app/layout.tsx). En modo oscuro el navy pasa a un tono claro; con
// `light` se fuerza siempre la versión clara (web pública, sin modo oscuro).
// El tamaño lo marca la altura que llegue en className (h-6, h-14...).
export default function ZenziaLogo({ className, light = false }: { className: string; light?: boolean }) {
  const ink = light ? "fill-[#163e6e]" : "fill-[#163e6e] dark:fill-[#e6eef7]";
  const accent = light ? "fill-[#2f9ce0]" : "fill-[#2f9ce0] dark:fill-[#4fa8e8]";
  return (
    <svg viewBox="0 0 232 66" role="img" aria-label="Zenzia" className={`${className} w-auto`}>
      <text
        x="0"
        y="60"
        textLength="230"
        lengthAdjust="spacingAndGlyphs"
        style={{ fontFamily: "Outfit, Inter, sans-serif", fontWeight: 600, fontSize: 76, letterSpacing: "-1px" }}
      >
        <tspan className={ink}>Zenz</tspan>
        <tspan className={accent}>ia</tspan>
      </text>
    </svg>
  );
}
