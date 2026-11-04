/* Fuente única de la galería para gallery.html y projects-detail.html.
 *
 * window.mdLoadGallery() -> Promise<{ [categoria]: { title, subtitle, groups: [{ title, landscape, items: [url] }] } }>
 *
 * Si assets/js/md-config.js tiene url + anonKey, lee de Supabase (tablas gallery_*).
 * Si no está configurado, o Supabase falla / tarda, usa window.MD_GALLERY (gallery-data.js).
 * Requiere cargar antes: md-config.js y gallery-data.js.
 */
(function () {
  var cfg = window.MD_SUPABASE || {};
  var base = (cfg.url || '').replace(/\/+$/, '');
  var key = cfg.anonKey || '';
  var bucket = cfg.bucket || 'gallery';
  var ALIASES = { 'flyer-eventos': 'flyers', 'flyers-animados': 'animaciones' };
  var TIMEOUT_MS = 6000;

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  window.mdEsc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  };

  window.mdIsVideo = function (src) {
    return /\.(mp4|webm|mov)(\?|#|$)/i.test(String(src));
  };

  // path en la tabla: ruta dentro del bucket ("flyers/night-clubs/123-foto.jpg"),
  // una ruta local del repo ("assets/images/...") o una URL completa.
  window.mdMediaUrl = function (path) {
    path = String(path || '');
    if (/^(https?:)?\/\//i.test(path) || path.indexOf('assets/') === 0) return path;
    return base + '/storage/v1/object/public/' + bucket + '/' +
      path.split('/').map(encodeURIComponent).join('/');
  };

  function withAliases(g) {
    Object.keys(ALIASES).forEach(function (a) {
      if (!g[a] && g[ALIASES[a]]) g[a] = g[ALIASES[a]];
    });
    return g;
  }

  function fromSupabase() {
    var q = 'select=slug,title,subtitle,sort,gallery_groups(title,landscape,sort,gallery_items(path,sort,visible))' +
      '&order=sort.asc' +
      '&gallery_groups.order=sort.asc' +
      '&gallery_groups.gallery_items.order=sort.asc' +
      '&gallery_groups.gallery_items.visible=eq.true';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);

    return fetch(base + '/rest/v1/gallery_categories?' + q, {
      headers: { apikey: key },
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (rows) {
      if (!rows || !rows.length) throw new Error('no hay categorías en Supabase');
      var out = {};
      rows.forEach(function (c) {
        out[c.slug] = {
          title: c.title,
          subtitle: c.subtitle || '',
          groups: (c.gallery_groups || []).map(function (g) {
            return {
              title: g.title,
              landscape: !!g.landscape,
              items: (g.gallery_items || []).map(function (i) { return window.mdMediaUrl(i.path); })
            };
          })
        };
      });
      return withAliases(out);
    }).finally(function () {
      if (timer) clearTimeout(timer);
    });
  }

  var cache = null;
  window.mdLoadGallery = function () {
    if (cache) return cache;
    var local = window.MD_GALLERY || {};
    if (!base || !key) {
      cache = Promise.resolve(local);
    } else {
      cache = fromSupabase().catch(function (e) {
        console.warn('[galeria] Supabase no disponible, uso datos locales:', e && e.message);
        return local;
      });
    }
    return cache;
  };
})();
