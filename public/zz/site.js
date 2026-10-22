/* Zenzia · editor de webs de clientes (genérico).
 * Se incluye en la web del cliente:
 *   <script src="https://app.zenzia.es/zz/site.js" data-company="<company_id>" defer></script>
 * - Siempre: aplica los cambios guardados en Zenzia (tabla web_texts).
 * - Con ?zz_edit=1 (dentro de "Mi web" en Zenzia): todo texto e imagen se
 *   edita encima, las listas marcadas con data-zz-list (p. ej. noticias) permiten
 *   añadir/quitar elementos y cada sección se puede ocultar o mostrar.
 *   También se pueden añadir secciones nuevas (texto, texto con foto o galería)
 *   entre las existentes. No se puede mover nada. Los cambios se mandan a Zenzia
 *   por postMessage.
 * - Los elementos que ya traen data-zz / data-zz-img / data-zz-href en el HTML
 *   conservan su clave; el resto se numera automáticamente por sección.
 */
(function () {
  var me = document.currentScript;
  var CID = me && me.getAttribute('data-company');
  if (!CID) return;
  var SB = 'https://fztomfxebxovgqahkqsy.supabase.co';
  var KEY = 'sb_publishable_xP24V2ahFJDonoeqoC2wiw_0Ina4oUO';
  var EDIT = /[?&]zz_edit=1/.test(location.search);
  var INLINE = { B: 1, STRONG: 1, EM: 1, I: 1, BR: 1, SMALL: 1, U: 1 };
  // Tarjetas que abren un álbum de fotos gestionado desde Zenzia.
  var ALBUM = '[data-zz-album], .work-card[data-category]';
  var PH = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e8edf3"/><text x="50%" y="50%" font-family="sans-serif" font-size="30" fill="#6b7a8c" text-anchor="middle">Pulsa para poner una foto</text></svg>');

  function post(msg) { if (window.parent !== window) window.parent.postMessage(msg, '*'); }

  // ---- Métricas (visitas y clics) para el dashboard de Zenzia ----
  // No cuenta lo que se ve dentro de Zenzia (vista previa / edición).
  // Abrir la web con ?zz_me=1 marca este navegador como del dueño y deja de contar sus visitas.
  try { if (/[?&]zz_me=1/.test(location.search)) localStorage.setItem('zz_me', '1'); } catch (e) {}
  var ME = false;
  try { ME = localStorage.getItem('zz_me') === '1'; } catch (e) {}
  if (!EDIT && !ME && window.parent === window) {
    // Id por navegador (no por pestaña) para contar personas distintas.
    var sid = '';
    try { sid = localStorage.getItem('zz_vid') || Math.random().toString(36).slice(2); localStorage.setItem('zz_vid', sid); } catch (e) {}
    var device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'movil' : 'ordenador';
    var track = function (type, extra) {
      var body = { company_id: CID, type: type, path: location.pathname.slice(0, 250), device: device, session_id: sid };
      for (var k in extra) body[k] = extra[k];
      fetch(SB + '/rest/v1/web_events', {
        method: 'POST', keepalive: true,
        headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(body)
      }).catch(function () {});
    };
    var NAMES = [[/wa\.me|whatsapp/i, 'WhatsApp'], [/^mailto:/i, 'Email'], [/^tel:/i, 'Teléfono'], [/instagram\.com/i, 'Instagram'],
      [/tiktok\.com/i, 'TikTok'], [/facebook\.com/i, 'Facebook'], [/wallapop/i, 'Wallapop'], [/google\.[a-z.]+\/maps|maps\.app|goo\.gl\/maps/i, 'Cómo llegar']];
    track('view', { referrer: (document.referrer || '').slice(0, 400) });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') return; // saltos dentro de la misma página
      var label = '';
      for (var i = 0; i < NAMES.length; i++) if (NAMES[i][0].test(a.href)) { label = NAMES[i][1]; break; }
      if (!label) label = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) || a.href.slice(0, 80);
      track('click', { label: label, href: a.href.slice(0, 450) });
    }, true);
  }

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
  var EXTRA = [];
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
    try { EXTRA = JSON.parse(saved || '[]'); } catch (e) { EXTRA = []; }
    if (!Array.isArray(EXTRA)) EXTRA = [];
    EXTRA.forEach(function (sec) {
      var a = document.querySelector('[data-zz-block="' + sec.after + '"], [data-zz-extra="' + sec.after + '"]');
      var el = extraEl(sec);
      if (a) a.insertAdjacentElement('afterend', el);
      else { var f = document.querySelector('footer'); if (f) f.parentNode.insertBefore(el, f); else document.body.appendChild(el); }
    });
  }
  function saveExtras() { post({ type: 'zz-text', key: 'sections', value: JSON.stringify(EXTRA) }); }

  var hideCss = document.createElement('style');
  hideCss.textContent = EDIT
    ? '[data-zz-hidden="1"]{opacity:.35;filter:grayscale(1)}'
    : '[data-zz-hidden="1"]{display:none!important}';
  document.head.appendChild(hideCss);

  function start(rows) {
    var map = {};
    rows.forEach(function (r) { map[r.key] = r.value; });
    document.querySelectorAll('[data-zz-list]').forEach(function (list) {
      setupList(list, map['list:' + list.getAttribute('data-zz-list')]);
    });
    assignKeys();
    renderExtras(map.sections);
    apply(map);
    // Fuera del editor, las fotos que aún no se han puesto no se muestran.
    if (!EDIT) document.querySelectorAll('img[data-zz-ph]').forEach(function (i) { (i.closest('[data-zz-photo]') || i).remove(); });
    if (EDIT) enableEditing();
  }

  fetch(SB + '/rest/v1/web_texts?company_id=eq.' + CID + '&select=key,value', { headers: { apikey: KEY } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .catch(function () { return []; })
    .then(function (rows) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { start(rows); });
      else start(rows);
    });

  // ------------------------- Modo edición -------------------------
  function smallBtn(text, title, css) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.title = title;
    b.setAttribute('data-zz-ui', '1');
    b.style.cssText = 'font:600 12px system-ui,sans-serif;background:#2f9ce0;color:#fff;border:0;border-radius:999px;padding:4px 10px;cursor:pointer;z-index:50;' + (css || '');
    return b;
  }

  function makeEditable(el) {
    if (el.__zz) return;
    el.__zz = 1;
    try { el.contentEditable = 'plaintext-only'; } catch (e) {}
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    // Se compara con el texto que había al empezar a editar (no al cargar la página).
    var before = el.textContent;
    el.addEventListener('focus', function () { before = el.textContent.replace(/\s+/g, ' ').trim(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !/^(P|LI|BLOCKQUOTE)$/.test(el.tagName)) { e.preventDefault(); el.blur(); } });
    // Se guarda mientras se escribe (no solo al salir) para que no se pierda si se
    // pulsa «Guardar» directamente. Un texto vacío no se guarda: se recupera el anterior.
    var timer;
    function send() {
      clearTimeout(timer);
      var v = el.textContent.replace(/\s+/g, ' ').trim();
      if (!v || v === before) return;
      before = v;
      syncLink(el, v);
      post({ type: 'zz-text', key: el.getAttribute('data-zz'), value: v });
    }
    el.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(send, 400); });
    el.addEventListener('blur', function () {
      send();
      if (!el.textContent.trim()) el.textContent = before;
    });
  }

  function decorateItem(list, it) {
    if (it.__zzItem) return;
    it.__zzItem = 1;
    if (getComputedStyle(it).position === 'static') it.style.position = 'relative';
    var del = smallBtn('✕ Quitar', 'Quitar este elemento', 'position:absolute;top:8px;right:8px;background:#e5484d');
    del.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (list.children.length <= 1) return alert('Tiene que quedar al menos uno.');
      if (!confirm('¿Quitar este elemento de la web?')) return;
      it.remove();
      post({ type: 'zz-text', key: 'list:' + list.__zzName, value: listOrder(list) });
    }, true);
    it.appendChild(del);
    it.querySelectorAll('[data-zz]').forEach(makeEditable);
  }

  function enableEditing() {
    var css = document.createElement('style');
    css.textContent =
      '[data-zz]{outline:1.5px dashed rgba(47,156,224,.8);outline-offset:3px;cursor:text;border-radius:4px}' +
      '[data-zz]:focus{outline:2px solid #2f9ce0;background:rgba(47,156,224,.08)}' +
      '[data-zz-img]{outline:3px dashed rgba(47,156,224,.9);outline-offset:-3px;cursor:pointer}' +
      '[data-zz-block]{position:relative}' +
      '*{animation-play-state:paused}' +
      '.reveal,[class*="reveal"]{opacity:1!important;transform:none!important}' +
      '.zz-add{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;padding:10px 0;position:relative;z-index:40}';
    document.head.appendChild(css);

    document.querySelectorAll('[data-zz]').forEach(makeEditable);

    // Listas: quitar cada elemento y añadir nuevos (se añaden al principio).
    document.querySelectorAll('[data-zz-list]').forEach(function (list) {
      Array.prototype.forEach.call(list.children, function (it) { decorateItem(list, it); });
      var add = smallBtn('+ Añadir', 'Añadir un elemento nuevo', 'display:block;margin:16px auto;padding:8px 18px;font-size:14px');
      add.addEventListener('click', function (e) {
        e.preventDefault();
        var it = list.__zzTemplate.cloneNode(true);
        it.setAttribute('data-zz-item', 'n' + Date.now());
        list.insertBefore(it, list.firstChild);
        keyItems(list);
        decorateItem(list, it);
        // El nuevo elemento parte del texto de la plantilla: se guarda tal cual.
        it.querySelectorAll('[data-zz]').forEach(function (el) {
          post({ type: 'zz-text', key: el.getAttribute('data-zz'), value: el.textContent.replace(/\s+/g, ' ').trim() });
        });
        post({ type: 'zz-text', key: 'list:' + list.__zzName, value: listOrder(list) });
        it.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      list.parentNode.insertBefore(add, list);
    });

    // Secciones: ocultar / mostrar.
    blocks().forEach(function (b) {
      if (!b.hideable) return;
      var hidden = b.el.getAttribute('data-zz-hidden') === '1';
      var t = smallBtn(hidden ? '👁 Mostrar sección' : 'Ocultar sección', 'Ocultar o mostrar esta sección', 'position:absolute;top:10px;left:10px;background:#163e6e;opacity:.9');
      t.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        hidden = !hidden;
        b.el.setAttribute('data-zz-hidden', hidden ? '1' : '');
        t.textContent = hidden ? '👁 Mostrar sección' : 'Ocultar sección';
        post({ type: 'zz-text', key: 'hide:' + b.key, value: hidden ? '1' : '' });
      }, true);
      b.el.appendChild(t);
    });

    // Añadir sección después de cada sección (y de las añadidas).
    function addBar(afterKey, anchor) {
      var bar = document.createElement('div');
      bar.className = 'zz-add';
      bar.setAttribute('data-zz-ui', '1');
      var plus = smallBtn('+ Añadir sección aquí', 'Añadir una sección nueva debajo', 'opacity:.85');
      plus.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        bar.textContent = '';
        [['texto', 'Texto'], ['foto', 'Texto y foto'], ['galeria', 'Galería de fotos']].forEach(function (t) {
          var b = smallBtn(t[1], 'Añadir sección de ' + t[1].toLowerCase());
          b.addEventListener('click', function (ev) {
            ev.preventDefault(); ev.stopPropagation();
            var sec = { id: Date.now().toString(36), after: afterKey, type: t[0], photos: [] };
            EXTRA.push(sec);
            saveExtras();
            var el = extraEl(sec);
            bar.insertAdjacentElement('afterend', el);
            decorateExtra(sec, el);
            bar.replaceWith(addBar(afterKey));
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, true);
          bar.appendChild(b);
        });
        var cancel = smallBtn('Cancelar', 'Cancelar', 'background:#8a94a3');
        cancel.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); bar.replaceWith(addBar(afterKey)); }, true);
        bar.appendChild(cancel);
      }, true);
      bar.appendChild(plus);
      if (anchor) anchor.insertAdjacentElement('afterend', bar);
      return bar;
    }
    function decorateExtra(sec, el) {
      el.querySelectorAll('[data-zz]').forEach(makeEditable);
      var del = smallBtn('🗑 Borrar sección', 'Borrar esta sección', 'position:absolute;top:10px;left:10px;background:#e5484d');
      del.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (!confirm('¿Borrar esta sección de la web?')) return;
        EXTRA = EXTRA.filter(function (s) { return s.id !== sec.id; });
        // Las que iban detrás de esta pasan a ir detrás de la anterior.
        EXTRA.forEach(function (s) { if (s.after === sec.id) s.after = sec.after; });
        saveExtras();
        var bar = el.nextElementSibling;
        if (bar && bar.classList.contains('zz-add')) bar.remove();
        el.remove();
      }, true);
      el.appendChild(del);
      if (sec.type === 'galeria') {
        var grid = el.querySelector('.zz-grid');
        var photoDel = function (c) {
          var x = smallBtn('✕', 'Quitar foto', 'position:absolute;top:6px;right:6px;background:#e5484d;padding:2px 8px');
          x.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            var pid = c.getAttribute('data-zz-photo');
            sec.photos = sec.photos.filter(function (q) { return q !== pid; });
            saveExtras();
            c.remove();
          }, true);
          c.appendChild(x);
        };
        grid.querySelectorAll('[data-zz-photo]').forEach(photoDel);
        var add = smallBtn('+ Añadir foto', 'Añadir una foto a la galería', 'display:block;margin:16px auto 0;padding:8px 18px;font-size:14px');
        add.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          var pid = 'p' + Date.now().toString(36);
          sec.photos.push(pid);
          saveExtras();
          var c = extraEl({ id: sec.id, type: 'galeria', photos: [pid] }).querySelector('[data-zz-photo]');
          grid.appendChild(c);
          photoDel(c);
          post({ type: 'zz-img', key: 'x' + sec.id + '.' + pid });
        }, true);
        grid.insertAdjacentElement('afterend', add);
      }
      addBar(sec.id, el);
    }
    blocks().forEach(function (b) { if (b.el.tagName !== 'FOOTER') addBar(b.key, b.el); });
    EXTRA.forEach(function (sec) {
      var el = document.querySelector('[data-zz-extra="' + sec.id + '"]');
      if (el) decorateExtra(sec, el);
    });

    // Enlaces externos: cambiar la dirección con 🔗.
    document.querySelectorAll('[data-zz-href]').forEach(function (a) {
      var b = smallBtn('🔗', 'Cambiar enlace', 'margin-left:4px;padding:1px 6px');
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var url = prompt('Dirección del enlace:', a.href);
        if (!url) return;
        if (!/^(https?:|mailto:|tel:)/.test(url)) url = 'https://' + url;
        a.href = url;
        post({ type: 'zz-text', key: 'href:' + a.getAttribute('data-zz-href'), value: url });
      }, true);
      a.insertAdjacentElement('afterend', b);
    });

    // Nada navega: los clics editan. Las imágenes se sustituyen desde Zenzia.
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-zz-ui]')) return;
      var card = e.target.closest(ALBUM);
      if (card) { e.preventDefault(); e.stopPropagation(); post({ type: 'zz-album', slug: card.getAttribute('data-zz-album') || card.getAttribute('data-category') }); return; }
      var img = e.target.closest('[data-zz-img]');
      if (img) { e.preventDefault(); e.stopPropagation(); post({ type: 'zz-img', key: img.getAttribute('data-zz-img') }); return; }
      if (e.target.closest('a, button')) e.preventDefault();
    }, true);
    document.addEventListener('submit', function (e) { e.preventDefault(); }, true);

    var hasAlbums = !!document.querySelector(ALBUM);
    document.querySelectorAll(ALBUM).forEach(function (c) { c.style.outline = '3px dashed rgba(47,156,224,.9)'; c.style.outlineOffset = '-3px'; });

    // Zenzia pide las fotos actuales (estáticas) de los álbumes para importarlas.
    window.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'zz-export-static') return;
      var data = (typeof workCategoriesData !== 'undefined' && workCategoriesData) || {};
      var slugs = Object.keys(data);
      (function next(i) {
        if (i >= slugs.length) return post({ type: 'zz-static-done' });
        var slug = slugs[i], cat = data[slug];
        var subEl = document.querySelector('[data-category="' + slug + '"] .work-card-sub');
        var items = (cat.items || []).filter(function (it) { return it.type !== 'video'; });
        Promise.all(items.map(function (it) {
          return fetch(it.src).then(function (r) { return r.blob(); }).then(function (b) { return { blob: b, caption: it.caption || '' }; }).catch(function () { return null; });
        })).then(function (files) {
          post({ type: 'zz-static', slug: slug, title: cat.label, subtitle: subEl ? subEl.textContent : '', files: files.filter(Boolean) });
          next(i + 1);
        });
      })(0);
    });

    post({ type: 'zz-ready', albums: hasAlbums });
  }
})();
