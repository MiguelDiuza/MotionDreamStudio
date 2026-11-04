/* Panel de galería (admin.html).
 * Lee y escribe en Supabase: tablas gallery_categories / gallery_groups / gallery_items
 * y el bucket de Storage configurado en md-config.js. Los permisos los imponen las
 * políticas RLS de supabase/schema.sql: este fichero no tiene ningún secreto.
 */
(function () {
  'use strict';

  var cfg = window.MD_SUPABASE || {};
  var BUCKET = cfg.bucket || 'gallery';
  var MAX_BYTES = 50 * 1024 * 1024;
  var ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];

  var $ = function (id) { return document.getElementById(id); };
  var views = ['viewConfig', 'viewLogin', 'viewDenied', 'viewApp', 'viewLoading'];
  function show(id) { views.forEach(function (v) { $(v).hidden = v !== id; }); }

  if (!cfg.url || !cfg.anonKey || !window.supabase) { show('viewConfig'); return; }

  var sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  // uploadLog: resultado de la última subida por grupo, para que sobreviva al re-render.
  var state = { user: null, categories: [], groups: [], current: null, busy: false, uploadLog: {} };

  // ---------- utilidades ----------
  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      [].concat(c).forEach(function (n) { if (n) el.appendChild(typeof n === 'string' ? document.createTextNode(n) : n); });
    }
    return el;
  }
  function icon(name) { return h('iconify-icon', { icon: 'lucide:' + name, 'aria-hidden': 'true' }); }

  var toastTimer;
  function toast(msg, isError) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast' + (isError ? ' error' : '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, isError ? 6000 : 2500);
  }

  function slug(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'grupo';
  }
  function safeFileName(name) {
    var dot = name.lastIndexOf('.');
    var ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
    return slug(dot > 0 ? name.slice(0, dot) : name).slice(0, 60) + ext;
  }
  function isLocalOrUrl(path) { return /^(https?:)?\/\//i.test(path) || path.indexOf('assets/') === 0; }
  function mediaUrl(path) {
    if (isLocalOrUrl(path)) return path;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  function bySort(a, b) { return (a.sort - b.sort) || String(a.created_at).localeCompare(String(b.created_at)); }
  function maxSort(list) { return list.reduce(function (m, x) { return Math.max(m, x.sort || 0); }, 0); }
  function fail(err, what) {
    console.error(what, err);
    toast((what ? what + ': ' : '') + (err && err.message ? err.message : 'error desconocido'), true);
  }

  // Ejecuta una acción, recarga datos y vuelve a pintar manteniendo el foco.
  async function run(what, fn) {
    if (state.busy) return;
    state.busy = true;
    var focusKey = document.activeElement && document.activeElement.getAttribute('data-key');
    try {
      await fn();
      await loadData();
    } catch (e) { fail(e, what); }
    state.busy = false;
    render();
    if (focusKey) {
      var el = document.querySelector('[data-key="' + CSS.escape(focusKey) + '"]');
      if (el && !el.disabled) el.focus();
    }
  }

  // ---------- auth ----------
  async function onSession(session) {
    state.user = session ? session.user : null;
    if (!state.user) { show('viewLogin'); return; }
    show('viewLoading');
    var res = await sb.from('gallery_admins').select('user_id').eq('user_id', state.user.id).maybeSingle();
    if (res.error || !res.data) {
      $('deniedEmail').textContent = state.user.email || '';
      show('viewDenied');
      return;
    }
    $('whoami').textContent = state.user.email || '';
    try { await loadData(); } catch (e) { fail(e, 'No se pudieron cargar los datos'); }
    show('viewApp');
    render();
  }

  $('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var err = $('loginError'), btn = $('loginBtn');
    err.textContent = '';
    var email = $('email').value.trim(), password = $('password').value;
    if (!email || !password) { err.textContent = 'Escribe email y contraseña.'; return; }
    btn.disabled = true; btn.textContent = 'Entrando…';
    var res = await sb.auth.signInWithPassword({ email: email, password: password });
    btn.disabled = false; btn.textContent = 'Entrar';
    if (res.error) { err.textContent = 'Email o contraseña incorrectos.'; return; }
    $('password').value = '';
    onSession(res.data.session);
  });

  document.addEventListener('click', async function (e) {
    if (!e.target.closest('[data-action="logout"]')) return;
    await sb.auth.signOut();
    state.user = null;
    show('viewLogin');
  });

  // ---------- datos ----------
  async function loadData() {
    var cats = await sb.from('gallery_categories').select('slug,title,subtitle,sort').order('sort');
    if (cats.error) throw cats.error;
    var groups = await sb.from('gallery_groups')
      .select('id,category_slug,title,landscape,sort,created_at,gallery_items(id,group_id,path,media_type,sort,visible,created_at)');
    if (groups.error) throw groups.error;
    state.categories = cats.data;
    state.groups = groups.data.map(function (g) {
      g.items = (g.gallery_items || []).sort(bySort);
      delete g.gallery_items;
      return g;
    }).sort(bySort);
    if (!state.current || !state.categories.some(function (c) { return c.slug === state.current; })) {
      state.current = state.categories.length ? state.categories[0].slug : null;
    }
  }
  function groupsOf(cat) { return state.groups.filter(function (g) { return g.category_slug === cat; }); }

  // Reescribe sort = 1..n para la lista en el orden dado (solo lo que cambia).
  async function persistOrder(table, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].sort !== i + 1) {
        var r = await sb.from(table).update({ sort: i + 1 }).eq('id', list[i].id);
        if (r.error) throw r.error;
      }
    }
  }
  function moved(list, index, delta) {
    var copy = list.slice(), j = index + delta;
    if (j < 0 || j >= copy.length) return null;
    var tmp = copy[index]; copy[index] = copy[j]; copy[j] = tmp;
    return copy;
  }

  // ---------- acciones ----------
  function addGroup(title, landscape) {
    return run('No se pudo crear el grupo', async function () {
      var r = await sb.from('gallery_groups').insert({
        category_slug: state.current, title: title, landscape: landscape, sort: maxSort(groupsOf(state.current)) + 1
      });
      if (r.error) throw r.error;
      toast('Grupo creado');
    });
  }
  function updateGroup(g, patch, okMsg) {
    return run('No se pudo guardar el grupo', async function () {
      var r = await sb.from('gallery_groups').update(patch).eq('id', g.id);
      if (r.error) throw r.error;
      if (okMsg) toast(okMsg);
    });
  }
  function moveGroup(g, delta) {
    var list = groupsOf(g.category_slug);
    var next = moved(list, list.indexOf(g), delta);
    if (next) run('No se pudo reordenar', function () { return persistOrder('gallery_groups', next); });
  }
  function deleteGroup(g) {
    if (g.items.length) return;
    if (!confirm('¿Borrar el grupo "' + g.title + '"?')) return;
    run('No se pudo borrar el grupo', async function () {
      var r = await sb.from('gallery_groups').delete().eq('id', g.id);
      if (r.error) throw r.error;
      toast('Grupo borrado');
    });
  }

  function moveItem(g, item, delta) {
    var next = moved(g.items, g.items.indexOf(item), delta);
    if (next) run('No se pudo reordenar', function () { return persistOrder('gallery_items', next); });
  }
  function toggleItem(item) {
    run('No se pudo cambiar la visibilidad', async function () {
      var r = await sb.from('gallery_items').update({ visible: !item.visible }).eq('id', item.id);
      if (r.error) throw r.error;
      toast(item.visible ? 'Oculto en la web' : 'Visible en la web');
    });
  }
  function changeItemGroup(item, targetId) {
    var target = state.groups.find(function (x) { return x.id === targetId; });
    if (!target || target.id === item.group_id) return;
    run('No se pudo mover', async function () {
      var r = await sb.from('gallery_items').update({ group_id: target.id, sort: maxSort(target.items) + 1 }).eq('id', item.id);
      if (r.error) throw r.error;
      toast('Movido a "' + target.title + '"');
    });
  }
  function deleteItem(item) {
    if (!confirm('¿Borrar este archivo de la galería? No se puede deshacer.')) return;
    run('No se pudo borrar', async function () {
      var r = await sb.from('gallery_items').delete().eq('id', item.id);
      if (r.error) throw r.error;
      // Borra el fichero del bucket solo si ningún otro ítem lo usa (p. ej. un vídeo en dos grupos).
      if (!isLocalOrUrl(item.path)) {
        var other = await sb.from('gallery_items').select('id').eq('path', item.path).limit(1);
        if (!other.error && !other.data.length) {
          var rm = await sb.storage.from(BUCKET).remove([item.path]);
          if (rm.error) console.warn('No se pudo borrar el fichero del bucket', rm.error);
        }
      }
      toast('Borrado');
    });
  }

  async function uploadFiles(g, files, listEl) {
    if (state.busy) { toast('Espera a que termine la acción en curso', true); return; }
    files = Array.prototype.slice.call(files);
    if (!files.length) return;
    state.busy = true;
    var log = state.uploadLog[g.id] = [];
    listEl.textContent = '';
    var sort = maxSort(g.items), okCount = 0;
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var entry = { name: f.name, text: 'Subiendo…', cls: '' };
      log.push(entry);
      var status = h('span', { text: entry.text });
      listEl.appendChild(h('li', null, h('span', { text: f.name }), status));
      var setStatus = function (text, cls) { entry.text = status.textContent = text; entry.cls = status.className = cls; };
      if (ALLOWED.indexOf(f.type) === -1) { setStatus('Tipo no permitido', 'err'); continue; }
      if (f.size > MAX_BYTES) { setStatus('Pesa más de 50 MB (comprímelo antes)', 'err'); continue; }
      var path = g.category_slug + '/' + slug(g.title) + '/' + Date.now() + '-' +
        Math.random().toString(36).slice(2, 7) + '-' + safeFileName(f.name);
      var up = await sb.storage.from(BUCKET).upload(path, f, { cacheControl: '31536000', contentType: f.type, upsert: false });
      if (up.error) { setStatus(up.error.message, 'err'); continue; }
      var ins = await sb.from('gallery_items').insert({
        group_id: g.id, path: path, media_type: f.type.indexOf('video/') === 0 ? 'video' : 'image', sort: ++sort
      });
      if (ins.error) {
        await sb.storage.from(BUCKET).remove([path]);
        setStatus(ins.error.message, 'err'); continue;
      }
      setStatus('Subido', 'ok'); okCount++;
    }
    state.busy = false;
    if (okCount) {
      toast(okCount === 1 ? '1 archivo subido' : okCount + ' archivos subidos');
      try { await loadData(); } catch (e) { fail(e); }
      render();
    }
  }

  // ---------- render ----------
  function render() {
    renderTabs();
    renderCategory();
  }

  function renderTabs() {
    var tabs = $('tabs');
    tabs.textContent = '';
    state.categories.forEach(function (c) {
      var n = groupsOf(c.slug).reduce(function (s, g) { return s + g.items.length; }, 0);
      var selected = c.slug === state.current;
      tabs.appendChild(h('button', {
        class: 'tab', role: 'tab', type: 'button', 'aria-selected': selected ? 'true' : 'false',
        'aria-controls': 'category', 'data-key': 'tab-' + c.slug, tabindex: selected ? '0' : '-1',
        onclick: function () { state.current = c.slug; render(); },
        onkeydown: function (e) {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          var i = state.categories.indexOf(c) + (e.key === 'ArrowRight' ? 1 : -1);
          var next = state.categories[(i + state.categories.length) % state.categories.length];
          state.current = next.slug; render();
          document.querySelector('[data-key="tab-' + next.slug + '"]').focus();
        }
      }, c.title, h('span', { class: 'count', text: '(' + n + ')' })));
    });
  }

  function renderCategory() {
    var root = $('category');
    root.textContent = '';
    var cat = state.categories.find(function (c) { return c.slug === state.current; });
    if (!cat) { root.appendChild(h('p', { class: 'empty', text: 'No hay categorías. Ejecuta supabase/schema.sql.' })); return; }
    $('viewSiteLink').href = 'gallery.html?cat=' + encodeURIComponent(cat.slug);

    root.appendChild(h('div', { class: 'cat-head' },
      h('div', null, h('h2', { text: cat.title }), h('p', { text: cat.subtitle }))));

    // Nuevo grupo
    var titleInput = h('input', { class: 'input', id: 'newGroupTitle', placeholder: 'Nombre del nuevo grupo (ej. Flyers Halloween)', maxlength: '80' });
    var landInput = h('input', { type: 'checkbox', id: 'newGroupLand' });
    root.appendChild(h('form', {
      class: 'new-group', onsubmit: function (e) {
        e.preventDefault();
        var t = titleInput.value.trim();
        if (!t) { titleInput.focus(); return; }
        addGroup(t, landInput.checked);
      }
    },
      h('label', { class: 'sr-only', for: 'newGroupTitle', text: 'Nombre del nuevo grupo' }),
      titleInput,
      h('label', { class: 'check' }, landInput, 'Horizontal (16:9)'),
      h('button', { class: 'btn btn-dark', type: 'submit' }, icon('plus'), 'Crear grupo')));

    var groups = groupsOf(cat.slug);
    if (!groups.length) root.appendChild(h('p', { class: 'empty', text: 'Esta categoría aún no tiene grupos. Crea el primero arriba.' }));
    groups.forEach(function (g, gi) { root.appendChild(renderGroup(g, gi, groups)); });
  }

  function renderGroup(g, gi, groups) {
    var titleId = 'gt-' + g.id;
    var title = h('input', {
      class: 'input', id: titleId, value: g.title, maxlength: '80', 'data-key': 'title-' + g.id,
      onchange: function () {
        var t = title.value.trim();
        if (!t) { title.value = g.title; return; }
        if (t !== g.title) updateGroup(g, { title: t }, 'Nombre guardado');
      },
      onkeydown: function (e) { if (e.key === 'Enter') { e.preventDefault(); title.blur(); } }
    });
    var land = h('input', {
      type: 'checkbox', checked: g.landscape, 'data-key': 'land-' + g.id,
      onchange: function () { updateGroup(g, { landscape: land.checked }); }
    });
    var hidden = g.items.filter(function (i) { return !i.visible; }).length;

    var head = h('div', { class: 'group-head' },
      h('label', { class: 'sr-only', for: titleId, text: 'Nombre del grupo' }),
      title,
      h('span', { class: 'meta', text: g.items.length + ' archivos' + (hidden ? ' · ' + hidden + ' ocultos' : '') }),
      h('label', { class: 'check' }, land, 'Horizontal'),
      h('div', { class: 'group-tools' },
        h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Subir grupo', title: 'Subir grupo', 'data-key': 'gup-' + g.id, disabled: gi === 0, onclick: function () { moveGroup(g, -1); } }, icon('arrow-up')),
        h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Bajar grupo', title: 'Bajar grupo', 'data-key': 'gdown-' + g.id, disabled: gi === groups.length - 1, onclick: function () { moveGroup(g, 1); } }, icon('arrow-down')),
        h('button', {
          class: 'btn btn-icon btn-danger', type: 'button', 'aria-label': 'Borrar grupo',
          title: g.items.length ? 'Vacía el grupo para poder borrarlo' : 'Borrar grupo',
          disabled: g.items.length > 0, onclick: function () { deleteGroup(g); }
        }, icon('trash-2'))));

    // Zona de subida
    var uploads = h('ul', { class: 'uploads', 'aria-live': 'polite' },
      (state.uploadLog[g.id] || []).map(function (u) {
        return h('li', null, h('span', { text: u.name }), h('span', { class: u.cls, text: u.text }));
      }));
    var fileInput = h('input', {
      type: 'file', multiple: true, accept: ALLOWED.join(','), id: 'up-' + g.id,
      onchange: function () { uploadFiles(g, fileInput.files, uploads); fileInput.value = ''; }
    });
    var drop = h('label', { class: 'drop', for: 'up-' + g.id },
      icon('upload'),
      h('span', null, 'Arrastra aquí imágenes o vídeos, o haz clic para elegirlos',
        h('small', { text: 'JPG, PNG, WEBP, GIF, MP4 o WEBM · máx. 50 MB por archivo' })),
      fileInput);
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
    });
    drop.addEventListener('drop', function (e) { uploadFiles(g, e.dataTransfer.files, uploads); });

    var grid = h('div', { class: 'items' });
    if (!g.items.length) grid.appendChild(h('p', { class: 'empty', text: 'Sin archivos. En la web aparecerá como "Próximamente".' }));
    g.items.forEach(function (item, ii) { grid.appendChild(renderItem(g, item, ii)); });

    return h('section', { class: 'group' + (g.landscape ? ' landscape' : ''), 'aria-label': g.title }, head, drop, uploads, grid);
  }

  function renderItem(g, item, ii) {
    var url = mediaUrl(item.path);
    var name = item.path.split('/').pop();
    var media = item.media_type === 'video'
      ? h('video', { src: url, muted: true, preload: 'metadata', playsinline: true, loop: true, 'aria-label': name,
          onmouseenter: function (e) { e.target.play().catch(function () {}); },
          onmouseleave: function (e) { e.target.pause(); } })
      : h('img', { src: url, alt: name, loading: 'lazy' });
    if (item.media_type === 'video') media.muted = true; // el atributo solo no basta para poder reproducir al pasar el ratón

    var siblings = state.groups.filter(function (x) { return x.category_slug === g.category_slug; });
    var others = state.groups.filter(function (x) { return x.category_slug !== g.category_slug; });
    var select = h('select', {
      'aria-label': 'Mover a otro grupo', 'data-key': 'move-' + item.id,
      onchange: function () { changeItemGroup(item, select.value); }
    },
      h('option', { value: '', text: 'Mover a…' }),
      siblings.filter(function (x) { return x.id !== g.id; }).map(function (x) { return h('option', { value: x.id, text: x.title }); }),
      others.length ? h('optgroup', { label: 'Otras categorías' }, others.map(function (x) {
        var c = state.categories.find(function (cc) { return cc.slug === x.category_slug; });
        return h('option', { value: x.id, text: (c ? c.title + ' › ' : '') + x.title });
      })) : null);

    return h('div', { class: 'item' + (item.visible ? '' : ' hidden-item') },
      h('div', { class: 'thumb' }, media,
        item.visible ? null : h('span', { class: 'badge', text: 'Oculto' }),
        item.media_type === 'video' ? h('span', { class: 'badge video', text: 'Vídeo' }) : null),
      h('div', { class: 'item-tools' },
        h('button', { class: 'btn', type: 'button', 'aria-label': 'Mover antes', title: 'Mover antes', 'data-key': 'prev-' + item.id, disabled: ii === 0, onclick: function () { moveItem(g, item, -1); } }, icon('arrow-left')),
        h('button', { class: 'btn', type: 'button', 'aria-label': 'Mover después', title: 'Mover después', 'data-key': 'next-' + item.id, disabled: ii === g.items.length - 1, onclick: function () { moveItem(g, item, 1); } }, icon('arrow-right')),
        h('button', {
          class: 'btn', type: 'button', 'data-key': 'vis-' + item.id,
          'aria-label': item.visible ? 'Ocultar en la web' : 'Mostrar en la web',
          title: item.visible ? 'Ocultar en la web' : 'Mostrar en la web',
          'aria-pressed': item.visible ? 'false' : 'true',
          onclick: function () { toggleItem(item); }
        }, icon(item.visible ? 'eye' : 'eye-off')),
        h('a', { class: 'btn', href: url, target: '_blank', rel: 'noopener', 'aria-label': 'Abrir archivo', title: 'Abrir archivo' }, icon('maximize-2')),
        h('button', { class: 'btn btn-danger', type: 'button', 'aria-label': 'Borrar', title: 'Borrar', onclick: function () { deleteItem(item); } }, icon('trash-2')),
        select));
  }

  // ---------- inicio ----------
  sb.auth.getSession().then(function (r) { onSession(r.data.session); });
  sb.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_OUT') { state.user = null; show('viewLogin'); }
    if (event === 'TOKEN_REFRESHED' && session) state.user = session.user;
  });
})();
