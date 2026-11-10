/* Aviso de cookies de La Placita (primera capa + configuración).
 * - La web no instala cookies propias. La única de terceros es Google Maps,
 *   que solo se carga si se acepta (o si se pulsa «Ver mapa»).
 * - La elección se guarda en el navegador (lp_cookie_consent): es un dato
 *   técnico, exento de consentimiento, necesario para recordar la decisión.
 * - Cualquier enlace con data-cookie-settings vuelve a abrir la configuración.
 */
(function () {
  var KEY = 'lp_cookie_consent';
  var VERSION = 1;

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.v === VERSION ? v : null;
    } catch (e) { return null; }
  }
  function save(maps) {
    var v = { v: VERSION, maps: !!maps, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    apply(v);
  }

  // Carga del mapa (solo con consentimiento).
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
  function apply(v) { if (v && v.maps) loadMaps(); }

  var css =
    '.ck-bar{position:fixed;left:16px;right:16px;bottom:16px;z-index:400;max-width:760px;margin:0 auto;' +
    'background:#152C4E;color:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(21,44,78,.35);' +
    'padding:18px 20px;font:400 .9rem/1.5 "Nunito Sans",sans-serif;display:flex;flex-wrap:wrap;gap:14px;align-items:center}' +
    '.ck-bar p{margin:0;flex:1 1 300px;color:rgba(255,255,255,.88)}' +
    '.ck-bar a{color:#fff;text-decoration:underline}' +
    '.ck-actions{display:flex;flex-wrap:wrap;gap:8px}' +
    '.ck-btn{font:700 .85rem "Nunito Sans",sans-serif;border-radius:999px;padding:10px 18px;cursor:pointer;border:2px solid #fff;background:#fff;color:#152C4E}' +
    '.ck-btn.ck-ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.55)}' +
    '.ck-btn:focus-visible{outline:3px solid #C79A45;outline-offset:2px}' +
    '.ck-modal{position:fixed;inset:0;z-index:410;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,31,56,.55)}' +
    '.ck-panel{background:#FBF6EE;color:#241F1B;border-radius:16px;max-width:520px;width:100%;padding:24px;font:400 .92rem/1.55 "Nunito Sans",sans-serif;box-shadow:0 20px 50px rgba(21,44,78,.3)}' +
    '.ck-panel h2{font:600 1.3rem "Fraunces",serif;margin:0 0 6px}' +
    '.ck-panel p{margin:0 0 14px;color:#5B534C}' +
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
      '<p>Esta web no usa cookies propias de análisis ni de publicidad. Solo si lo aceptas cargaremos el mapa de Google Maps, que instala cookies de terceros. Puedes obtener más información <a href="cookies.html">aquí</a>.</p>' +
      '<div class="ck-actions">' +
      '<button type="button" class="ck-btn" data-ck="accept">Aceptar cookies</button>' +
      '<button type="button" class="ck-btn" data-ck="reject">Rechazar cookies</button>' +
      '<button type="button" class="ck-btn ck-ghost" data-ck="settings">Configuración</button>' +
      '</div></div>');
    bar.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-ck');
      if (a === 'accept') { save(true); closeBar(); }
      else if (a === 'reject') { save(false); closeBar(); }
      else if (a === 'settings') { showSettings(); }
    });
    document.body.appendChild(bar);
  }

  function showSettings() {
    var cur = read();
    var m = el('<div class="ck-modal" role="dialog" aria-modal="true" aria-labelledby="ck-title"><div class="ck-panel">' +
      '<h2 id="ck-title">Configuración de cookies</h2>' +
      '<p>Elige qué permites. Puedes cambiarlo cuando quieras desde «Configurar cookies», al pie de la página. Más detalles en la <a href="cookies.html">política de cookies</a>.</p>' +
      '<div class="ck-row"><div><strong>Técnicas (siempre activas)</strong><span>Solo guardan en tu navegador la elección que hagas aquí.</span></div><input type="checkbox" checked disabled aria-label="Técnicas, siempre activas"></div>' +
      '<div class="ck-row"><div><strong>Mapas · Google Maps (terceros)</strong><span>Muestra el mapa de la academia. Google puede instalar sus propias cookies.</span></div><input type="checkbox" id="ck-maps"' + (cur && cur.maps ? ' checked' : '') + ' aria-label="Mapas de Google Maps"></div>' +
      '<div class="ck-actions">' +
      '<button type="button" class="ck-btn ck-ghost" data-ck="reject">Rechazar todas</button>' +
      '<button type="button" class="ck-btn ck-ghost" data-ck="save">Guardar selección</button>' +
      '<button type="button" class="ck-btn" data-ck="accept">Aceptar todas</button>' +
      '</div></div></div>');
    function done(maps) {
      var hadMaps = !!(read() || {}).maps;
      save(maps);
      m.remove();
      closeBar();
      // Si se retira el permiso con el mapa ya cargado, se recarga para quitarlo.
      if (hadMaps && !maps && document.querySelector('.location-map iframe')) location.reload();
    }
    m.addEventListener('click', function (e) {
      if (e.target === m) { m.remove(); return; }
      var a = e.target.getAttribute && e.target.getAttribute('data-ck');
      if (a === 'accept') done(true);
      else if (a === 'reject') done(false);
      else if (a === 'save') done(m.querySelector('#ck-maps').checked);
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

    // Restos de la versión con estadísticas (retirada): no se guarda ningún identificador.
    try { localStorage.removeItem('lp_vid'); } catch (e) {}
    var v = read();
    if (v) apply(v); else showBar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
