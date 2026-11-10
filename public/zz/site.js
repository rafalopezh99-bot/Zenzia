/* Zenzia · script público para las webs de clientes.
 * Se incluye en la web del cliente:
 *   <script src="https://app.zenzia.es/zz/site.js" data-company="<company_id>" defer></script>
 *
 * Qué hace (y nada más):
 * - Aplica los cambios guardados desde "Mi web" en Zenzia. Los lee de
 *   GET <app>/api/site/<company_id>/texts (caché, solo lectura). El navegador
 *   del visitante no habla con Supabase ni lleva claves.
 * - Métricas de visitas y clics SOLO con consentimiento expreso: hasta que la
 *   web llame a window.zzConsent(true) (normalmente desde su banner de
 *   cookies) no se mide nada ni se guarda nada en el navegador. Ver README.
 * - Dentro del iframe de "Mi web" con ?zz_edit=1, pide al panel de Zenzia un
 *   token firmado (postMessage) y carga el editor desde <app>/api/site/editor,
 *   que solo lo sirve si el token es válido. Este archivo no contiene el
 *   editor: abrir la web con ?zz_edit=1 fuera de Zenzia no hace nada.
 * - Los elementos que ya traen data-zz / data-zz-img / data-zz-href en el HTML
 *   conservan su clave; el resto se numera automáticamente por sección.
 */
(function () {
  var me = document.currentScript;
  var CID = me && me.getAttribute('data-company');
  if (!CID) return;
  var API = new URL(me.src, location.href).origin;
  var IN_FRAME = window.parent !== window;
  var WANTS_EDIT = IN_FRAME && /[?&]zz_edit=1/.test(location.search);
  // Orígenes del panel de Zenzia que pueden mandar el token del editor.
  var ZENZIA = [API, 'https://app.zenzia.es', 'https://zenzia.es', 'https://www.zenzia.es'];
  var INLINE = { B: 1, STRONG: 1, EM: 1, I: 1, BR: 1, SMALL: 1, U: 1 };
  // Tarjetas que abren un álbum de fotos gestionado desde Zenzia.
  var ALBUM = '[data-zz-album], .work-card[data-category]';
  var PH = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e8edf3"/><text x="50%" y="50%" font-family="sans-serif" font-size="30" fill="#6b7a8c" text-anchor="middle">Pulsa para poner una foto</text></svg>');
  // Estado compartido con el editor (solo se le expone si el servidor lo sirve).
  var S = { cid: CID, api: API, ALBUM: ALBUM, PH: PH, extra: [], parentOrigin: null };

  // ---- Métricas (visitas y clics), solo con consentimiento ----
  // window.zzConsent(true) activa la medición en esta página; zzConsent(false)
  // la para y borra el identificador. La web del cliente tiene que llamarla en
  // cada carga mientras el visitante tenga aceptada la analítica. Si su banner
  // se ejecuta antes que este script, puede dejar window.zzConsentPending = true.
  // Lo que se ve dentro de Zenzia (vista previa / edición) nunca cuenta.
  var consent = false, viewSent = false, sid = '';
  var device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'movil' : 'ordenador';
  function track(type, extra) {
    if (!consent) return;
    var body = { type: type, path: location.pathname.slice(0, 250), device: device, session_id: sid };
    for (var k in extra) body[k] = extra[k];
    var url = API + '/api/site/' + encodeURIComponent(CID) + '/events', data = JSON.stringify(body);
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, data)) return; } catch (e) {}
    fetch(url, { method: 'POST', body: data, keepalive: true, mode: 'no-cors' }).catch(function () {});
  }
  var NAMES = [[/wa\.me|whatsapp/i, 'WhatsApp'], [/^mailto:/i, 'Email'], [/^tel:/i, 'Teléfono'], [/instagram\.com/i, 'Instagram'],
    [/tiktok\.com/i, 'TikTok'], [/facebook\.com/i, 'Facebook'], [/wallapop/i, 'Wallapop'], [/google\.[a-z.]+\/maps|maps\.app|goo\.gl\/maps/i, 'Cómo llegar']];
  function onClick(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#') return; // saltos dentro de la misma página
    var label = '';
    for (var i = 0; i < NAMES.length; i++) if (NAMES[i][0].test(a.href)) { label = NAMES[i][1]; break; }
    if (!label) label = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) || a.href.slice(0, 80);
    track('click', { label: label, href: a.href.slice(0, 450) });
  }
  window.zzConsent = function (yes) {
    if (IN_FRAME) return;
    if (!yes) {
      consent = false;
      try { localStorage.removeItem('zz_vid'); } catch (e) {}
      document.removeEventListener('click', onClick, true);
      return;
    }
    if (consent) return;
    consent = true;
    // Id por navegador (no por pestaña) para contar personas distintas. Solo con consentimiento.
    try { sid = localStorage.getItem('zz_vid') || Math.random().toString(36).slice(2); localStorage.setItem('zz_vid', sid); } catch (e) { sid = ''; }
    document.addEventListener('click', onClick, true);
    if (!viewSent) { viewSent = true; track('view', { referrer: (document.referrer || '').slice(0, 400) }); }
  };
  if (window.zzConsentPending === true) window.zzConsent(true);

  // Bloques: secciones de la página (más cabecera y pie).
  function blocks() {
    var out = [];
    document.querySelectorAll('header, section, footer').forEach(function (el, i) {
      if (el.parentElement && el.parentElement.closest('section, header, footer')) return;
      out.push({ el: el, key: el.id || el.tagName.toLowerCase() + i, hideable: el.tagName === 'SECTION' });
    });
    return out;
  }

  // Texto editable = elemento cuyo contenido es solo texto (o negrita/cursiva).
  function isLeaf(el) {
    if (!el.textContent.trim() || el.closest('script, style, svg, button, form, [data-zz-skip]')) return false;
    for (var i = 0; i < el.children.length; i++) if (!INLINE[el.children[i].tagName]) return false;
    return true;
  }
  function leaves(root, exclude) {
    var all = root.querySelectorAll('h1,h2,h3,h4,h5,p,li,span,a,small,strong,em,label,blockquote,figcaption,td,th,dt,dd');
    var out = [];
    all.forEach(function (el) {
      if (exclude && el.closest(exclude) && el.closest(exclude) !== root) return;
      if (!isLeaf(el)) return;
      if (el.parentElement && out.indexOf(el.parentElement) >= 0) return; // ya cubierto por el padre
      out.push(el);
    });
    return out;
  }

  // ---- Listas (noticias...): orden e ids guardados como JSON en "list:<nombre>" ----
  function setupList(list, saved) {
    var name = list.getAttribute('data-zz-list');
    var items = Array.prototype.slice.call(list.children);
    if (!items.length) return;
    var template = items[0].cloneNode(true);
    items.forEach(function (it, i) { it.setAttribute('data-zz-item', 'i' + i); });
    if (saved) {
      var ids;
      try { ids = JSON.parse(saved); } catch (e) { ids = null; }
      if (Array.isArray(ids)) {
        var byId = {};
        items.forEach(function (it) { byId[it.getAttribute('data-zz-item')] = it; });
        list.textContent = '';
        ids.forEach(function (id) {
          var it = byId[id] || template.cloneNode(true);
          it.setAttribute('data-zz-item', id);
          list.appendChild(it);
        });
      }
    }
    list.__zzTemplate = template;
    list.__zzName = name;
  }
  function keyItems(list) {
    Array.prototype.forEach.call(list.children, function (it) {
      var id = it.getAttribute('data-zz-item');
      leaves(it).forEach(function (el, n) { el.setAttribute('data-zz', list.__zzName + '.' + id + '.' + n); });
      it.querySelectorAll('img').forEach(function (img, n) { img.setAttribute('data-zz-img', list.__zzName + '.' + id + '.img' + n); });
      it.querySelectorAll('a[href]').forEach(function (a, n) { a.setAttribute('data-zz-href', list.__zzName + '.' + id + '.a' + n); });
    });
  }
  function listOrder(list) {
    return JSON.stringify(Array.prototype.map.call(list.children, function (it) { return it.getAttribute('data-zz-item'); }));
  }

  function assignKeys() {
    blocks().forEach(function (b) {
      b.el.setAttribute('data-zz-block', b.key);
      leaves(b.el, '[data-zz-list]').filter(function (el) { return !el.closest('[data-zz]'); })
        .forEach(function (el, n) { el.setAttribute('data-zz', b.key + '.' + n); });
      var imgs = Array.prototype.filter.call(b.el.querySelectorAll('img'), function (img) { return !img.closest('[data-zz-list]') && !img.closest(ALBUM) && !img.hasAttribute('data-zz-img'); });
      imgs.forEach(function (img, n) { img.setAttribute('data-zz-img', b.key + '.img' + n); });
      var links = Array.prototype.filter.call(b.el.querySelectorAll('a[href^="http"]'), function (a) { return !a.closest('[data-zz-list]') && !a.hasAttribute('data-zz-href'); });
      links.forEach(function (a, n) { a.setAttribute('data-zz-href', b.key + '.a' + n); });
    });
    document.querySelectorAll('[data-zz-list]').forEach(keyItems);
  }

  function apply(map) {
    Object.keys(map).forEach(function (k) {
      var v = map[k];
      if (k.indexOf('img:') === 0) {
        var img = document.querySelector('[data-zz-img="' + k.slice(4) + '"]');
        if (img && v) { img.src = v; img.removeAttribute('srcset'); img.removeAttribute('data-zz-ph'); }
      } else if (k.indexOf('href:') === 0) {
        var a = document.querySelector('[data-zz-href="' + k.slice(5) + '"]');
        if (a && v) a.href = v;
      } else if (k.indexOf('hide:') === 0) {
        var bl = document.querySelector('[data-zz-block="' + k.slice(5) + '"]');
        if (bl) bl.setAttribute('data-zz-hidden', v === '1' ? '1' : '');
      } else if (k.indexOf('list:') !== 0 && k !== 'sections') {
        var el = document.querySelector('[data-zz="' + k + '"]');
        if (el) { el.textContent = v; syncLink(el, v); }
      }
    });
  }

  // Email y WhatsApp: al cambiar el texto del enlace se actualiza también su dirección.
  function syncLink(el, v) {
    var a = el.closest('a[href]');
    if (!a) return;
    if (/^mailto:/i.test(a.getAttribute('href')) && /@/.test(v)) a.href = 'mailto:' + v.trim();
    else if (/wa\.me\//.test(a.href)) {
      var d = v.replace(/\D/g, '');
      if (d.length === 9) d = '34' + d;
      if (d.length >= 10) document.querySelectorAll('a[href*="wa.me/"]').forEach(function (w) { w.href = w.href.replace(/wa\.me\/\d*/, 'wa.me/' + d); });
    }
  }

  // ---- Secciones añadidas desde Zenzia: JSON en "sections" ----
  // [{ id, after: <clave de la sección anterior>, type: 'texto'|'foto'|'galeria', photos: [ids] }]
  function extraEl(sec) {
    var w = document.createElement('div');
    w.className = 'zz-x zz-x-' + sec.type;
    w.setAttribute('data-zz-extra', sec.id);
    w.style.cssText = 'position:relative;max-width:1100px;margin:0 auto;padding:64px 20px';
    var k = 'x' + sec.id;
    var h = document.createElement('h2');
    h.setAttribute('data-zz', k + '.0');
    h.textContent = 'Título de la sección';
    var p = document.createElement('p');
    p.setAttribute('data-zz', k + '.1');
    p.textContent = 'Escribe aquí el texto de la sección.';
    p.style.whiteSpace = 'pre-line';
    var img = function (key) {
      var i = document.createElement('img');
      i.src = PH;
      i.alt = '';
      i.setAttribute('data-zz-img', key);
      i.setAttribute('data-zz-ph', '1');
      i.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:12px;display:block';
      return i;
    };
    if (sec.type === 'foto') {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:32px;align-items:center';
      var txt = document.createElement('div');
      txt.style.cssText = 'flex:1 1 320px';
      txt.appendChild(h); txt.appendChild(p);
      var fig = document.createElement('div');
      fig.style.cssText = 'flex:1 1 320px;aspect-ratio:4/3';
      fig.appendChild(img(k + '.img0'));
      row.appendChild(txt); row.appendChild(fig);
      w.appendChild(row);
    } else {
      w.appendChild(h); w.appendChild(p);
      if (sec.type === 'galeria') {
        var grid = document.createElement('div');
        grid.className = 'zz-grid';
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:24px';
        (sec.photos || []).forEach(function (pid) {
          var c = document.createElement('div');
          c.setAttribute('data-zz-photo', pid);
          c.style.cssText = 'position:relative;aspect-ratio:1';
          c.appendChild(img(k + '.' + pid));
          grid.appendChild(c);
        });
        w.appendChild(grid);
      }
    }
    return w;
  }
  function renderExtras(saved) {
    try { S.extra = JSON.parse(saved || '[]'); } catch (e) { S.extra = []; }
    if (!Array.isArray(S.extra)) S.extra = [];
    S.extra.forEach(function (sec) {
      var a = document.querySelector('[data-zz-block="' + sec.after + '"], [data-zz-extra="' + sec.after + '"]');
      var el = extraEl(sec);
      if (a) a.insertAdjacentElement('afterend', el);
      else { var f = document.querySelector('footer'); if (f) f.parentNode.insertBefore(el, f); else document.body.appendChild(el); }
    });
  }


  // Secciones ocultas desde Zenzia: no se muestran (el editor cambia esta regla).
  var hideCss = document.createElement('style');
  hideCss.textContent = '[data-zz-hidden="1"]{display:none!important}';
  document.head.appendChild(hideCss);

  function post(msg) { if (S.parentOrigin) window.parent.postMessage(msg, S.parentOrigin); }
  S.hideCss = hideCss; S.post = post; S.blocks = blocks; S.leaves = leaves; S.keyItems = keyItems;
  S.listOrder = listOrder; S.extraEl = extraEl; S.syncLink = syncLink;

  // Fuera del editor, las fotos que aún no se han puesto no se muestran.
  function dropPlaceholders() {
    document.querySelectorAll('img[data-zz-ph]').forEach(function (i) { (i.closest('[data-zz-photo]') || i).remove(); });
  }

  // ---- Carga del editor (solo dentro del iframe de "Mi web") ----
  // El panel de Zenzia contesta a 'zz-edit-hello' con un token firmado de corta
  // duración; el servidor solo sirve el editor si el token es válido.
  function requestEditor() {
    var done = false;
    function finish() { done = true; window.removeEventListener('message', onMsg); }
    function onMsg(e) {
      if (done || e.source !== window.parent || ZENZIA.indexOf(e.origin) < 0) return;
      var d = e.data;
      if (!d || d.type !== 'zz-edit-token' || typeof d.token !== 'string') return;
      finish();
      S.parentOrigin = e.origin;
      window.__zzSite = S;
      var s = document.createElement('script');
      s.src = API + '/api/site/editor?c=' + encodeURIComponent(CID) + '&t=' + encodeURIComponent(d.token);
      s.onerror = function () { try { delete window.__zzSite; } catch (er) {} S.parentOrigin = null; dropPlaceholders(); };
      document.head.appendChild(s);
    }
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: 'zz-edit-hello' }, '*');
    setTimeout(function () { if (!done) { finish(); dropPlaceholders(); } }, 10000);
  }

  function start(map) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) map = {};
    document.querySelectorAll('[data-zz-list]').forEach(function (list) {
      setupList(list, map['list:' + list.getAttribute('data-zz-list')]);
    });
    assignKeys();
    renderExtras(map.sections);
    apply(map);
    if (WANTS_EDIT) requestEditor();
    else dropPlaceholders();
  }

  // Dentro de Zenzia se pide sin caché para ver al momento lo recién guardado.
  fetch(API + '/api/site/' + encodeURIComponent(CID) + '/texts' + (IN_FRAME ? '?fresh=' + Date.now() : ''), { credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .catch(function () { return {}; })
    .then(function (map) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { start(map); });
      else start(map);
    });
})();
