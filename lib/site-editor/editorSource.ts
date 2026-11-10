// Código del editor en vivo de las webs de clientes, como texto. NO va en
// public/: solo lo sirve app/api/site/editor/route.ts con un token válido (ver
// lib/siteScript.ts). Se guarda como String.raw para que llegue al navegador
// tal cual (sin compilar). No usar comillas invertidas ni "${" dentro.
export const EDITOR_SOURCE = String.raw`/* Zenzia · editor en vivo de las webs de clientes.
 * Lo sirve GET /api/site/editor solo con un token válido, y lo carga
 * public/zz/site.js dentro del iframe de "Mi web" (ver ese archivo). Usa los
 * ayudantes que site.js deja en window.__zzSite. Todo texto e imagen se edita
 * encima, las listas marcadas con data-zz-list permiten añadir/quitar
 * elementos, cada sección se puede ocultar o mostrar y se pueden añadir
 * secciones nuevas (texto, texto con foto o galería). Los cambios se mandan al
 * panel de Zenzia por postMessage (solo a su origen).
 */
(function () {
  var S = window.__zzSite;
  if (!S || S.__editor) return;
  S.__editor = 1;
  function saveExtras() { S.post({ type: 'zz-text', key: 'sections', value: JSON.stringify(S.extra) }); }
  S.hideCss.textContent = '[data-zz-hidden="1"]{opacity:.35;filter:grayscale(1)}';

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
      S.syncLink(el, v);
      S.post({ type: 'zz-text', key: el.getAttribute('data-zz'), value: v });
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
      S.post({ type: 'zz-text', key: 'list:' + list.__zzName, value: S.listOrder(list) });
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
        S.keyItems(list);
        decorateItem(list, it);
        // El nuevo elemento parte del texto de la plantilla: se guarda tal cual.
        it.querySelectorAll('[data-zz]').forEach(function (el) {
          S.post({ type: 'zz-text', key: el.getAttribute('data-zz'), value: el.textContent.replace(/\s+/g, ' ').trim() });
        });
        S.post({ type: 'zz-text', key: 'list:' + list.__zzName, value: S.listOrder(list) });
        it.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      list.parentNode.insertBefore(add, list);
    });

    // Secciones: ocultar / mostrar.
    S.blocks().forEach(function (b) {
      if (!b.hideable) return;
      var hidden = b.el.getAttribute('data-zz-hidden') === '1';
      var t = smallBtn(hidden ? '👁 Mostrar sección' : 'Ocultar sección', 'Ocultar o mostrar esta sección', 'position:absolute;top:10px;left:10px;background:#163e6e;opacity:.9');
      t.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        hidden = !hidden;
        b.el.setAttribute('data-zz-hidden', hidden ? '1' : '');
        t.textContent = hidden ? '👁 Mostrar sección' : 'Ocultar sección';
        S.post({ type: 'zz-text', key: 'hide:' + b.key, value: hidden ? '1' : '' });
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
            S.extra.push(sec);
            saveExtras();
            var el = S.extraEl(sec);
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
        S.extra = S.extra.filter(function (s) { return s.id !== sec.id; });
        // Las que iban detrás de esta pasan a ir detrás de la anterior.
        S.extra.forEach(function (s) { if (s.after === sec.id) s.after = sec.after; });
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
          var c = S.extraEl({ id: sec.id, type: 'galeria', photos: [pid] }).querySelector('[data-zz-photo]');
          grid.appendChild(c);
          photoDel(c);
          S.post({ type: 'zz-img', key: 'x' + sec.id + '.' + pid });
        }, true);
        grid.insertAdjacentElement('afterend', add);
      }
      addBar(sec.id, el);
    }
    S.blocks().forEach(function (b) { if (b.el.tagName !== 'FOOTER') addBar(b.key, b.el); });
    S.extra.forEach(function (sec) {
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
        S.post({ type: 'zz-text', key: 'href:' + a.getAttribute('data-zz-href'), value: url });
      }, true);
      a.insertAdjacentElement('afterend', b);
    });

    // Nada navega: los clics editan. Las imágenes se sustituyen desde Zenzia.
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-zz-ui]')) return;
      var card = e.target.closest(S.ALBUM);
      if (card) { e.preventDefault(); e.stopPropagation(); S.post({ type: 'zz-album', slug: card.getAttribute('data-zz-album') || card.getAttribute('data-category') }); return; }
      var img = e.target.closest('[data-zz-img]');
      if (img) { e.preventDefault(); e.stopPropagation(); S.post({ type: 'zz-img', key: img.getAttribute('data-zz-img') }); return; }
      if (e.target.closest('a, button')) e.preventDefault();
    }, true);
    document.addEventListener('submit', function (e) { e.preventDefault(); }, true);

    var hasAlbums = !!document.querySelector(S.ALBUM);
    document.querySelectorAll(S.ALBUM).forEach(function (c) { c.style.outline = '3px dashed rgba(47,156,224,.9)'; c.style.outlineOffset = '-3px'; });

    // Zenzia pide las fotos actuales (estáticas) de los álbumes para importarlas.
    window.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'zz-export-static') return;
      var data = (typeof workCategoriesData !== 'undefined' && workCategoriesData) || {};
      var slugs = Object.keys(data);
      (function next(i) {
        if (i >= slugs.length) return S.post({ type: 'zz-static-done' });
        var slug = slugs[i], cat = data[slug];
        var subEl = document.querySelector('[data-category="' + slug + '"] .work-card-sub');
        var items = (cat.items || []).filter(function (it) { return it.type !== 'video'; });
        Promise.all(items.map(function (it) {
          return fetch(it.src).then(function (r) { return r.blob(); }).then(function (b) { return { blob: b, caption: it.caption || '' }; }).catch(function () { return null; });
        })).then(function (files) {
          S.post({ type: 'zz-static', slug: slug, title: cat.label, subtitle: subEl ? subEl.textContent : '', files: files.filter(Boolean) });
          next(i + 1);
        });
      })(0);
    });

    S.post({ type: 'zz-ready', albums: hasAlbums });
  }
  enableEditing();
})();
`;
