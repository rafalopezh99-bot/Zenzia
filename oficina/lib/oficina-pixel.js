// Oficina en pixel art vista desde arriba. Una planta con una zona por
// departamento, sala de reuniones, office y zona de sofás. Los empleados
// pasean, van a por café y se sientan a trabajar; tú eres el muñeco «TÚ» y te
// mueves tocando el suelo (o con las flechas). Sin dependencias: la usan la app
// de Next y la versión de una sola página.
//
//   const oficina = crearOficina(contenedor, { deptos, onAbrir })
//   oficina.actualizar({ [idDepto]: { animo, bocadillo, estado, avisos } })
//   oficina.destruir()
//
// animo: "libre" | "trabajando" | "aviso". Caben hasta 6 departamentos; con 5,
// el sexto hueco es la sala de reuniones.

const T = 16; // píxeles por baldosa
const W = 20; // baldosas de ancho
const H = 39; // baldosas de alto (rectángulo vertical, pensado para el móvil)
const PX_W = W * T;
const PX_H = H * T;

// Dos zonas por fila, tres filas; debajo, el office y los sofás.
const HUECOS = [
  { x: 1, y: 3, w: 8, h: 7 },
  { x: 11, y: 3, w: 8, h: 7 },
  { x: 1, y: 12, w: 8, h: 7 },
  { x: 11, y: 12, w: 8, h: 7 },
  { x: 1, y: 21, w: 8, h: 7 },
  { x: 11, y: 21, w: 8, h: 7 },
];

// Muebles de cada departamento, relativos a su zona: [tipo, x, y, ancho, alto].
const ATREZZO = {
  web: [["pantalla", 3, 6, 2, 1], ["puf", 0, 6, 1, 1], ["planta", 7, 6, 1, 1]],
  zenzia: [["pizarra", 2, 6, 3, 1], ["planta", 0, 6, 1, 1], ["planta", 7, 6, 1, 1]],
  legal: [["libreria", 0, 6, 3, 1], ["libreria", 4, 6, 3, 1], ["archivador", 7, 6, 1, 1]],
  ciber: [["rack", 6, 4, 1, 2], ["rack", 7, 4, 1, 2], ["planta", 0, 6, 1, 1]],
  marketing: [["mesa-ideas", 3, 4, 2, 2], ["corcho", 0, 6, 2, 1], ["planta", 7, 6, 1, 1]],
};

const TU = { nombre: "Tú", piel: "#f1c7a3", pelo: "#3b2a1e", camisa: "#2f6fd0" };
const PUERTA = { x: 9, y: 37 };
const CAFE = [{ x: 2, y: 31 }, { x: 5, y: 31 }, { x: 7, y: 32 }];
const SOFA = [{ x: 13, y: 31 }, { x: 15, y: 31 }];

const ESC = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const centro = (tx, ty) => ({ x: tx * T + 8, y: ty * T + 12 });
const azar = (a, b) => a + Math.random() * (b - a);
const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];

export function crearOficina(contenedor, { deptos, onAbrir }) {
  // ---------- Plano ----------
  const bloq = new Uint8Array(W * H);
  const libre = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !bloq[y * W + x];
  const bloquear = (x, y, w = 1, h = 1) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) bloq[j * W + i] = 1;
  };
  // Paredes: arriba 3 filas, laterales y la de abajo con la puerta.
  bloquear(0, 0, W, 3);
  bloquear(0, 0, 1, H);
  bloquear(W - 1, 0, 1, H);
  bloquear(0, H - 1, W, 1);

  const muebles = [];
  const mueble = (tipo, x, y, w = 1, h = 1, extra = {}) => {
    const m = { tipo, x, y, w, h, ...extra };
    muebles.push(m);
    if (!extra.pisable) bloquear(x, y, w, h);
    return m;
  };

  const zonas = deptos.slice(0, HUECOS.length).map((d, i) => ({ d, ...HUECOS[i] }));
  const mesas = {};
  for (const z of zonas) {
    const n = Math.min(z.d.empleados.length, 3);
    const offs = n === 1 ? [3] : n === 2 ? [1, 5] : [0, 3, 6];
    mesas[z.d.id] = offs.map((o) => {
      const dx = z.x + o;
      const dy = z.y + 1;
      const m = mueble("mesa", dx, dy, 2, 1, { depto: z.d.id, color: z.d.color, ocupada: false });
      mueble("silla", dx, dy + 1, 2, 1, { pisable: true, mesa: m });
      return { mesa: m, tile: { x: dx, y: dy + 1 }, punto: { x: (dx + 1) * T, y: (dy + 1) * T + 11 } };
    });
    for (const [tipo, ox, oy, w, h] of ATREZZO[z.d.id] || [["planta", 7, 6, 1, 1]]) {
      mueble(tipo, z.x + ox, z.y + oy, w, h, { color: z.d.color });
    }
  }

  // Sala de reuniones en el hueco que quede libre.
  const reunion = zonas.length < HUECOS.length ? HUECOS[HUECOS.length - 1] : null;
  const cristales = [];
  if (reunion) {
    const { x, y, w, h } = reunion;
    for (let i = x; i < x + w; i++) { cristales.push([i, y]); cristales.push([i, y + h - 1]); }
    for (let j = y + 1; j < y + h - 1; j++) {
      if (j !== y + 3) cristales.push([x, j]);
      cristales.push([x + w - 1, j]);
    }
    cristales.forEach(([i, j]) => bloquear(i, j));
    mueble("mesa-reunion", x + 2, y + 2, 4, 3);
    for (let i = x + 2; i < x + 6; i++) {
      mueble("silla-reunion", i, y + 1, 1, 1, { arriba: true });
      mueble("silla-reunion", i, y + 5, 1, 1, { arriba: false });
    }
  }

  // Office y zona de sofás.
  mueble("encimera", 1, 30, 4, 1);
  mueble("fuente", 5, 30);
  mueble("maquina", 7, 30, 1, 1);
  mueble("libreria", 1, 37, 3, 1);
  mueble("planta", 1, 34);
  mueble("planta", 18, 37);
  mueble("planta", 11, 37);
  mueble("sofa-h", 12, 31, 5, 1, { pisable: true });
  bloquear(12, 31, 1, 1);
  bloquear(14, 31, 1, 1);
  bloquear(16, 31, 1, 1);
  mueble("sofa-v", 18, 32, 1, 4);
  mueble("mesita", 14, 33, 2, 1);
  mueble("butaca", 12, 34);
  mueble("lampara", 18, 31);

  // ---------- Búsqueda de caminos (BFS sobre baldosas) ----------
  function camino(desde, hasta) {
    if (!libre(hasta.x, hasta.y)) return null;
    const ini = desde.y * W + desde.x;
    const fin = hasta.y * W + hasta.x;
    const prev = new Int32Array(W * H).fill(-1);
    prev[ini] = ini;
    const cola = [ini];
    for (let k = 0; k < cola.length; k++) {
      const c = cola[k];
      if (c === fin) break;
      const cx = c % W;
      const cy = (c / W) | 0;
      for (const [vx, vy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + vx;
        const ny = cy + vy;
        const ni = ny * W + nx;
        if (libre(nx, ny) && prev[ni] === -1) { prev[ni] = c; cola.push(ni); }
      }
    }
    if (prev[fin] === -1) return null;
    const pasos = [];
    for (let c = fin; c !== ini; c = prev[c]) pasos.push(centro(c % W, (c / W) | 0));
    return pasos.reverse();
  }
  const baldosa = (p) => ({ x: Math.max(0, Math.min(W - 1, Math.floor(p.px / T))), y: Math.max(0, Math.min(H - 1, Math.floor((p.py - 4) / T))) });
  function irA(p, tx, ty, final) {
    const desde = baldosa(p);
    const r = camino(libre(desde.x, desde.y) ? desde : vecinoLibre(desde), { x: tx, y: ty });
    if (!r) return false;
    if (final) r.push(final);
    p.ruta = r;
    p.sentado = false;
    return true;
  }
  function vecinoLibre(t) {
    for (const [vx, vy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1]]) if (libre(t.x + vx, t.y + vy)) return { x: t.x + vx, y: t.y + vy };
    return t;
  }

  // ---------- Gente ----------
  const gente = [];
  for (const z of zonas) {
    z.d.empleados.slice(0, 3).forEach((e, i) => {
      const asiento = mesas[z.d.id][i];
      gente.push({
        e, z, i, asiento,
        px: asiento.punto.x, py: asiento.punto.y,
        ruta: [], dir: "up", sentado: true, plan: "mesa",
        espera: azar(2, 14), vel: azar(36, 46), fase: Math.random() * 10,
      });
      asiento.mesa.ocupada = true;
    });
  }
  const yo = { e: TU, px: centro(PUERTA.x, PUERTA.y).x, py: centro(PUERTA.x, PUERTA.y).y, ruta: [], dir: "up", sentado: false, vel: 95, yo: true, fase: 0 };

  // ---------- DOM ----------
  contenedor.innerHTML = `
    <div class="ofi">
      <div class="ofi-barra"><span>▶ OFICINA ZENZIA</span><span class="ofi-online"><i></i><b>${gente.length + 1}</b> en línea</span></div>
      <div class="ofi-escena">
        <canvas class="ofi-lienzo" aria-label="Plano de la oficina. Toca el suelo para moverte o una zona para hablar con su departamento."></canvas>
        <div class="ofi-capa">
          <div class="ofi-rotulo" style="left:${(6 / W) * 100}%;top:${(0.45 / H) * 100}%;width:${(8 / W) * 100}%;height:${(1.7 / H) * 100}%">OFICINA ZENZIA</div>
          ${zonas
            .map(
              (z) => `<button type="button" class="ofi-zona" data-depto="${z.d.id}" style="left:${((z.x + 0.15) / W) * 100}%;top:${((z.y + 0.1) / H) * 100}%;--c:${z.d.color}">
                <span class="ofi-zona-nombre">${ESC(z.d.nombre)}</span><span class="ofi-aviso" hidden></span>
              </button><div class="ofi-estado" data-estado="${z.d.id}" style="left:${((z.x + 0.15) / W) * 100}%;top:${((z.y + 4.25) / H) * 100}%;max-width:${((z.w - 0.3) / W) * 100}%"></div>`,
            )
            .join("")}
          ${reunion ? `<div class="ofi-cartelito" style="left:${((reunion.x + 1.3) / W) * 100}%;top:${((reunion.y + 0.15) / H) * 100}%">Reuniones</div>` : ""}
          <div class="ofi-cartelito" style="left:${(3.2 / W) * 100}%;top:${(34.3 / H) * 100}%">Office</div>
          ${gente.map((_, i) => `<div class="ofi-bocadillo" data-boc="${i}" hidden></div>`).join("")}
          <div class="ofi-tu">TÚ</div>
        </div>
      </div>
      <p class="ofi-ayuda">Toca una zona para encargarle algo · toca el suelo para moverte</p>
    </div>`;

  const lienzo = contenedor.querySelector(".ofi-lienzo");
  const ctx = lienzo.getContext("2d");
  const fondo = document.createElement("canvas");
  const fctx = fondo.getContext("2d");
  const etiquetaTu = contenedor.querySelector(".ofi-tu");
  const bocadillos = [...contenedor.querySelectorAll(".ofi-bocadillo")];
  let escala = 1;

  contenedor.querySelectorAll(".ofi-zona").forEach((b) =>
    b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      acudir(b.dataset.depto);
      onAbrir(b.dataset.depto);
    }),
  );

  function acudir(id) {
    const z = zonas.find((x) => x.d.id === id);
    if (z) irA(yo, z.x + 3, z.y + 3);
  }

  lienzo.addEventListener("click", (ev) => {
    const r = lienzo.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * PX_W;
    const y = ((ev.clientY - r.top) / r.height) * PX_H;
    const tx = Math.floor(x / T);
    const ty = Math.floor(y / T);
    const z = zonas.find((q) => tx >= q.x && tx < q.x + q.w && ty >= q.y && ty < q.y + q.h);
    if (z) {
      acudir(z.d.id);
      onAbrir(z.d.id);
      return;
    }
    if (libre(tx, ty)) irA(yo, tx, ty);
    else {
      const v = vecinoLibre({ x: tx, y: ty });
      if (libre(v.x, v.y)) irA(yo, v.x, v.y);
    }
  });

  const teclas = new Set();
  const MAPA_TECLAS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
  function teclaAbajo(ev) {
    const el = document.activeElement;
    if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) return;
    if (document.querySelector(".velo")) return; // panel abierto
    const dir = MAPA_TECLAS[ev.key];
    if (dir) { teclas.add(dir); yo.ruta = []; ev.preventDefault(); }
    if (ev.key === "Enter") {
      const t = baldosa(yo);
      const z = zonas.find((q) => t.x >= q.x && t.x < q.x + q.w && t.y >= q.y && t.y < q.y + q.h);
      if (z) onAbrir(z.d.id);
    }
  }
  const teclaArriba = (ev) => { const d = MAPA_TECLAS[ev.key]; if (d) teclas.delete(d); };
  window.addEventListener("keydown", teclaAbajo);
  window.addEventListener("keyup", teclaArriba);

  // ---------- Dibujo: capa fija ----------
  function redimensionar() {
    const ancho = lienzo.getBoundingClientRect().width || PX_W;
    const nueva = Math.max(1, Math.ceil((ancho * (window.devicePixelRatio || 1)) / PX_W));
    if (nueva === escala && lienzo.width === PX_W * escala) return;
    escala = nueva;
    lienzo.width = fondo.width = PX_W * escala;
    lienzo.height = fondo.height = PX_H * escala;
    pintarFondo();
  }

  function r(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }

  function pintarFondo() {
    const c = fctx;
    c.setTransform(escala, 0, 0, escala, 0, 0);
    c.imageSmoothingEnabled = false;
    // Suelo de tarima
    r(c, 0, 0, PX_W, PX_H, "#c98a4b");
    for (let y = 3 * T; y < PX_H; y += 8) {
      r(c, 0, y, PX_W, 1, "#b47638");
      const off = ((y / 8) % 4) * 22;
      for (let x = -off; x < PX_W; x += 88) r(c, x, y, 1, 8, "#b47638");
    }
    // Zonas de departamento
    for (const z of zonas) {
      c.globalAlpha = 0.16;
      r(c, z.x * T, z.y * T, z.w * T, z.h * T, z.d.color);
      c.globalAlpha = 0.55;
      r(c, z.x * T, z.y * T, z.w * T, 2, z.d.color);
      r(c, z.x * T, (z.y + z.h) * T - 2, z.w * T, 2, z.d.color);
      r(c, z.x * T, z.y * T, 2, z.h * T, z.d.color);
      r(c, (z.x + z.w) * T - 2, z.y * T, 2, z.h * T, z.d.color);
      c.globalAlpha = 1;
    }
    // Sala de reuniones: baldosa gris azulada
    if (reunion) {
      for (let j = reunion.y; j < reunion.y + reunion.h; j++)
        for (let i = reunion.x; i < reunion.x + reunion.w; i++)
          r(c, i * T, j * T, T, T, (i + j) % 2 ? "#a9bccd" : "#b6c7d6");
    }
    // Office: baldosa de cocina
    for (let j = 30; j < 34; j++) for (let i = 1; i < 9; i++) r(c, i * T, j * T, T, T, (i + j) % 2 ? "#e9e3d7" : "#dcd3c3");
    // Alfombra de la zona de sofás
    r(c, 11 * T, 31 * T - 4, 8 * T, 6 * T + 4, "#c9b48a");
    r(c, 11 * T + 3, 31 * T - 1, 8 * T - 6, 6 * T - 2, "#efe3c8");
    r(c, 11 * T + 6, 31 * T + 2, 8 * T - 12, 1, "#d9c8a4");
    // Felpudo de la entrada
    r(c, PUERTA.x * T, PUERTA.y * T + 2, 2 * T, T - 2, "#2f9ce0");
    r(c, PUERTA.x * T + 3, PUERTA.y * T + 5, 2 * T - 6, T - 8, "#7cc4f0");

    // Pared de arriba con ventanas
    r(c, 0, 0, PX_W, 3 * T, "#efe6d8");
    r(c, 0, 0, PX_W, 5, "#2a313c");
    r(c, 0, 2 * T + 4, PX_W, 8, "#dccbb2");
    r(c, 0, 3 * T - 3, PX_W, 3, "#8e6641");
    for (const vx of [1.5, 15.5]) ventana(c, vx * T, 8, 3 * T - 4, 22);
    // Rótulo
    r(c, 6 * T, 6, 8 * T, 28, "#163e6e");
    r(c, 6 * T + 2, 8, 8 * T - 4, 24, "#1d4f8a");
    // Paredes laterales y de abajo
    r(c, 0, 0, T - 6, PX_H, "#2a313c");
    r(c, T - 6, 3 * T, 2, PX_H - 4 * T, "#59616e");
    r(c, PX_W - T + 6, 0, T - 6, PX_H, "#2a313c");
    r(c, PX_W - T + 4, 3 * T, 2, PX_H - 4 * T, "#59616e");
    r(c, 0, PX_H - T + 6, PX_W, T - 6, "#2a313c");
    // Puerta de entrada
    r(c, PUERTA.x * T, PX_H - T + 6, 2 * T, T - 6, "#8fc7ea");
    r(c, PUERTA.x * T + T - 1, PX_H - T + 6, 2, T - 6, "#3d4655");
    // Cristaleras de la sala de reuniones
    for (const [i, j] of cristales) {
      c.globalAlpha = 0.55;
      r(c, i * T, j * T, T, T, "#cfe9f8");
      c.globalAlpha = 1;
      r(c, i * T, j * T + 7, T, 2, "#7fa9c9");
      if (i % 2 === 0) r(c, i * T, j * T, 1, T, "#7fa9c9");
    }
  }

  function ventana(c, x, y, w, h) {
    r(c, x - 2, y - 2, w + 4, h + 4, "#8e6641");
    r(c, x, y, w, h, "#9fd3f5");
    r(c, x, y + h - 7, w, 7, "#c7e6f8");
    // edificios al fondo
    r(c, x + 4, y + h - 12, 6, 12, "#7d97b0");
    r(c, x + 12, y + h - 16, 7, 16, "#6b86a1");
    r(c, x + 22, y + h - 10, 8, 10, "#88a1b8");
    r(c, x + 33, y + h - 14, 6, 14, "#7d97b0");
    r(c, x + w / 2 - 1, y, 2, h, "#ffffff");
    r(c, x, y + h / 2 - 1, w, 2, "#ffffff");
  }

  // ---------- Dibujo: muebles ----------
  function dibujarMueble(c, m, t) {
    const x = m.x * T;
    const y = m.y * T;
    switch (m.tipo) {
      case "mesa": {
        const est = estados[m.depto]?.animo;
        const sentado = gente.some((p) => p.asiento?.mesa === m && p.sentado);
        r(c, x, y + 2, 32, 11, "#b98552");
        r(c, x, y + 11, 32, 3, "#8e6237");
        r(c, x + 1, y + 14, 2, 2, "#6e4a2c");
        r(c, x + 29, y + 14, 2, 2, "#6e4a2c");
        // monitor
        r(c, x + 9, y - 5, 14, 10, "#2a2f3a");
        let pantalla = "#1b2230";
        if (est === "trabajando" && sentado) pantalla = Math.floor(t * 6) % 2 ? m.color : "#ffffff";
        else if (sentado) pantalla = "#4f7fae";
        r(c, x + 10, y - 4, 12, 7, pantalla);
        if (sentado) { r(c, x + 11, y - 3, 6, 1, "#cfe6ff"); r(c, x + 11, y - 1, 9, 1, "#cfe6ff"); r(c, x + 11, y + 1, 4, 1, "#cfe6ff"); }
        r(c, x + 14, y + 5, 4, 2, "#2a2f3a");
        r(c, x + 11, y + 8, 10, 3, "#d9dde3");
        r(c, x + 26, y + 4, 3, 4, "#ffffff");
        r(c, x + 3, y + 5, 4, 3, "#b5643a");
        r(c, x + 2, y + 2, 6, 3, "#4caf50");
        break;
      }
      case "silla-asiento": {
        const px = m.px;
        const py = m.py;
        r(c, px - 5, py - 9, 10, 6, "#4a505c");
        break;
      }
      case "silla-respaldo": {
        r(c, m.px - 6, m.py - 4, 12, 4, "#323743");
        r(c, m.px - 1, m.py, 2, 2, "#323743");
        break;
      }
      case "planta":
        r(c, x + 4, y + 9, 8, 6, "#b5643a");
        r(c, x + 5, y + 8, 6, 2, "#8e4a2a");
        r(c, x + 1, y - 2, 14, 10, "#3d9b42");
        r(c, x + 3, y - 5, 4, 5, "#4caf50");
        r(c, x + 9, y - 6, 4, 6, "#4caf50");
        r(c, x + 6, y - 1, 3, 4, "#6cc35f");
        break;
      case "puf":
        r(c, x + 1, y + 3, 14, 11, "#d9573b");
        r(c, x + 3, y + 4, 9, 4, "#e8885f");
        break;
      case "pantalla":
        r(c, x + 1, y - 6, 30, 18, "#2a2f3a");
        r(c, x + 3, y - 4, 26, 13, "#11161f");
        r(c, x + 5, y - 2, 12, 1, "#7cc4f0");
        r(c, x + 5, y + 1, 18, 1, "#f4c430");
        r(c, x + 5, y + 4, 8 + (Math.floor(t * 2) % 3) * 4, 1, "#3ec95c");
        r(c, x + 14, y + 12, 4, 3, "#2a2f3a");
        break;
      case "pizarra": {
        r(c, x + 1, y - 7, m.w * T - 2, 18, "#c9ced6");
        r(c, x + 3, y - 5, m.w * T - 6, 14, "#ffffff");
        const alturas = [5, 8, 6, 11, 9];
        alturas.forEach((a, i) => r(c, x + 8 + i * 7, y + 8 - a, 4, a, i === 3 ? "#163e6e" : "#2f9ce0"));
        r(c, x + 4, y + 11, 2, 4, "#8e969f");
        r(c, x + m.w * T - 6, y + 11, 2, 4, "#8e969f");
        break;
      }
      case "libreria": {
        r(c, x, y - 8, m.w * T, 22, "#6e4a2c");
        const libros = ["#8a5a2b", "#c9a26b", "#b8432a", "#2f6fb0", "#e0d2b8", "#3d9b42", "#5c3d1e"];
        for (let fila = 0; fila < 2; fila++)
          for (let i = 0; i < m.w * 5; i++) r(c, x + 2 + i * 3 + (i % 3 === 0 ? 0 : 0), y - 6 + fila * 10, 2, 7, libros[(i + fila * 3) % libros.length]);
        break;
      }
      case "archivador":
        r(c, x + 2, y - 6, 12, 20, "#7c8592");
        r(c, x + 3, y - 4, 10, 5, "#9aa3ae");
        r(c, x + 3, y + 3, 10, 5, "#9aa3ae");
        r(c, x + 7, y - 2, 2, 1, "#3d4655");
        r(c, x + 7, y + 5, 2, 1, "#3d4655");
        break;
      case "rack":
        r(c, x + 1, y - 8, 14, m.h * T + 6, "#1d2533");
        for (let i = 0; i < 6; i++) {
          r(c, x + 3, y - 5 + i * 6, 10, 4, "#2e3644");
          const on = Math.floor(t * (2 + i * 0.7) + m.x) % 2;
          r(c, x + 10, y - 4 + i * 6, 2, 2, on ? (i % 2 ? "#f4c430" : "#3ec95c") : "#2e3644");
        }
        break;
      case "mesa-ideas":
        r(c, x + 3, y + 2, 26, 26, "#b98552");
        r(c, x + 1, y + 6, 30, 18, "#b98552");
        r(c, x + 3, y + 25, 26, 3, "#8e6237");
        r(c, x + 7, y + 7, 6, 6, "#fff27a");
        r(c, x + 17, y + 9, 6, 6, "#ffb3c7");
        r(c, x + 11, y + 16, 6, 6, "#a6e3ff");
        break;
      case "corcho":
        r(c, x + 1, y - 7, m.w * T - 2, 18, "#8a5a2b");
        r(c, x + 3, y - 5, m.w * T - 6, 14, "#c99a63");
        r(c, x + 6, y - 3, 5, 5, "#fff27a");
        r(c, x + 14, y - 2, 5, 5, "#ffb3c7");
        r(c, x + 22, y - 4, 5, 5, "#a6e3ff");
        r(c, x + 10, y + 3, 5, 4, "#b8f0b0");
        break;
      case "mesa-reunion":
        r(c, x + 2, y + 2, m.w * T - 4, m.h * T - 6, "#a8693a");
        r(c, x + 2, y + m.h * T - 6, m.w * T - 4, 3, "#7d4d2a");
        r(c, x + 6, y + 6, m.w * T - 12, 1, "#bd7c47");
        r(c, x + m.w * T / 2 - 3, y + m.h * T / 2 - 6, 6, 6, "#4caf50");
        break;
      case "silla-reunion":
        r(c, x + 3, y + (m.arriba ? 2 : 6), 10, 8, "#3a3f4b");
        r(c, x + 3, y + (m.arriba ? 2 : 12), 10, 2, "#262a33");
        break;
      case "encimera":
        r(c, x, y - 6, m.w * T, 20, "#d9dde3");
        r(c, x, y + 11, m.w * T, 3, "#9aa3ae");
        r(c, x + 6, y - 12, 12, 14, "#3b3f47");
        r(c, x + 9, y - 2, 6, 3, "#ffffff");
        r(c, x + 40, y - 4, 14, 8, "#8e969f");
        r(c, x + 42, y - 2, 10, 4, "#c7e6f8");
        break;
      case "fuente":
        r(c, x + 3, y - 2, 10, 16, "#e9edf3");
        r(c, x + 4, y - 12, 8, 10, "#5bb3ea");
        r(c, x + 5, y - 11, 2, 7, "#a6dbfa");
        r(c, x + 6, y + 6, 4, 2, "#3d4655");
        break;
      case "maquina":
        r(c, x + 1, y - 14, 14, 28, "#d9573b");
        r(c, x + 3, y - 12, 8, 16, "#e3f3fd");
        r(c, x + 4, y - 10, 2, 2, "#f4c430");
        r(c, x + 7, y - 6, 2, 2, "#3ec95c");
        r(c, x + 12, y - 8, 2, 6, "#b8432a");
        break;
      case "sofa-h":
        r(c, x, y - 4, m.w * T, 8, "#2f6fb0");
        r(c, x, y + 2, m.w * T, 10, "#3f86cc");
        r(c, x, y - 4, 5, 16, "#2f6fb0");
        r(c, x + m.w * T - 5, y - 4, 5, 16, "#2f6fb0");
        for (let i = 1; i < m.w; i++) r(c, x + i * T, y + 3, 1, 8, "#2f6fb0");
        break;
      case "sofa-v":
        r(c, x + 8, y, 8, m.h * T, "#2f6fb0");
        r(c, x + 1, y, 10, m.h * T, "#3f86cc");
        r(c, x + 1, y, 15, 4, "#2f6fb0");
        r(c, x + 1, y + m.h * T - 4, 15, 4, "#2f6fb0");
        break;
      case "mesita":
        r(c, x + 2, y + 2, 28, 11, "#a8693a");
        r(c, x + 2, y + 11, 28, 2, "#7d4d2a");
        r(c, x + 12, y + 3, 6, 4, "#4caf50");
        break;
      case "butaca":
        r(c, x + 1, y, 14, 14, "#2f6fb0");
        r(c, x + 3, y + 3, 10, 9, "#3f86cc");
        break;
      case "lampara":
        r(c, x + 7, y - 2, 2, 15, "#3d4655");
        r(c, x + 4, y + 12, 8, 2, "#3d4655");
        r(c, x + 3, y - 9, 10, 8, "#fff3c4");
        r(c, x + 3, y - 2, 10, 1, "#e0cf8f");
        break;
      default:
        break;
    }
  }

  // ---------- Dibujo: personas ----------
  function dibujarPersona(c, p, t) {
    const x = Math.round(p.px);
    const y = Math.round(p.py);
    const e = p.e;
    const piel = e.piel;
    const animo = p.yo ? "libre" : estados[p.z.d.id]?.animo || "libre";
    const tecleando = p.sentado && animo === "trabajando" && p.plan === "trabajo";
    const paso = p.ruta.length || p.tecla ? Math.floor((t + p.fase) * 8) % 2 : 0;
    const dy = p.sentado ? -4 : 0;
    const bote = tecleando ? Math.floor(t * 10 + p.fase) % 2 : 0;

    if (!p.sentado) {
      c.globalAlpha = 0.2;
      r(c, x - 5, y - 1, 10, 3, "#000000");
      c.globalAlpha = 1;
      // piernas
      if (p.dir === "left" || p.dir === "right") {
        r(c, x - 3 + (paso ? 2 : 0), y - 6, 3, 5, "#2f3542");
        r(c, x - 1 - (paso ? 2 : 0), y - 6, 3, 5, "#262b35");
        r(c, x - 3 + (paso ? 2 : 0), y - 2, 4, 2, "#151820");
        r(c, x - 1 - (paso ? 2 : 0), y - 2, 4, 2, "#151820");
      } else {
        r(c, x - 4, y - 6 - (paso ? 1 : 0), 3, 5, "#2f3542");
        r(c, x + 1, y - 6 - (paso ? 0 : 1) * (p.ruta.length || p.tecla ? 1 : 0), 3, 5, "#2f3542");
        r(c, x - 4, y - 2 - (paso ? 1 : 0), 3, 2, "#151820");
        r(c, x + 1, y - 2, 3, 2, "#151820");
      }
    }
    // cuerpo y brazos
    const cy = y - 13 + dy;
    const lateral = p.dir === "left" || p.dir === "right";
    r(c, x - (lateral ? 4 : 5), cy, lateral ? 8 : 10, 8, e.camisa);
    if (!lateral) {
      const brazo = tecleando ? -2 - bote : 0;
      r(c, x - 7, cy + 1 + brazo, 2, 6, e.camisa);
      r(c, x + 5, cy + 1 + (tecleando ? -2 - (1 - bote) : 0), 2, 6, e.camisa);
      r(c, x - 7, cy + 7 + brazo, 2, 2, piel);
      r(c, x + 5, cy + 7 + (tecleando ? -2 - (1 - bote) : 0), 2, 2, piel);
    } else {
      const s = p.dir === "left" ? -1 : 1;
      r(c, x - 1 + (paso ? s * 2 : 0), cy + 1, 2, 6, e.camisa);
      r(c, x - 1 + (paso ? s * 2 : 0), cy + 7, 2, 2, piel);
    }
    // cabeza
    const hy = y - 22 + dy + (tecleando ? bote : 0);
    r(c, x - 5, hy, 10, 9, piel);
    if (p.dir === "up") {
      r(c, x - 5, hy - 1, 10, 9, e.pelo);
      r(c, x - 4, hy + 8, 8, 1, piel);
    } else if (lateral) {
      r(c, x - 5, hy - 1, 10, 4, e.pelo);
      const s = p.dir === "left" ? 1 : -1;
      r(c, s > 0 ? x + 1 : x - 5, hy + 2, 4, 5, e.pelo);
      r(c, p.dir === "left" ? x - 3 : x + 2, hy + 4, 1, 2, "#1b1b1b");
    } else {
      r(c, x - 5, hy - 1, 10, 4, e.pelo);
      r(c, x - 5, hy + 3, 1, 3, e.pelo);
      r(c, x + 4, hy + 3, 1, 3, e.pelo);
      const parpadeo = Math.floor((t + p.fase) * 10) % 45 === 0;
      r(c, x - 3, hy + 4, 1, parpadeo ? 1 : 2, "#1b1b1b");
      r(c, x + 2, hy + 4, 1, parpadeo ? 1 : 2, "#1b1b1b");
      c.globalAlpha = 0.35;
      r(c, x - 4, hy + 6, 2, 1, "#ff6b5b");
      r(c, x + 2, hy + 6, 2, 1, "#ff6b5b");
      c.globalAlpha = 1;
    }
    // Rombo de los Sims
    if (!p.yo) {
      const col = animo === "trabajando" ? "#f4c430" : animo === "aviso" && p.i === 0 ? "#3b8bea" : "#3ec95c";
      const by = hy - 9 + Math.round(Math.sin((t + p.fase) * 3) * 1.5);
      r(c, x, by, 1, 1, col);
      r(c, x - 1, by + 1, 3, 1, col);
      r(c, x - 2, by + 2, 5, 1, col);
      r(c, x - 1, by + 3, 3, 1, col);
      r(c, x, by + 4, 1, 1, col);
      r(c, x, by + 1, 1, 1, "#ffffff");
    }
  }

  // ---------- Comportamiento ----------
  let estados = {};

  function cercaDeTi() {
    const t = baldosa(yo);
    for (const [vx, vy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]]) if (libre(t.x + vx, t.y + vy)) return { x: t.x + vx, y: t.y + vy };
    return null;
  }

  function sentarse(p) {
    irA(p, p.asiento.tile.x, p.asiento.tile.y, p.asiento.punto);
  }

  function pensar(p, dt) {
    const animo = estados[p.z.d.id]?.animo || "libre";
    if (animo === "trabajando") {
      const enSuMesa = p.sentado && Math.abs(p.px - p.asiento.punto.x) < 1 && Math.abs(p.py - p.asiento.punto.y) < 1;
      if (p.plan !== "trabajo") { p.plan = "trabajo"; if (!enSuMesa) sentarse(p); }
      if (!enSuMesa && !p.ruta.length) sentarse(p);
      return;
    }
    if (animo === "aviso" && p.i === 0) {
      p.recalcular = (p.recalcular || 0) - dt;
      if (p.plan !== "aviso" || (p.recalcular <= 0 && !p.ruta.length)) {
        const t = baldosa(yo);
        const mio = baldosa(p);
        if (p.plan !== "aviso" || Math.abs(t.x - mio.x) + Math.abs(t.y - mio.y) > 2) {
          const dest = cercaDeTi();
          if (dest) irA(p, dest.x, dest.y);
        }
        p.plan = "aviso";
        p.recalcular = 1;
      }
      if (!p.ruta.length) {
        const dx = yo.px - p.px;
        const dy2 = yo.py - p.py;
        p.dir = Math.abs(dx) > Math.abs(dy2) ? (dx < 0 ? "left" : "right") : dy2 < 0 ? "up" : "down";
      }
      return;
    }
    if (p.plan === "trabajo" || p.plan === "aviso") { p.plan = "mesa"; p.espera = azar(1, 4); if (!p.sentado) sentarse(p); }
    if (p.ruta.length) return;
    p.espera -= dt;
    if (p.espera > 0) return;
    if (p.plan === "mesa") {
      // Levantarse a dar una vuelta
      const r2 = Math.random();
      let dest;
      if (r2 < 0.35) { dest = elegir(CAFE); p.plan = "cafe"; }
      else if (r2 < 0.55) { dest = elegir(SOFA); p.plan = "sofa"; }
      else {
        p.plan = "paseo";
        for (let k = 0; k < 10 && !dest; k++) {
          const tx = p.z.x + Math.floor(Math.random() * p.z.w);
          const ty = p.z.y + 3 + Math.floor(Math.random() * 3);
          if (libre(tx, ty)) dest = { x: tx, y: ty };
        }
      }
      if (dest && irA(p, dest.x, dest.y, p.plan === "sofa" ? { x: dest.x * T + 8, y: dest.y * T + 10 } : null)) {
        p.espera = p.plan === "paseo" ? azar(2, 5) : azar(4, 9);
        p.asiento.mesa.ocupada = false;
      } else {
        p.espera = azar(3, 8);
        p.plan = "mesa";
      }
    } else {
      // Volver a su mesa
      p.plan = "mesa";
      sentarse(p);
      p.espera = azar(8, 22);
    }
  }

  function mover(p, dt) {
    if (p.yo && teclas.size && !p.ruta.length) {
      const dir = [...teclas].pop();
      const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
      const nx = p.px + v[0] * p.vel * dt;
      const ny = p.py + v[1] * p.vel * dt;
      const tx = Math.floor((nx + v[0] * 4) / T);
      const ty = Math.floor((ny - 4 + v[1] * 4) / T);
      if (libre(tx, ty)) { p.px = nx; p.py = ny; }
      p.dir = dir;
      p.tecla = true;
      return;
    }
    p.tecla = false;
    if (!p.ruta.length) return;
    const o = p.ruta[0];
    const dx = o.x - p.px;
    const dy = o.y - p.py;
    const d = Math.hypot(dx, dy);
    const v = (p.plan === "trabajo" ? p.vel * 1.6 : p.vel) * dt;
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx < 0 ? "left" : "right";
    else if (Math.abs(dy) > 0.1) p.dir = dy < 0 ? "up" : "down";
    if (d <= v) {
      p.px = o.x;
      p.py = o.y;
      p.ruta.shift();
      if (!p.ruta.length && !p.yo) {
        if (p.plan === "mesa" || p.plan === "trabajo") {
          if (Math.abs(p.px - p.asiento.punto.x) < 1 && Math.abs(p.py - p.asiento.punto.y) < 1) {
            p.sentado = true; p.dir = "up"; p.asiento.mesa.ocupada = true;
          }
        } else if (p.plan === "sofa") { p.sentado = true; p.dir = "down"; }
        else if (p.plan === "cafe") p.dir = "up";
      }
    } else {
      p.px += (dx / d) * v;
      p.py += (dy / d) * v;
    }
  }

  // ---------- Bucle ----------
  let ultimo = performance.now();
  let raf = 0;
  const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const sillas = [];
  for (const id in mesas) for (const a of mesas[id]) {
    sillas.push({ tipo: "silla-asiento", px: a.punto.x, py: a.punto.y, orden: a.punto.y - 0.5 });
    sillas.push({ tipo: "silla-respaldo", px: a.punto.x, py: a.punto.y, orden: a.punto.y + 0.5 });
  }

  function cuadro(ahora) {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    const t = ahora / 1000;
    if (!quieto) {
      for (const p of gente) { pensar(p, dt); mover(p, dt); }
      mover(yo, dt);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(fondo, 0, 0);
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const cosas = [];
    for (const m of muebles) if (m.tipo !== "silla") cosas.push({ orden: (m.y + m.h) * T - (m.tipo === "sofa-h" ? 14 : 2), m });
    for (const s of sillas) cosas.push({ orden: s.orden, s });
    for (const p of gente) cosas.push({ orden: p.py, p });
    cosas.push({ orden: yo.py, p: yo });
    cosas.sort((a, b) => a.orden - b.orden);
    for (const k of cosas) {
      if (k.m) dibujarMueble(ctx, k.m, t);
      else if (k.s) dibujarMueble(ctx, k.s, t);
      else dibujarPersona(ctx, k.p, t);
    }

    // Etiquetas que siguen a la gente
    etiquetaTu.style.left = (yo.px / PX_W) * 100 + "%";
    etiquetaTu.style.top = ((yo.py - 31) / PX_H) * 100 + "%";
    gente.forEach((p, i) => {
      const b = bocadillos[i];
      if (b.hidden) return;
      b.style.left = Math.min(84, Math.max(16, (p.px / PX_W) * 100)) + "%";
      b.style.top = ((p.py - (p.sentado ? 36 : 32)) / PX_H) * 100 + "%";
    });
    raf = requestAnimationFrame(cuadro);
  }

  const observador = typeof ResizeObserver !== "undefined" ? new ResizeObserver(redimensionar) : null;
  observador?.observe(lienzo);
  window.addEventListener("resize", redimensionar);
  redimensionar();
  raf = requestAnimationFrame(cuadro);

  return {
    actualizar(nuevos) {
      estados = nuevos;
      for (const z of zonas) {
        const st = nuevos[z.d.id] || { animo: "libre" };
        const boton = contenedor.querySelector(`.ofi-zona[data-depto="${z.d.id}"]`);
        boton.classList.toggle("trabajando", st.animo === "trabajando");
        const aviso = boton.querySelector(".ofi-aviso");
        aviso.hidden = !st.avisos;
        aviso.textContent = st.avisos || "";
        const est = contenedor.querySelector(`[data-estado="${z.d.id}"]`);
        est.textContent = st.animo === "libre" ? "" : st.estado || "";
        est.className = "ofi-estado" + (st.animo === "trabajando" ? " trabajando" : st.animo === "aviso" ? " aviso" : "");
      }
      gente.forEach((p, i) => {
        const st = nuevos[p.z.d.id] || {};
        const b = bocadillos[i];
        let texto = "";
        if (p.i === 0 && st.animo === "trabajando") texto = st.bocadillo || "Trabajando…";
        if (p.i === 0 && st.animo === "aviso") texto = "¡Ya lo tengo!";
        b.hidden = !texto;
        b.textContent = texto;
      });
    },
    destruir() {
      cancelAnimationFrame(raf);
      observador?.disconnect();
      window.removeEventListener("resize", redimensionar);
      window.removeEventListener("keydown", teclaAbajo);
      window.removeEventListener("keyup", teclaArriba);
      contenedor.innerHTML = "";
    },
  };
}
