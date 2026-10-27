// Escena del edificio en corte (como una casa de muñecas): plantas apiladas,
// habitaciones sin pared delantera y muñecos que andan, se sientan a trabajar
// y descansan. Es JavaScript sin dependencias para poder usar el mismo código
// en la app de Next y en la versión de una sola página.
//
//   const escena = crearEdificio(contenedor, { deptos, onAbrir })
//   escena.actualizar({ [idDepto]: { animo, bocadillo, estado, avisos } })
//   escena.destruir()
//
// animo: "libre" | "trabajando" | "aviso"

const ESC = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const RAFA = { nombre: "Rafa", rol: "El jefe", piel: "#f1c7a3", pelo: "#2b2b2b", camisa: "#1d2533" };

// Decoración de la pared del fondo de cada sala.
const DECORADO = {
  web: `<div class="d-pantalla"><i></i><i></i><i></i><i></i><i></i></div><div class="d-poster">&lt;/&gt;</div>`,
  zenzia: `<div class="d-pizarra"><span>Zenzia</span><b style="height:30%"></b><b style="height:55%"></b><b style="height:42%"></b><b style="height:80%"></b></div><div class="d-ventana"></div>`,
  legal: `<div class="d-libreria"></div><div class="d-diploma"></div>`,
  ciber: `<div class="d-rack"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="d-escudo"></div>`,
  marketing: `<div class="d-corcho"><i></i><i></i><i></i><i></i><i></i></div><div class="d-ventana"></div>`,
  office: `<div class="d-ventana d-ventana-grande"></div><div class="d-cuadro"></div>`,
};

function svgPersona(e) {
  return `<svg viewBox="0 0 40 66" aria-hidden="true">
    <g class="plumbob"><polygon points="20,0 25,7 20,14 15,7"></polygon><polygon points="20,0 25,7 20,7" class="brillo"></polygon></g>
    <g class="cuerpo">
      <g class="pierna pierna-i"><rect x="13" y="46" width="6" height="15" rx="3" fill="#2f3542"></rect><rect x="11.5" y="58.5" width="8" height="4.5" rx="2" fill="#1b1e24"></rect></g>
      <g class="pierna pierna-d"><rect x="21" y="46" width="6" height="15" rx="3" fill="#2f3542"></rect><rect x="20.5" y="58.5" width="8" height="4.5" rx="2" fill="#1b1e24"></rect></g>
      <rect x="11" y="29" width="18" height="20" rx="7" fill="${e.camisa}"></rect>
      <g class="brazo brazo-i"><rect x="7" y="31" width="6" height="14" rx="3" fill="${e.camisa}"></rect><circle cx="10" cy="45" r="2.6" fill="${e.piel}"></circle></g>
      <g class="brazo brazo-d"><rect x="27" y="31" width="6" height="14" rx="3" fill="${e.camisa}"></rect><circle cx="30" cy="45" r="2.6" fill="${e.piel}"></circle></g>
      <g class="taza"><rect x="29" y="38" width="6" height="7" rx="1.5" fill="#ffffff" stroke="#c9ced6" stroke-width="0.8"></rect></g>
      <g class="cabeza">
        <rect x="17.5" y="24" width="5" height="6" fill="${e.piel}"></rect>
        <circle cx="20" cy="18" r="9" fill="${e.piel}"></circle>
        <path d="M11 17 q0 -10 9 -10 q9 0 9 10 q-2.5 -4.5 -9 -4.5 q-6.5 0 -9 4.5z" fill="${e.pelo}"></path>
        <g class="ojos"><circle cx="16.8" cy="19" r="1.2" fill="#1b1b1b"></circle><circle cx="23.2" cy="19" r="1.2" fill="#1b1b1b"></circle></g>
        <path d="M17.5 22.5 q2.5 2 5 0" stroke="#7a3b2a" stroke-width="1" fill="none" stroke-linecap="round"></path>
      </g>
    </g>
  </svg>`;
}

function mesa(color) {
  return `<div class="mesa"><div class="monitor"><i style="background:${color}"></i></div><div class="tablero"></div></div>`;
}

export function crearEdificio(contenedor, { deptos, onAbrir }) {
  const salas = [
    ...deptos.map((d) => ({ ...d, tipo: "depto" })),
    { id: "office", nombre: "Office", lema: "Café y descanso", color: "#7a8699", suelo: "#efe6da", empleados: [RAFA], tipo: "office" },
  ];

  contenedor.innerHTML = `
    <div class="cielo">
      <div class="nube n1"></div><div class="nube n2"></div><div class="nube n3"></div>
      <div class="edificio">
        <div class="tejado"><div class="antena"><i></i></div><div class="rotulo-edificio">ZENZIA</div></div>
        <div class="plantas">
          ${salas
            .map((s) => {
              const n = s.empleados.length;
              const mesas =
                s.tipo === "depto"
                  ? s.empleados.map((_, i) => `<div class="hueco-mesa" style="left:${((i + 1) / (n + 1)) * 100}%">${mesa(s.color)}</div>`).join("")
                  : `<div class="cafetera"><div class="vapor"></div></div><div class="sofa"></div><div class="maquina"></div>`;
              const etiqueta = s.tipo === "depto" ? "button" : "div";
              return `<${etiqueta} ${s.tipo === "depto" ? 'type="button"' : ""} class="habitacion" data-sala="${s.id}" style="--c:${s.color};--pared:${s.suelo}" ${
                s.tipo === "depto" ? `aria-label="Abrir ${ESC(s.nombre)}"` : ""
              }>
                <div class="fondo">${DECORADO[s.id] || ""}</div>
                <div class="lampara"><i></i></div>
                <div class="cartel"><span class="cartel-nombre">${ESC(s.nombre)}</span><span class="cartel-lema">${ESC(s.lema)}</span><span class="globo-aviso" hidden></span></div>
                <div class="planta-deco"></div>
                ${mesas}
                <div class="gente"></div>
                <div class="suelo-madera"></div>
                <div class="estado-sala"></div>
              </${etiqueta}>`;
            })
            .join("")}
        </div>
        <div class="bajos"><div class="puerta"></div></div>
      </div>
      <div class="acera"><div class="arbol"></div><div class="arbol a2"></div></div>
    </div>`;

  const personas = [];
  for (const s of salas) {
    const hab = contenedor.querySelector(`[data-sala="${s.id}"]`);
    if (s.tipo === "depto") hab.addEventListener("click", () => onAbrir(s.id));
    const gente = hab.querySelector(".gente");
    const n = s.empleados.length;
    s.empleados.forEach((e, i) => {
      const el = document.createElement("div");
      el.className = "persona";
      el.title = `${e.nombre} · ${e.rol}`;
      el.innerHTML = `<div class="bocadillo" hidden></div>${svgPersona(e)}<span class="nombre">${ESC(e.nombre)}</span>`;
      gente.appendChild(el);
      const mesaX = s.tipo === "depto" ? ((i + 1) / (n + 1)) * 100 : null;
      const x = mesaX ?? 40;
      personas.push({
        el,
        sala: s,
        i,
        x: x + (Math.random() * 16 - 8),
        objetivo: x,
        mesaX,
        espera: Math.random() * 2,
        sentado: false,
        sitio: null,
        mira: Math.random() < 0.5 ? 1 : -1,
        vel: 10 + Math.random() * 5,
      });
    });
  }

  let estados = {};
  let ultimo = performance.now();
  let raf = 0;
  const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function elegirPaseo(p) {
    const r = Math.random();
    p.el.classList.remove("gesto-cafe", "gesto-mirar");
    if (p.sala.tipo === "office") {
      if (r < 0.3) { p.objetivo = 74; p.sitio = "sofa"; }
      else if (r < 0.5) { p.objetivo = 14; p.sitio = "cafe"; }
      else { p.objetivo = 10 + Math.random() * 80; p.sitio = null; }
    } else if (r < 0.25 && p.mesaX != null) {
      p.objetivo = p.mesaX; p.sitio = "mesa";
    } else {
      p.objetivo = 6 + Math.random() * 88; p.sitio = null;
    }
  }

  function paso(ahora) {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    for (const p of personas) {
      const animo = estados[p.sala.id]?.animo || "libre";
      const trabaja = animo === "trabajando" && p.mesaX != null;
      const saluda = animo === "aviso" && p.i === 0;

      if (trabaja) {
        if (p.sitio !== "trabajo") { p.sitio = "trabajo"; p.sentado = false; p.objetivo = p.mesaX; }
      } else if (p.sitio === "trabajo") {
        p.sitio = null; p.sentado = false; p.espera = 0.5 + Math.random();
        p.objetivo = p.x;
      } else if (saluda && p.sitio !== "saludo") {
        p.sitio = "saludo"; p.sentado = false; p.objetivo = 50;
      } else if (!saluda && p.sitio === "saludo") {
        p.sitio = null; p.espera = 0;
      }

      const dx = p.objetivo - p.x;
      const anda = Math.abs(dx) > 0.6 && !p.sentado;
      if (anda) {
        const v = (trabaja ? p.vel * 1.7 : p.vel) * dt;
        p.x += Math.sign(dx) * Math.min(Math.abs(dx), v);
        p.mira = Math.sign(dx);
      } else if (p.sitio === "trabajo" || p.sitio === "mesa" || p.sitio === "sofa") {
        if (!p.sentado) { p.sentado = true; p.espera = 3 + Math.random() * 5; }
        if (p.sitio !== "trabajo") {
          p.espera -= dt;
          if (p.espera <= 0) { p.sentado = false; p.espera = 0.3; p.sitio = null; }
        }
      } else if (p.sitio !== "saludo") {
        if (p.espera > 0) {
          p.espera -= dt;
        } else {
          const r = Math.random();
          if (p.sitio === "cafe" || r < 0.25) p.el.classList.add("gesto-cafe");
          else if (r < 0.5) p.el.classList.add("gesto-mirar");
          p.espera = 2 + Math.random() * 4;
          p.sitio = "pausa";
        }
        if (p.sitio === "pausa" && p.espera <= 0.05) elegirPaseo(p);
      }

      p.el.style.left = p.x + "%";
      p.el.classList.toggle("andando", anda);
      p.el.classList.toggle("sentado", p.sentado);
      p.el.classList.toggle("en-sofa", p.sentado && p.sitio === "sofa");
      p.el.classList.toggle("tecleando", p.sentado && p.sitio === "trabajo");
      p.el.classList.toggle("saludando", p.sitio === "saludo" && !anda);
      p.el.classList.toggle("izq", p.mira < 0 && !p.sentado);
    }
    raf = requestAnimationFrame(paso);
  }

  if (quieto) {
    // Sin animación: cada uno en su sitio.
    for (const p of personas) { p.x = p.mesaX ?? 40; p.el.style.left = p.x + "%"; }
  } else {
    raf = requestAnimationFrame(paso);
  }

  return {
    actualizar(nuevos) {
      estados = nuevos;
      for (const s of salas) {
        if (s.tipo !== "depto") continue;
        const st = nuevos[s.id] || { animo: "libre" };
        const hab = contenedor.querySelector(`[data-sala="${s.id}"]`);
        hab.classList.toggle("animo-trabajando", st.animo === "trabajando");
        hab.classList.toggle("animo-aviso", st.animo === "aviso");
        const globo = hab.querySelector(".globo-aviso");
        globo.hidden = !st.avisos;
        globo.textContent = st.avisos || "";
        hab.querySelector(".estado-sala").textContent = st.estado || "";
        const boc = hab.querySelector(".persona .bocadillo");
        boc.hidden = !st.bocadillo;
        boc.textContent = st.bocadillo || "";
        if (quieto) {
          for (const p of personas) if (p.sala.id === s.id) p.el.classList.toggle("sentado", st.animo === "trabajando");
        }
      }
    },
    destruir() {
      cancelAnimationFrame(raf);
      contenedor.innerHTML = "";
    },
  };
}
