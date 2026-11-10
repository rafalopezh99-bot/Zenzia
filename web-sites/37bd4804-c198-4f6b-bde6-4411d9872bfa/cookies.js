/* Aviso de cookies de La Placita (primera capa + configuración).
 *
 * Dos finalidades, ambas opcionales y desactivadas hasta que se acepten:
 *   - Estadísticas (propia): visitas y clics en los enlaces de contacto, para
 *     el panel de la academia en Zenzia. Identificador aleatorio en el
 *     navegador (lp_vid). Se envían a Zenzia (data-stats), nunca a una base de
 *     datos directamente.
 *   - Mapas (terceros): Google Maps, solo si se acepta o se pulsa «Ver mapa».
 * La elección se guarda en lp_cookie_consent (técnica, exenta de consentimiento).
 * Cualquier enlace con data-cookie-settings vuelve a abrir la configuración.
 *
 * Atributos del <script>: data-company (id de la empresa en Zenzia) y
 * data-stats (URL del endpoint de estadísticas de Zenzia).
 */
(function () {
  var me = document.currentScript;
  var COMPANY = me && me.getAttribute('data-company');
  var STATS_URL = me && me.getAttribute('data-stats');
  var KEY = 'lp_cookie_consent';
  var VID = 'lp_vid';
  // Versión 2: se añadió la finalidad «Estadísticas» (vuelve a preguntar a todos).
  var VERSION = 2;

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.v === VERSION ? v : null;
    } catch (e) { return null; }
  }
  function save(c) {
    var prev = read();
    var v = { v: VERSION, maps: !!c.maps, stats: !!c.stats, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    if (!v.stats) { try { localStorage.removeItem(VID); } catch (e) {} }
    apply(v, prev);
    return v;
  }

  // ---------- Mapas ----------
  function loadMaps() {
    document.querySelectorAll('.map-consent').forEach(function (box) {
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-map-src');
      f.title = 'Ubicación La Placita Language School';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.loading = 'lazy';
      box.replaceWith(f);
    });
  }

  // ---------- Estadísticas (solo con consentimiento) ----------
  var statsOn = false;
  var device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'movil' : 'ordenador';
  function vid() {
    var id = '';
    try {
      id = localStorage.getItem(VID) || '';
      if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(VID, id); }
    } catch (e) {}
    return id;
  }
  function send(type, extra) {
    if (!statsOn || !COMPANY || !STATS_URL) return;
    var body = { site: COMPANY, type: type, path: location.pathname.slice(0, 250), device: device, vid: vid() };
    for (var k in extra) body[k] = extra[k];
    var data = JSON.stringify(body);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(STATS_URL, new Blob([data], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(STATS_URL, { method: 'POST', body: data, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } }); } catch (e) {}
  }
  var NAMES = [[/wa\.me|whatsapp/i, 'WhatsApp'], [/^mailto:/i, 'Email'], [/^tel:/i, 'Teléfono'], [/instagram\.com/i, 'Instagram'],
    [/tiktok\.com/i, 'TikTok'], [/facebook\.com/i, 'Facebook'], [/google\.[a-z.]+\/maps|maps\.app|goo\.gl\/maps/i, 'Cómo llegar']];
  document.addEventListener('click', function (e) {
    if (!statsOn) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#' || a.hasAttribute('data-cookie-settings')) return;
    var label = '';
    for (var i = 0; i < NAMES.length; i++) if (NAMES[i][0].test(a.href)) { label = NAMES[i][1]; break; }
    if (!label) label = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) || a.href.slice(0, 80);
    send('click', { label: label, href: a.href.slice(0, 450) });
  }, true);

  function apply(v, prev) {
    if (v.maps) loadMaps();
    var wasOn = statsOn;
    statsOn = !!v.stats;
    // Al activar las estadísticas se cuenta la visita actual (una sola vez).
    if (statsOn && !wasOn) send('view', { referrer: (document.referrer || '').slice(0, 400) });
  }

  // ---------- Interfaz ----------
  var css =
    '.ck-bar{position:fixed;left:16px;right:16px;bottom:16px;z-index:400;max-width:780px;margin:0 auto;' +
    'background:#152C4E;color:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(21,44,78,.35);' +
    'padding:18px 20px;font:400 .9rem/1.5 "Nunito Sans",sans-serif;display:flex;flex-wrap:wrap;gap:14px;align-items:center}' +
    '.ck-bar p{margin:0;flex:1 1 300px;color:rgba(255,255,255,.88)}' +
    '.ck-bar a{color:#fff;text-decoration:underline}' +
    '.ck-actions{display:flex;flex-wrap:wrap;gap:8px}' +
    '.ck-btn{font:700 .85rem "Nunito Sans",sans-serif;border-radius:999px;padding:10px 18px;cursor:pointer;border:2px solid #fff;background:#fff;color:#152C4E}' +
    '.ck-btn.ck-ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.55)}' +
    '.ck-btn:focus-visible{outline:3px solid #C79A45;outline-offset:2px}' +
    '.ck-modal{position:fixed;inset:0;z-index:410;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,31,56,.55)}' +
    '.ck-panel{background:#FBF6EE;color:#241F1B;border-radius:16px;max-width:540px;width:100%;max-height:calc(100vh - 32px);overflow:auto;padding:24px;font:400 .92rem/1.55 "Nunito Sans",sans-serif;box-shadow:0 20px 50px rgba(21,44,78,.3)}' +
    '.ck-panel h2{font:600 1.3rem "Fraunces",serif;margin:0 0 6px}' +
    '.ck-panel p{margin:0 0 14px;color:#5B534C}' +
    '.ck-panel a{color:#8B1A17}' +
    '.ck-row{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px}' +
    '.ck-row strong{display:block;color:#241F1B}' +
    '.ck-row span{font-size:.85rem;color:#5B534C}' +
    '.ck-row input{width:22px;height:22px;flex:none;accent-color:#8B1A17;margin-top:2px}' +
    '.ck-panel .ck-actions{justify-content:flex-end;margin-top:16px}' +
    '.ck-panel .ck-btn{border-color:#152C4E;background:#152C4E;color:#fff}' +
    '.ck-panel .ck-btn.ck-ghost{background:transparent;color:#152C4E}' +
    '@media (max-width:600px){.ck-bar{left:10px;right:10px;bottom:10px;padding:16px}.ck-actions{width:100%}.ck-actions .ck-btn{flex:1 1 auto}}';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }

  var bar = null;
  function closeBar() { if (bar) { bar.remove(); bar = null; } }

  function showBar() {
    if (bar) return;
    bar = el('<div class="ck-bar" role="region" aria-label="Aviso de cookies">' +
      '<p>Usamos cookies propias de estadística para saber cuántas personas visitan la web y qué enlaces de contacto usan, y cookies de terceros para mostrar el mapa de Google Maps. Puedes aceptarlas, rechazarlas o configurarlas. Más información <a href="cookies.html">aquí</a>.</p>' +
      '<div class="ck-actions">' +
      '<button type="button" class="ck-btn" data-ck="accept">Aceptar cookies</button>' +
      '<button type="button" class="ck-btn" data-ck="reject">Rechazar cookies</button>' +
      '<button type="button" class="ck-btn ck-ghost" data-ck="settings">Configuración</button>' +
      '</div></div>');
    bar.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-ck');
      if (a === 'accept') { save({ maps: true, stats: true }); closeBar(); }
      else if (a === 'reject') { save({ maps: false, stats: false }); closeBar(); }
      else if (a === 'settings') { showSettings(); }
    });
    document.body.appendChild(bar);
  }

  function showSettings() {
    var cur = read() || {};
    var m = el('<div class="ck-modal" role="dialog" aria-modal="true" aria-labelledby="ck-title"><div class="ck-panel">' +
      '<h2 id="ck-title">Configuración de cookies</h2>' +
      '<p>Elige qué permites. Puedes cambiarlo cuando quieras desde «Configurar cookies», al pie de la página. Más detalles en la <a href="cookies.html">política de cookies</a>.</p>' +
      '<div class="ck-row"><div><strong>Técnicas (siempre activas)</strong><span>Solo guardan en tu navegador la elección que hagas aquí.</span></div><input type="checkbox" checked disabled aria-label="Técnicas, siempre activas"></div>' +
      '<div class="ck-row"><div><strong>Estadísticas (propias)</strong><span>Cuentan las visitas y los clics en los botones de contacto (WhatsApp, teléfono, redes) con un identificador aleatorio, para saber cómo se usa la web.</span></div><input type="checkbox" id="ck-stats"' + (cur.stats ? ' checked' : '') + ' aria-label="Estadísticas"></div>' +
      '<div class="ck-row"><div><strong>Mapas · Google Maps (terceros)</strong><span>Muestra el mapa de la academia. Google puede instalar sus propias cookies.</span></div><input type="checkbox" id="ck-maps"' + (cur.maps ? ' checked' : '') + ' aria-label="Mapas de Google Maps"></div>' +
      '<div class="ck-actions">' +
      '<button type="button" class="ck-btn ck-ghost" data-ck="reject">Rechazar todas</button>' +
      '<button type="button" class="ck-btn ck-ghost" data-ck="save">Guardar selección</button>' +
      '<button type="button" class="ck-btn" data-ck="accept">Aceptar todas</button>' +
      '</div></div></div>');
    function done(c) {
      var hadMaps = !!(read() || {}).maps;
      save(c);
      m.remove();
      closeBar();
      // Si se retira el permiso del mapa con el mapa ya cargado, se recarga para quitarlo.
      if (hadMaps && !c.maps && document.querySelector('.location-map iframe')) location.reload();
    }
    m.addEventListener('click', function (e) {
      if (e.target === m) { m.remove(); return; }
      var a = e.target.getAttribute && e.target.getAttribute('data-ck');
      if (a === 'accept') done({ maps: true, stats: true });
      else if (a === 'reject') done({ maps: false, stats: false });
      else if (a === 'save') done({ maps: m.querySelector('#ck-maps').checked, stats: m.querySelector('#ck-stats').checked });
    });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { m.remove(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(m);
    m.querySelector('[data-ck="accept"]').focus();
  }

  function init() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    // «Ver mapa»: carga el mapa solo esta vez (acción expresa del visitante).
    document.querySelectorAll('.map-consent-btn').forEach(function (b) {
      b.addEventListener('click', loadMaps);
    });
    document.querySelectorAll('[data-cookie-settings]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); showSettings(); });
    });

    // Elecciones de la versión anterior (solo mapas): se borran y se vuelve a preguntar.
    try { localStorage.removeItem('zz_vid'); } catch (e) {}
    var v = read();
    if (v) apply(v, null); else showBar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
