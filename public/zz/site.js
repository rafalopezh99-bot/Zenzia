/* Zenzia · editor de webs de clientes (genérico).
 * Se incluye en la web del cliente:
 *   <script src="https://app.zenzia.es/zz/site.js" data-company="<company_id>" defer></script>
 * - Siempre: aplica los cambios guardados en Zenzia (tabla web_texts).
 * - Con ?zz_edit=1 (dentro de "Mi web" en Zenzia): todo texto e imagen se
 *   edita encima, las listas marcadas con data-zz-list (p. ej. noticias) permiten
 *   añadir/quitar elementos y cada sección se puede ocultar o mostrar.
 *   No se puede mover nada. Los cambios se mandan a Zenzia por postMessage.
 */
(function () {
  var me = document.currentScript;
  var CID = me && me.getAttribute('data-company');
  if (!CID) return;
  var SB = 'https://fztomfxebxovgqahkqsy.supabase.co';
  var KEY = 'sb_publishable_xP24V2ahFJDonoeqoC2wiw_0Ina4oUO';
  var EDIT = /[?&]zz_edit=1/.test(location.search);
  var INLINE = { B: 1, STRONG: 1, EM: 1, I: 1, BR: 1, SMALL: 1, U: 1 };

  function post(msg) { if (window.parent !== window) window.parent.postMessage(msg, '*'); }

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
      leaves(b.el, '[data-zz-list]').forEach(function (el, n) { el.setAttribute('data-zz', b.key + '.' + n); });
      var imgs = Array.prototype.filter.call(b.el.querySelectorAll('img'), function (img) { return !img.closest('[data-zz-list]'); });
      imgs.forEach(function (img, n) { img.setAttribute('data-zz-img', b.key + '.img' + n); });
      var links = Array.prototype.filter.call(b.el.querySelectorAll('a[href^="http"]'), function (a) { return !a.closest('[data-zz-list]'); });
      links.forEach(function (a, n) { a.setAttribute('data-zz-href', b.key + '.a' + n); });
    });
    document.querySelectorAll('[data-zz-list]').forEach(keyItems);
  }

  function apply(map) {
    Object.keys(map).forEach(function (k) {
      var v = map[k];
      if (k.indexOf('img:') === 0) {
        var img = document.querySelector('[data-zz-img="' + k.slice(4) + '"]');
        if (img && v) { img.src = v; img.removeAttribute('srcset'); }
      } else if (k.indexOf('href:') === 0) {
        var a = document.querySelector('[data-zz-href="' + k.slice(5) + '"]');
        if (a && v) a.href = v;
      } else if (k.indexOf('hide:') === 0) {
        var bl = document.querySelector('[data-zz-block="' + k.slice(5) + '"]');
        if (bl) bl.setAttribute('data-zz-hidden', v === '1' ? '1' : '');
      } else if (k.indexOf('list:') !== 0) {
        var el = document.querySelector('[data-zz="' + k + '"]');
        if (el) el.textContent = v;
      }
    });
  }

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
    apply(map);
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
    var before = el.textContent;
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !/^(P|LI|BLOCKQUOTE)$/.test(el.tagName)) { e.preventDefault(); el.blur(); } });
    el.addEventListener('blur', function () {
      var v = el.textContent.replace(/\s+/g, ' ').trim();
      if (v === before) return;
      before = v;
      post({ type: 'zz-text', key: el.getAttribute('data-zz'), value: v });
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
      '*{animation-play-state:paused}';
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
      var img = e.target.closest('[data-zz-img]');
      if (img) { e.preventDefault(); e.stopPropagation(); post({ type: 'zz-img', key: img.getAttribute('data-zz-img') }); return; }
      if (e.target.closest('a, button')) e.preventDefault();
    }, true);
    document.addEventListener('submit', function (e) { e.preventDefault(); }, true);

    post({ type: 'zz-ready', albums: false });
  }
})();
