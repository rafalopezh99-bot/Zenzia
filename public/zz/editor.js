/* Zenzia · editor de webs de clientes («Mi web» → Editar).
 *
 * Solo se carga dentro de Zenzia, en la vista previa autenticada
 * (/api/mi-web/preview/index.html?edit=1). La web pública NO lo incluye.
 *
 * El servidor (lib/web-publish/render.ts) ya entrega la página con los cambios
 * guardados aplicados y con las marcas data-zz / data-zz-img / data-zz-href /
 * data-zz-block / data-zz-list puestas. Aquí solo se añade la interfaz de
 * edición: todo texto e imagen se edita encima, las listas (noticias...) permiten
 * añadir/quitar elementos, cada sección se puede ocultar y se pueden añadir
 * secciones nuevas (texto, texto con foto o galería). Los cambios se mandan a
 * Zenzia (ventana padre, mismo origen) por postMessage y Zenzia los guarda.
 */
(function () {
  var DATA = {};
  try { DATA = JSON.parse(document.getElementById('zz-editor-data').textContent); } catch (e) {}
  var INLINE = { B: 1, STRONG: 1, EM: 1, I: 1, BR: 1, SMALL: 1, U: 1 };
  var ALBUM = '[data-zz-album], .work-card[data-category]';
  var PH = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e8edf3"/><text x="50%" y="50%" font-family="sans-serif" font-size="30" fill="#6b7a8c" text-anchor="middle">Pulsa para poner una foto</text></svg>');
  var EXTRA = Array.isArray(DATA.sections) ? DATA.sections : [];

  function post(msg) { if (window.parent !== window) window.parent.postMessage(msg, location.origin); }

  // ---- Mismas reglas de claves que el servidor (para los elementos nuevos de listas) ----
  function isLeaf(el) {
    if (!el.textContent.trim() || el.closest('script, style, svg, button, form, [data-zz-skip]')) return false;
    for (var i = 0; i < el.children.length; i++) if (!INLINE[el.children[i].tagName]) return false;
    return true;
  }
  function leaves(root) {
    var all = root.querySelectorAll('h1,h2,h3,h4,h5,p,li,span,a,small,strong,em,label,blockquote,figcaption,td,th,dt,dd');
    var out = [];
    all.forEach(function (el) {
      if (!isLeaf(el)) return;
      if (el.parentElement && out.indexOf(el.parentElement) >= 0) return;
      out.push(el);
    });
    return out;
  }
  function keyItems(list) {
    var name = list.getAttribute('data-zz-list');
    Array.prototype.forEach.call(list.children, function (it) {
      if (it.hasAttribute('data-zz-ui')) return;
      var id = it.getAttribute('data-zz-item');
      leaves(it).forEach(function (el, n) { el.setAttribute('data-zz', name + '.' + id + '.' + n); });
      it.querySelectorAll('img').forEach(function (img, n) { img.setAttribute('data-zz-img', name + '.' + id + '.img' + n); });
      it.querySelectorAll('a[href]').forEach(function (a, n) { a.setAttribute('data-zz-href', name + '.' + id + '.a' + n); });
    });
  }
  function listOrder(list) {
    return JSON.stringify(Array.prototype.filter.call(list.children, function (it) { return it.hasAttribute('data-zz-item'); })
      .map(function (it) { return it.getAttribute('data-zz-item'); }));
  }
  function blocks() {
    return Array.prototype.map.call(document.querySelectorAll('[data-zz-block]'), function (el) {
      return { el: el, key: el.getAttribute('data-zz-block'), hideable: el.tagName === 'SECTION' };
    });
  }

  // Email, WhatsApp y teléfono: al cambiar el texto se actualiza también el enlace (como al publicar).
  function syncLink(el, v) {
    var a = el.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var d = v.replace(/\D/g, '');
    if (d.length === 9) d = '34' + d;
    if (/^mailto:/i.test(href) && /@/.test(v)) a.setAttribute('href', 'mailto:' + v.trim());
    else if (/^tel:/i.test(href) && d.length >= 10) a.setAttribute('href', 'tel:+' + d);
    else if (/wa\.me\//.test(href) && d.length >= 10)
      document.querySelectorAll('a[href*="wa.me/"]').forEach(function (w) { w.setAttribute('href', w.getAttribute('href').replace(/wa\.me\/\d*/, 'wa.me/' + d)); });
  }

  // ---- Secciones añadidas (mismo HTML que extraSectionHtml en el servidor) ----
  function extraEl(sec) {
    var k = 'x' + sec.id;
    var img = function (key) {
      return '<img src="' + PH + '" alt="" data-zz-img="' + key + '" data-zz-ph="1" style="width:100%;height:100%;object-fit:cover;border-radius:12px;display:block">';
    };
    var h = '<h2 data-zz="' + k + '.0">Título de la sección</h2>';
    var p = '<p data-zz="' + k + '.1" style="white-space:pre-line">Escribe aquí el texto de la sección.</p>';
    var inner;
    if (sec.type === 'foto') {
      inner = '<div style="display:flex;flex-wrap:wrap;gap:32px;align-items:center"><div style="flex:1 1 320px">' + h + p +
        '</div><div style="flex:1 1 320px;aspect-ratio:4/3">' + img(k + '.img0') + '</div></div>';
    } else {
      inner = h + p;
      if (sec.type === 'galeria') {
        inner += '<div class="zz-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:24px">' +
          (sec.photos || []).map(function (pid) { return '<div data-zz-photo="' + pid + '" style="position:relative;aspect-ratio:1">' + img(k + '.' + pid) + '</div>'; }).join('') + '</div>';
      }
    }
    var w = document.createElement('div');
    w.innerHTML = '<div class="zz-x zz-x-' + sec.type + '" data-zz-extra="' + sec.id + '" style="position:relative;max-width:1100px;margin:0 auto;padding:64px 20px">' + inner + '</div>';
    return w.firstChild;
  }
  function saveExtras() { post({ type: 'zz-text', key: 'sections', value: JSON.stringify(EXTRA) }); }

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
    var before = el.textContent;
    el.addEventListener('focus', function () { before = el.textContent.replace(/\s+/g, ' ').trim(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !/^(P|LI|BLOCKQUOTE)$/.test(el.tagName)) { e.preventDefault(); el.blur(); } });
    // Se guarda mientras se escribe, para que no se pierda si se pulsa «Guardar» directamente.
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
      if (list.querySelectorAll(':scope > [data-zz-item]').length <= 1) return alert('Tiene que quedar al menos uno.');
      if (!confirm('¿Quitar este elemento de la web?')) return;
      it.remove();
      post({ type: 'zz-text', key: 'list:' + list.getAttribute('data-zz-list'), value: listOrder(list) });
    }, true);
    it.appendChild(del);
    it.querySelectorAll('[data-zz]').forEach(makeEditable);
  }

  function init() {
    var css = document.createElement('style');
    css.textContent =
      '[data-zz-hidden="1"]{opacity:.35;filter:grayscale(1)}' +
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
      var name = list.getAttribute('data-zz-list');
      var tplHtml = (DATA.listTemplates || {})[name];
      Array.prototype.forEach.call(list.children, function (it) { decorateItem(list, it); });
      if (!tplHtml) return;
      var add = smallBtn('+ Añadir', 'Añadir un elemento nuevo', 'display:block;margin:16px auto;padding:8px 18px;font-size:14px');
      add.addEventListener('click', function (e) {
        e.preventDefault();
        var holder = document.createElement('div');
        holder.innerHTML = tplHtml;
        var it = holder.firstElementChild;
        it.querySelectorAll('[data-zz],[data-zz-img],[data-zz-href]').forEach(function (n) {
          n.removeAttribute('data-zz'); n.removeAttribute('data-zz-img'); n.removeAttribute('data-zz-href');
        });
        it.setAttribute('data-zz-item', 'n' + Date.now());
        list.insertBefore(it, list.firstChild);
        keyItems(list);
        decorateItem(list, it);
        // El nuevo elemento parte del texto de la plantilla: se guarda tal cual.
        it.querySelectorAll('[data-zz]').forEach(function (el) {
          post({ type: 'zz-text', key: el.getAttribute('data-zz'), value: el.textContent.replace(/\s+/g, ' ').trim() });
        });
        post({ type: 'zz-text', key: 'list:' + name, value: listOrder(list) });
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
          sec.photos = sec.photos || [];
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
        var url = prompt('Dirección del enlace:', a.getAttribute('href'));
        if (!url) return;
        url = url.trim();
        if (!/^(https?:|mailto:|tel:)/i.test(url)) url = 'https://' + url.replace(/^[a-z]+:/i, '');
        a.setAttribute('href', url);
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
      if (e.origin !== location.origin || !e.data || e.data.type !== 'zz-export-static') return;
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
