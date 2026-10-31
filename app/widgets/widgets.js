/* Frame Home widgets layout: a two-row widget strip, a tvOS-style dock and a personalise sheet.
   ES5 only. Navigation is spatial; animation uses transforms and opacity.
   Focus behaviour follows tvOS: lift (scale + deeper shadow), a lean toward the direction of travel,
   a slow sway with a specular sheen, press-in on OK, captions under the focused item, glass controls
   that turn white, an edge bump and soft interface sounds. Personal builds add SF Pro, SF Symbols
   and Apple app icons through window.FrameApple (see apple/manifest.js); public builds fall back. */
(function () {
  'use strict';
  var CFG = window.FrameWidgetsConfig || {}, D = window.FrameWidgetsData;
  var PREFS = 'cleanframe.widgets.v1';
  var C = 232, G = 36, S = C + G, PILL = 98, VIS = 1662, PEEK = 183, MAXOFF = 7 * S;
  var DOCK_W = 96, DOCK_GAP = 28, DOCK_PAD = 20, DOCK_FS = 1.12, STRIP_X = 129, STRIP_Y = 290;
  var A = window.FrameApple || null;
  /* Background gradients. A third item 'light' marks a pale one, so the wallpaper chrome turns dark over it. */
  var GRADIENTS = [
    ['rubi', 'Rubi'], ['oceano', 'Oceano'], ['aurora', 'Aurora'], ['entardecer', 'Entardecer'],
    ['lavanda', 'Lavanda'], ['floresta', 'Floresta'], ['esmeralda', 'Esmeralda'], ['safira', 'Safira'],
    ['cobre', 'Cobre'], ['grafite', 'Grafite'], ['carvao', 'Carvão'], ['espaco', 'Espaço'],
    ['abissal', 'Abissal'], ['meianoite', 'Meia-noite'], ['onix', 'Ônix'], ['breu', 'Breu'],
    ['neve', 'Neve', 1], ['prata', 'Prata', 1], ['ceu', 'Céu', 1], ['areia', 'Areia', 1], ['perola', 'Pérola', 1]
  ];
  /* Plain colours for the background (a soft vertical fall-off keeps them from looking flat on a TV). */
  var COLORS = [
    ['branco', 'Branco', '#F4F4F6', 1], ['nuvem', 'Nuvem', '#D4D9E0', 1], ['prata', 'Prata', '#AEB4BE', 1], ['areia', 'Areia', '#D9C7A0', 1],
    ['grafite', 'Grafite', '#1C1C1E'], ['ardosia', 'Ardósia', '#2C3440'], ['preto', 'Preto', '#000000'], ['marinho', 'Marinho', '#0B1F3A'],
    ['azul', 'Azul', '#0A3D91'], ['petroleo', 'Petróleo', '#0D4D4D'], ['verde', 'Verde', '#0F3D2E'], ['oliva', 'Oliva', '#3A3F1E'],
    ['roxo', 'Roxo', '#3B2A6B'], ['vinho', 'Vinho', '#4A1426'], ['terracota', 'Terracota', '#7A2E1A'], ['cafe', 'Café', '#3B2A20']
  ];
  function color(id) { var key = String(id || '').replace(/^color:/, ''); if (String(id || '').indexOf('color:') !== 0) return null; for (var i = 0; i < COLORS.length; i++) if (COLORS[i][0] === key) return COLORS[i]; return null; }
  /* Whether the chosen background is pale (so the date, captions and glass buttons switch to dark ink). */
  function lightBg(id) { var g = gradient(id), c = color(id); return !!(g && g[2] || c && c[3]); }
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    function c(v) { v = Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f); return (v < 16 ? '0' : '') + v.toString(16); }
    return '#' + c(r) + c(g) + c(b);
  }
  var DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  var MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  /* ---------- Icons (24-unit grid, stroke) ---------- */
  var P = {
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    cloud: '<path d="M17.5 19H8a5 5 0 1 1 1.2-9.86A6 6 0 0 1 20.5 12a3.5 3.5 0 0 1-3 7z"/>',
    partly: '<path d="M8 6.5a4 4 0 0 1 6.6 1.5"/><path d="M4 9.5H2.5M6 4.5 5 3.5M10 2.5V1"/><path d="M17.5 21H9a4.5 4.5 0 1 1 1-8.9A5.5 5.5 0 0 1 20.5 14.5 3.3 3.3 0 0 1 17.5 21z"/>',
    cloudmoon: '<path d="M14 3.5a5 5 0 0 0 6.5 6.5"/><path d="M17.5 21H9a4.5 4.5 0 1 1 1-8.9A5.5 5.5 0 0 1 20.5 14.5 3.3 3.3 0 0 1 17.5 21z"/>',
    fog: '<path d="M4 9h16M3 13h18M5 17h14"/>',
    drizzle: '<path d="M17.5 15H8a5 5 0 1 1 1.2-9.86A6 6 0 0 1 20.5 8a3.5 3.5 0 0 1-3 7z"/><path d="M9 18.5v1.5M13 18.5v1.5M17 18.5v1.5"/>',
    rain: '<path d="M17.5 15H8a5 5 0 1 1 1.2-9.86A6 6 0 0 1 20.5 8a3.5 3.5 0 0 1-3 7z"/><path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3"/>',
    snow: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
    storm: '<path d="M17.5 15H8a5 5 0 1 1 1.2-9.86A6 6 0 0 1 20.5 8a3.5 3.5 0 0 1-3 7z"/><path d="M13 15l-2.5 4h3L11 23"/>',
    note: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l4 6M21 9l-4 6"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.5 12.5a9.5 9.5 0 0 1 13 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><path d="M12 19.3h.01"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    art: '<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="7" y="8" width="10" height="8" rx="1"/>',
    audio: '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="7" r="1"/>',
    picture: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15l3.5-4 3 3 2-2 2.5 3"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="m9 3-.6 2.4-2 1.2L4 6l-2 3.5L3.8 11v2L2 14.5 4 18l2.4-.6 2 1.2L9 21h6l.6-2.4 2-1.2 2.4.6 2-3.5-1.8-1.5v-2L22 9.5 20 6l-2.4.6-2-1.2L15 3Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    apps: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>'
  };
  function sym(name) { return !!(A && A.symbols && A.symbols.indexOf(name) >= 0); }
  function sf(name, size, color) {
    return '<i class="wc-ico sf" style="width:' + size + 'px;height:' + size + 'px;-webkit-mask-image:url(apple/symbols/' + name + '.svg);' +
      'background-color:' + (color || 'currentColor') + '" aria-hidden="true"></i>';
  }
  function appleIcon(key) { return A && A.icons && (prefs && isDark() && A.icons[key + '-dark'] || A.icons[key]) || ''; }
  /* Small white service logo for the big cards (personal builds); public builds show the name in text. */
  function brandLogo(key, text, cls) {
    var src = A && A.brand && A.brand[key];
    return src ? '<img class="wc-logo ' + (cls || '') + '" src="' + esc(src) + '" alt="' + esc(text) + '">' : '<span class="wc-logo-text">' + esc(text) + '</span>';
  }
  function ico(name, size, color, width) {
    if (sym(name)) return sf(name, Math.round(size * 0.92), color);
    return '<svg class="wc-ico" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') +
      '" stroke-width="' + (width || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[name] + '</svg>';
  }
  function solid(name, size, color) {
    if (sym(name)) return sf(name, size, color);
    var paths = { prev: '<path d="M11 6v12L3 12z"/><path d="M20 6v12l-8-6z"/>', next: '<path d="M4 6v12l8-6z"/><path d="M13 6v12l8-6z"/>',
      play: '<path d="M7 4.5v15l13-7.5z"/>', pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
      half: '<circle cx="12" cy="12" r="9" fill="none" stroke="' + color + '" stroke-width="2.2"/><path d="M12 3a9 9 0 0 1 0 18z"/>',
      sundisc: '<circle cx="12" cy="12" r="4.4"/>' };
    return '<svg class="wc-ico" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + color + '" aria-hidden="true">' + paths[name] + '</svg>';
  }
  function sunIcon(size) {
    if (sym('sun')) return sf('sun', size, '#FFCC00');
    return '<svg class="wc-ico" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="#FFCC00"/>' +
      '<path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" stroke="#F2B705" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function two(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- State ---------- */
  var deps = null, root = null, strip = null, dockEl = null, dockBg = null, dockLabel = null, toastEl = null, sheetEl = null, folderEl = null, capEl = null;
  var cards = {}, targets = [], dockItems = [], resolved = {};
  var st = { zone: 'strip', focus: 'youtube', dock: 0, off: 0, adjust: false, newsIndex: 0, active: false, sheet: null, folder: null, toastTimer: 0, heroIndex: 0, plutoIndex: 0, stremioIndex: 0, lean: '', launching: false };
  var data = {}, timers = {}, prefs = loadPrefs();

  function loadPrefs() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(PREFS)) || {}; } catch (e) { p = {}; }
    if (!gradient(p.bg) && !photo(p.bg) && !color(p.bg) && !(p.bg === 'own' && CFG.wallpaperPhoto)) p.bg = 'rubi';
    // Appearance follows the sun by default (asked for: dark from sunset, light again at sunrise).
    if (p.themeV !== 2) { p.theme = 'auto'; p.themeV = 2; }
    if (p.theme !== 'light' && p.theme !== 'dark' && p.theme !== 'auto') p.theme = 'auto';
    delete p.dark;
    p.sound = p.sound !== false;
    return p;
  }
  /* Bundled CleanFrame photographs (assets/wallpapers/catalog.js) as backgrounds too. */
  function photos() { return window.CleanFrameWallpapers || []; }
  function photo(id) { var list = photos(), key = String(id || '').replace(/^photo:/, ''); if (String(id || '').indexOf('photo:') !== 0) return null; for (var i = 0; i < list.length; i++) if (list[i].id === key) return list[i]; return null; }
  /* Dark appearance: always, never, or from sunset to sunrise (the weather's day flag; 18h-6h before it loads). */
  function isDark() {
    if (prefs.theme === 'dark') return true;
    if (prefs.theme === 'light') return false;
    var w = data && data.weather, now = new Date(), h = now.getHours(), today = localDay(now), i, rise = null, set = null;
    if (w && w.sunrise && w.sunset) for (i = 0; i < w.sunrise.length; i++) if (String(w.sunrise[i]).slice(0, 10) === today) { rise = localTime(w.sunrise[i]); set = localTime(w.sunset[i]); }
    if (rise && set) return now < rise || now >= set;
    return w && w.day !== undefined && !w.error && !w.setup ? !w.day : h >= 18 || h < 6;
  }
  function localDay(d) { return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); }
  function localTime(iso) { // Open-Meteo gives local wall-clock times, e.g. 2026-10-28T05:31
    var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(String(iso));
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
  }
  function savePrefs() { try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch (e) { toast('Não foi possível salvar.'); } }
  function gradient(id) { for (var i = 0; i < GRADIENTS.length; i++) if (GRADIENTS[i][0] === id) return GRADIENTS[i]; return null; }
  function onTV() { return D && D.onTV(); }

  /* ---------- Layout ---------- */
  function cell(col, row, cols, rows) { cols = cols || 1; rows = rows || 1; return { x: col * S, y: row * S, w: cols * C + (cols - 1) * G, h: rows * C + (rows - 1) * G }; }
  var CARDS = [
    { id: 'youtube', at: cell(0, 0), cls: 'wc-app', app: 'youtube', ring: 60, fs: 1.08 },
    { id: 'weather', at: cell(1, 0), cls: 'ww', ring: 44 },
    { id: 'spotify', at: cell(0, 1, 2, 1), cls: 'wc-light ws', ring: 44 },
    { id: 'stremio', at: cell(2, 0, 2, 2), cls: 'wst', ring: 44 },
    { id: 'volume', at: { x: 4 * S, y: 0, w: PILL, h: C }, cls: 'wc-dim wp', ring: 59, fs: 1.06 },
    { id: 'bright', at: { x: 4 * S + PILL + G, y: 0, w: PILL, h: C }, cls: 'wc-dim wp wp-bright', ring: 59, fs: 1.06 },
    { id: 'globoplay', at: cell(5, 0), cls: 'wc-app', app: 'globoplay', ring: 60, fs: 1.08 },
    { id: 'hbo', at: cell(4, 1, 2, 1), cls: 'whb', ring: 44 },
    { id: 'netflix', at: cell(6, 0), cls: 'wc-app', app: 'netflix', ring: 60, fs: 1.08 },
    { id: 'pluto', at: cell(6, 1, 2, 1), cls: 'wpl', ring: 44 },
    { id: 'wifi', at: { x: 7 * S, y: 0, w: C, h: PILL }, cls: 'wc-glass wn', ring: 59, fs: 1.05 },
    { id: 'theme', at: { x: 7 * S, y: PILL + G, w: C, h: PILL }, cls: 'wc-glass wtheme', ring: 49, fs: 1.05 },
    { id: 'mercadoplay', at: cell(8, 0), cls: 'wc-app', app: 'mercadoplay', ring: 60, fs: 1.08 },
    { id: 'tv', at: cell(8, 1), cls: 'wc-dim wt', ring: 60, group: true },
    { id: 'news', at: cell(9, 0, 2, 2), cls: 'wc-light wnw', ring: 44 },
    { id: 'folder', at: cell(11, 0), cls: 'wc-folder', ring: 44, fs: 1.05 },
    { fs: 1.08, id: 'settings', at: cell(12, 0), cls: 'wc-glass wk', ring: 60 },
    { fs: 1.08, id: 'browser', at: cell(11, 1), cls: 'wc-glass wk', ring: 60 },
    { fs: 1.08, id: 'allapps', at: cell(12, 1), cls: 'wc-glass wk', ring: 60 }
  ];
  function focusScale(c) { return c.fs || Math.max(1.03, Math.min(1.08, (c.at.w + 24) / c.at.w)); }
  var TV_DOTS = [['tv-art', 'art', 24, 24, 'is-art', 'Modo Arte'], ['tv-audio', 'audio', 124, 24, 'is-on', 'Saída de áudio'],
    ['tv-picture', 'picture', 24, 124, '', 'Modo de imagem'], ['tv-timer', 'timer', 124, 124, '', 'Timer']];

  function build() {
    var html = '<div class="wh-bg" id="whBgA"></div><div class="wh-bg is-off" id="whBgB"></div><div class="wh-dim"></div>' +
      '<div class="wh-top"><div class="wh-date"><span class="wh-small" id="whDay"></span><span class="wh-big" id="whDate"></span></div>' +
      '<div class="wh-greet"><span class="wh-small" id="whHello"></span><span class="wh-big" id="whTime"></span></div><div class="wh-avatar" id="whAvatar"></div></div>' +
      '<div class="wh-strip" id="whStrip"></div><div class="wh-dock" id="whDock"><div class="wh-dock-bg" id="whDockBg"></div><div class="wh-dock-label" id="whDockLabel"></div></div>' +
      '<div class="wh-cap" id="whCap"></div><div class="wh-toast" id="whToast"><span></span></div><div class="wh-sheet" id="whSheet" role="dialog" aria-label="Personalizar"></div>' +
      '<div class="wh-folder" id="whFolder" role="dialog" aria-label="Apps"></div>' +
      '<div class="wh-veil"></div>';
    root.innerHTML = html;
    strip = byId('whStrip'); dockEl = byId('whDock'); dockBg = byId('whDockBg'); dockLabel = byId('whDockLabel'); toastEl = byId('whToast'); sheetEl = byId('whSheet'); folderEl = byId('whFolder'); capEl = byId('whCap');
    if (A && A.fonts) root.setAttribute('data-sf', '1');
    CARDS.forEach(function (c) {
      var el = document.createElement('div');
      el.className = 'wc ' + c.cls;
      el.setAttribute('data-card', c.id);
      el.style.left = c.at.x + 'px'; el.style.top = c.at.y + 'px'; el.style.width = c.at.w + 'px'; el.style.height = c.at.h + 'px';
      var fs = focusScale(c);
      el.style.setProperty('--fs', String(fs));
      el.style.setProperty('--fsp', String(Math.round(fs * 0.95 * 1000) / 1000));
      el.innerHTML = '<div class="wc-tilt"><div class="wc-body"></div><div class="wc-gloss"></div></div>';
      strip.appendChild(el);
      cards[c.id] = { def: c, el: el, tilt: el.firstChild, body: el.firstChild.firstChild, html: null };
      if (!c.group) targets.push({ id: c.id, x: c.at.x, y: c.at.y, w: c.at.w, h: c.at.h, el: el });
    });
    TV_DOTS.forEach(function (d) {
      var dot = document.createElement('div'), base = cards.tv.def.at;
      dot.className = 'wt-dot ' + d[4]; dot.setAttribute('data-target', d[0]); dot.setAttribute('aria-label', d[5]);
      dot.style.left = d[2] + 'px'; dot.style.top = d[3] + 'px';
      dot.innerHTML = '<div class="wc-tilt"><div class="wt-glyph">' + ico(d[1], 36) + '</div><div class="wc-gloss"></div></div>';
      cards.tv.el.appendChild(dot);
      targets.push({ id: d[0], x: base.x + d[2], y: base.y + d[3], w: 84, h: 84, el: dot });
    });
    (CFG.dock || []).forEach(function (key, i) {
      var el = document.createElement('div');
      el.className = 'wd'; el.setAttribute('data-dock', String(i));
      el.innerHTML = '<div class="wc-tilt"><div class="wd-tile"></div><div class="wc-gloss"></div></div>';
      el.style.left = (dockLeft(i) - dockWidth() / 2) + 'px';
      dockEl.appendChild(el);
      dockItems.push({ key: key, el: el, tilt: el.firstChild, tile: el.firstChild.firstChild });
    });
    root.addEventListener('click', onClick);
  }
  function byId(id) { return document.getElementById(id); }

  /* ---------- Apps ---------- */
  function appInfo(key) {
    var conf = CFG.apps && CFG.apps[key] || { name: key }, r = resolved[key];
    // Prefer the resolved app, but fall back to the first configured id (some installed apps, e.g. Globoplay,
    // are filtered out of the visible app list yet still launch fine by their id).
    return { key: key, name: conf.name, brand: conf.brand || '', appId: r ? r.appId : (conf.ids || [])[0] || '', icon: r ? r.icon : '' };
  }
  function resolveApps() {
    if (!onTV() || !window.FrameDevice) return;
    window.FrameDevice.apps(function (err, list) {
      if (err || !list) return;
      Object.keys(CFG.apps || {}).forEach(function (key) {
        var conf = CFG.apps[key], hit = null, re = new RegExp(conf.match || ('^' + conf.name + '$'), 'i');
        list.forEach(function (a) { if (!hit && (conf.ids || []).indexOf(a.appId) >= 0) hit = a; });
        list.forEach(function (a) { if (!hit && re.test(a.name)) hit = a; });
        if (hit) resolved[key] = { appId: hit.appId, icon: hit.icon || '' };
      });
      renderApps(); renderDock();
    });
  }
  /* Apple icon rule.
     Strip tiles (complete): the Apple TV icon with its horizontal logo, squared by fitting it to the width and
     extending its own background, as background + logo layers that separate in depth while focused.
     Dock: the App Store (iPadOS) icon. Then the TV's own icon, then the brand mark.
     Both get the same subtle iOS 26 rendering in CSS (hairline light rim, soft top light). */
  function hasAppleIcon(key, big) { return !!(big && appleIcon(key + '-tvbg') || appleIcon(key)); }
  function tileInner(info, big) {
    var mark = info.brand ? 'assets/icons/' + info.brand + '.svg' : '', back = appleIcon(info.key + '-tvbg'), front = appleIcon(info.key + '-tvfg'), apple = appleIcon(info.key);
    if (big && back && front) return '<img class="wc-icon" src="' + esc(back) + '" alt=""><img class="wc-icon wc-fg" src="' + esc(front) + '" alt="">';
    if (apple) return '<img class="' + (big ? 'wc-icon' : 'wd-full') + '" src="' + esc(apple) + '" alt="">';
    if (info.icon) return '<img class="' + (big ? 'wc-icon' : 'wd-tv') + '" src="' + esc(info.icon) + '" alt="">';
    if (big) return (mark ? '<div class="wc-mark"><img src="' + mark + '" alt=""></div>' : '<div class="wc-initial">' + esc(info.name.charAt(0)) + '</div>');
    return mark ? '<img class="wd-mark" src="' + mark + '" alt="">' : '<span class="wd-word">' + esc(info.name) + '</span>';
  }
  /* tvOS-style launch: the focused item pushes in while the screen fades, then the app opens. */
  function launch(key) {
    var info = appInfo(key);
    if (!info.appId) { toast(info.name + ' não foi encontrado na TV.'); return; }
    st.launching = true; root.className += ' is-launch';
    var conf = CFG.apps && CFG.apps[key] || {}, deep = conf.live || '';
    setTimeout(function () { deps.launch(info.appId, info.name, deep); }, 300);
    setTimeout(function () { st.launching = false; root.className = root.className.replace(/ is-launch/g, ''); }, 1600);
  }

  /* ---------- Rendering ---------- */
  var STATE_CLS = / is-focus| is-adjust| is-press| lean-\w+| bump-\w+/g;
  function setCls(el, base) { var keep = el.className.match(STATE_CLS); el.className = base + (keep ? keep.join('') : ''); }
  function setBody(id, html) { var c = cards[id]; if (c.html === html) return; c.html = html; c.body.innerHTML = html; fadeImages(c.body); }
  function fadeImages(scope) {
    var imgs = scope.querySelectorAll('img.wc-img:not(.wc-hero-img)');
    Array.prototype.forEach.call(imgs, function (im) {
      if (im.complete && im.naturalWidth) { im.className += ' is-ready'; return; }
      im.addEventListener('load', function () { im.className += ' is-ready'; });
      im.addEventListener('error', function () { im.style.display = 'none'; });
    });
  }
  function renderApps() {
    ['youtube', 'globoplay', 'netflix', 'mercadoplay'].forEach(function (key) {
      var info = appInfo(key), c = cards[key];
      setCls(c.el, 'wc wc-app b-' + key + (hasAppleIcon(key, true) ? ' has-art' : ''));
      c.el.setAttribute('aria-label', info.name);
      setBody(key, tileInner(info, true));
    });
    // Shortcuts: Apple artwork when there is one (Alexa icon, tvOS Settings), otherwise a glass tile with an SF Symbol.
    [['settings', 'gear', 'Personalizar', ''], ['browser', 'globe', 'Navegador', ''], ['allapps', 'apps', 'Todos os apps', '']].forEach(function (k) {
      var art = k[3] && appleIcon(k[3]);
      cards[k[0]].el.setAttribute('aria-label', k[2]);
      setCls(cards[k[0]].el, 'wc wk ' + (art ? 'has-art' : 'wc-glass'));
      setBody(k[0], art ? '<img class="wc-icon" src="' + esc(art) + '" alt="">' : '<div class="wk-in">' + ico(k[1], 64) + '</div>');
    });
  }
  function demo() { return !onTV(); }
  function val(name) { var v = data[name]; return v && (v.error || v.device || v.setup) ? null : v; }
  var SKY = { sun: 'clear', moon: 'clearnight', partly: 'partly', cloudmoon: 'partlynight', cloud: 'cloud',
    fog: 'fog', drizzle: 'rain', rain: 'rain', snow: 'snow', storm: 'storm' };
  function renderWeather() {
    var w = val('weather') || (demo() ? { label: (CFG.location || {}).label, temp: 21, icon: 'moon', text: 'Céu limpo', max: 26, min: 18, day: false } : null);
    if (!w) { setCls(cards.weather.el, 'wc ww'); setBody('weather', '<div class="wc-pad"><div class="ww-city">' + esc((CFG.location || {}).label) + '</div><div class="wc-hint" style="margin-top:12px">Buscando a previsão…</div></div>'); return; }
    var night = w.day === false || /night/.test(SKY[w.icon] || '');
    setCls(cards.weather.el, 'wc ww sky-' + (SKY[w.icon] || 'clear') + (night ? ' is-night' : ''));
    setBody('weather', '<div class="wc-pad"><div class="ww-city">' + esc(w.label) + '</div><div class="ww-temp">' + w.temp + '°</div>' +
      '<div class="ww-foot">' + ico(w.icon, 26, '#fff') + '<div class="ww-cond">' + esc(w.text) + '</div><div class="ww-range">Máx ' + w.max + '° Mín ' + w.min + '°</div></div></div>');
  }
  function clock(ms) { if (ms === undefined || ms === null || isNaN(ms)) return '-:--'; var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + two(s % 60); }
  // Live playback position: advance the polled progress by the time elapsed since it was fetched, so the
  // bar moves in real time between the 15s polls instead of jumping.
  function spotifyProgress(s) {
    if (!s || !s.duration) return 0;
    var p = s.progress || 0;
    if (s.playing && s.at) p += Date.now() - s.at;
    return Math.max(0, Math.min(s.duration, p));
  }
  function tickSpotify() {
    clearTimeout(timers.spot);
    var s = data.spotify, c = cards.spotify;
    if (st.active && s && s.playing && s.duration > 0 && c && c.body) {
      var prog = spotifyProgress(s), bar = c.body.querySelector('.ws-bar i');
      if (bar) bar.style.width = Math.round(prog / s.duration * 100) + '%';
      var t = c.body.querySelectorAll('.ws-times span');
      if (t && t.length === 2) { t[0].textContent = clock(prog); t[1].textContent = '-' + clock(s.duration - prog); }
    }
    timers.spot = setTimeout(tickSpotify, 1000);
  }
  function renderSpotify() {
    var s = data.spotify, ink = isDark() ? '#fff' : '#1D1D1F';
    if (s && s.setup && !demo()) { setBody('spotify', '<div class="ws-art"></div><div class="ws-note">' + spotifyMark() + '</div><div class="ws-head"><div class="wc-label">Spotify</div><div class="wc-title">Conecte sua conta</div><div class="ws-artist" style="color:inherit;opacity:.6">OK abre o Spotify</div></div>'); return; }
    if (!s || s.setup || s.error) s = s && !s.setup && !s.error ? s : { label: 'TOCADO RECENTEMENTE', title: 'Nome da faixa', artist: 'Artista', playing: false, art: '', progress: 78000, duration: 212000 };
    var art = s.art ? '<img class="wc-img" src="' + esc(s.art) + '" alt="">' : '';
    var prog = spotifyProgress(s);
    var bar = s.duration > 0 ? '<div class="ws-bar"><i style="width:' + Math.round(Math.max(0, Math.min(1, prog / s.duration)) * 100) + '%"></i></div>' +
      '<div class="ws-times"><span>' + clock(prog) + '</span><span>-' + clock(s.duration - prog) + '</span></div>' : '<div class="ws-foot">' + esc(s.label) + '</div>';
    setBody('spotify', '<div class="ws-art">' + art + '</div><div class="ws-note">' + spotifyMark() + '</div>' +
      '<div class="ws-head"><div class="wc-title">' + esc(s.title) + '</div><div class="ws-artist">' + esc(s.artist) + '</div></div>' +
      '<div class="ws-controls">' + solid('prev', 24, ink) + '<span class="ws-play">' + solid(s.playing ? 'pause' : 'play', 30, ink) + '</span>' + solid('next', 24, ink) + '</div>' + bar);
  }
  function spotifyMark() { return A && A.brand && A.brand.spotify ? '<img class="ws-logo" src="' + esc(A.brand.spotify) + '" alt="Spotify">' : ico('note', 30, '#1DB954', 2); }
  function heroCard(id, brand, label, title, sub, image, progress, extra) {
    return (image ? '<img class="wc-img" src="' + esc(image) + '" alt="">' : '<div class="wc-shade-b" style="background:radial-gradient(70% 80% at 70% 30%,#1F4A55 0%,rgba(31,74,85,0) 70%),linear-gradient(160deg,#121A20,#07090C)"></div>') +
      '<div class="wc-shade-b"></div><div class="wc-brand">' + brandLogo(id, brand, id === 'stremio' ? 'is-mark' : '') + (id === 'stremio' && A && A.brand && A.brand.stremio ? '<span class="wc-logo-word">Stremio</span>' : '') + '</div>' +
      '<div style="position:absolute;left:30px;right:30px;bottom:30px"><div class="wc-dark-label">' + esc(label) + '</div>' +
      '<div style="font-size:44px;font-weight:800;line-height:1.04;letter-spacing:-1px;margin-top:8px">' + esc(title) + '</div>' +
      '<div style="font-size:18px;font-weight:500;color:rgba(255,255,255,.8);margin-top:8px">' + esc(sub) + '</div>' +
      (progress !== null ? '<div class="wc-bar" style="margin-top:12px"><i style="width:' + Math.round(progress * 100) + '%"></i></div>' : '') + (extra || '') + '</div>';
  }
  function renderStremio() {
    var s = data.stremio, c = cards.stremio, dc = data.discover, slots = [], item;
    if (s && s.setup && !demo()) { setBody('stremio', heroCard('stremio', 'Stremio', 'Continuar assistindo', 'Conecte o Stremio', 'OK abre o app · veja docs/widgets.md', '', null)); return; }
    if (s && s.length) s.forEach(function (x) { slots.push({ label: 'Continuar assistindo', title: x.title, sub: x.episode + (x.left ? ' · faltam ' + x.left + ' min' : ''), image: x.image, progress: x.progress }); });
    if (dc && dc.newSeasons) dc.newSeasons.forEach(function (x) { slots.push({ label: x.label, title: x.title, sub: x.sub, image: x.image, progress: null }); });
    if (!slots.length) slots.push(s === null ? { label: 'Continuar assistindo', title: 'Nada em andamento', sub: 'OK abre o Stremio', image: '', progress: null } : { label: 'Continuar assistindo', title: 'Nome da série', sub: 'T2 · E5 · faltam 24 min', image: '', progress: 0.64 });
    slots = slots.slice(0, 10);
    item = slots[st.stremioIndex % slots.length];
    var many = slots.length > 1;
    function paint() {
      var prev = c.shownImg && c.shownImg !== item.image ? '<img class="wc-img is-ready" src="' + esc(c.shownImg) + '" alt="">' : '';
      var cur = item.image ? '<img class="wc-img wc-hero-img' + (prev ? '' : ' is-ready') + '" src="' + esc(item.image) + '" alt="">' : '';
      var base = cur || prev ? prev + cur : '<div class="wc-shade-b" style="background:radial-gradient(70% 80% at 70% 30%,#1F4A55 0%,rgba(31,74,85,0) 70%),linear-gradient(160deg,#121A20,#07090C)"></div>';
      var dots = many ? '<div class="wnw-dots" style="left:auto;right:30px;top:34px;bottom:auto">' + slots.slice(0, 8).map(function (_, i) { return '<i' + (i === st.stremioIndex % slots.length ? ' class="is-on"' : '') + '></i>'; }).join('') + '</div>' : '';
      setBody('stremio', base + '<div class="wc-shade-b"></div>' +
        '<div class="wc-brand">' + brandLogo('stremio', 'Stremio', 'is-mark') + (A && A.brand && A.brand.stremio ? '<span class="wc-logo-word">Stremio</span>' : '') + '</div>' + dots +
        '<div style="position:absolute;left:30px;right:30px;bottom:30px"><div class="wc-dark-label">' + esc(item.label) + '</div>' +
        '<div style="font-size:44px;font-weight:800;line-height:1.04;letter-spacing:-1px;margin-top:8px">' + esc(item.title) + '</div>' +
        '<div style="font-size:18px;font-weight:500;color:rgba(255,255,255,.8);margin-top:8px">' + esc(item.sub) + '</div>' +
        (item.progress !== null && item.progress !== undefined ? '<div class="wc-bar" style="margin-top:12px"><i style="width:' + Math.round(item.progress * 100) + '%"></i></div>' : '') + '</div>');
      if (prev) { var fresh = c.body.querySelector('.wc-hero-img'); if (fresh) { void fresh.offsetWidth; fresh.className += ' is-ready'; } }
      c.shownImg = item.image || c.shownImg;
    }
    function safePaint() { try { paint(); } catch (e) { setBody('stremio', heroCard('stremio', 'Stremio', 'Continuar assistindo', item && item.title || 'Stremio', item && item.sub || '', '', item && typeof item.progress === 'number' ? item.progress : null)); } }
    // First time (or no image / same image): paint now so the card is never blank. For a later swap,
    // decode the new backdrop off the animation path first, then paint — the old image stays until it's ready.
    if (!c.shownImg || !item.image || item.image === c.shownImg) { safePaint(); return; }
    var pre = new Image(), done = false;
    function fin() { if (done) return; done = true; safePaint(); }
    pre.onerror = fin;
    pre.onload = function () { if (pre.decode) pre.decode().then(fin, fin); else fin(); };
    pre.src = item.image;
    setTimeout(fin, 4000);
  }
  function renderHbo() {
    var list = data.tmdb, dc = data.discover, c = cards.hbo, slots = [], item;
    if (list && list.setup && !demo()) { slots.push({ label: 'HBO Max', title: 'HBO Max', sub: 'OK abre o app', image: '' }); }
    else {
      if (list && list.length) list.forEach(function (x) { slots.push({ label: 'Em alta', title: x.title, sub: x.kind + (x.year ? ' · ' + x.year : ''), image: x.image }); });
      if (dc && dc.recommended) dc.recommended.forEach(function (x) { slots.push({ label: 'Pra você', title: x.title, sub: x.sub ? 'Série · ' + x.sub : 'Série', image: x.image }); });
      if (!slots.length) slots.push({ label: 'Em alta', title: 'Nome do título', sub: 'Série · 2026', image: '' });
    }
    slots = slots.slice(0, 12);
    item = slots[st.heroIndex % slots.length];
    function paint() {
      var prev = c.shownImg && c.shownImg !== item.image ? '<img class="wc-img is-ready" src="' + esc(c.shownImg) + '" alt="">' : '';
      var cur = item.image ? '<img class="wc-img wc-hero-img' + (prev ? '' : ' is-ready') + '" src="' + esc(item.image) + '" alt="">' : '';
      setBody('hbo', (cur || prev ? prev + cur : '<div class="wc-shade-l" style="background:radial-gradient(70% 90% at 75% 30%,#2C3A66 0%,rgba(44,58,102,0) 70%),linear-gradient(160deg,#161A2A,#08090F)"></div>') +
        '<div class="wc-shade-l"></div><div class="wc-brand" style="left:26px;top:22px">' + brandLogo('hbomax', 'HBO Max', 'is-hbo') + '</div>' +
        '<div class="wc-hero-text"><div class="wc-dark-label" style="font-size:13px">' + esc(item.label) + '</div>' +
        '<div style="font-size:28px;font-weight:800;letter-spacing:-.5px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:330px">' + esc(item.title) + '</div>' +
        '<div style="font-size:16px;font-weight:500;color:rgba(255,255,255,.78);margin-top:4px">' + esc(item.sub) + '</div></div>');
      if (prev) {
        var fresh = c.body.querySelector('.wc-hero-img');
        if (fresh) { void fresh.offsetWidth; fresh.className += ' is-ready'; }
      }
      c.shownImg = item.image || c.shownImg;
    }
    if (!item.image || item.image === c.shownImg) { paint(); return; }
    var pre = new Image(), done = false;
    function fin() { if (done) return; done = true; paint(); }
    pre.onerror = fin;
    pre.onload = function () { if (pre.decode) pre.decode().then(fin, fin); else fin(); }; // decode off the animation path, then swap
    pre.src = item.image;
    setTimeout(fin, 4000);
  }
  function renderPluto() {
    var list = val('pluto'), p, pct = 0.42, many = 0;
    if (list && list.length) { many = list.length; p = list[st.plutoIndex % list.length]; }
    else p = (demo() || !data.plutoTried ? { channel: 'Nome do canal', title: 'Nome do programa', until: '00:30', start: 0, stop: 0, logo: '' } : null);
    if (!p) { setBody('pluto', '<div class="wc-pad" style="background:none"><div class="wc-dark-label" style="font-size:14px;color:rgba(255,255,255,.72)">Pluto TV</div><div class="wc-title" style="margin-top:40px">TV ao vivo e grátis</div><div class="wc-sub" style="color:rgba(255,255,255,.7)">OK abre o Pluto TV</div></div>'); return; }
    if (p.stop > p.start) pct = Math.max(0, Math.min(1, (Date.now() - p.start) / (p.stop - p.start)));
    setBody('pluto', '<div class="wc-pad"><div style="font-size:14px;font-weight:600;letter-spacing:.7px;color:rgba(255,255,255,.72);height:24px">' + brandLogo('pluto', 'PLUTO TV', 'is-pluto') +
      '<span style="float:right;color:#FFD60A;font-size:13px;font-weight:700"><span style="display:inline-block;width:8px;height:8px;border-radius:4px;background:#FF453A;margin-right:7px"></span>AO VIVO</span></div>' +
      '<div style="position:absolute;left:0;right:0;top:56px;height:72px"><div style="position:absolute;left:0;top:0;width:72px;height:72px;border-radius:16px;background:#3A3A42;overflow:hidden">' +
      (p.logo ? '<img class="wc-img" src="' + esc(p.logo) + '" alt="" style="object-fit:contain">' : '') + '</div>' +
      '<div style="position:absolute;left:90px;right:0;top:10px"><div class="wc-title">' + esc(p.title) + '</div><div class="wc-sub" style="color:rgba(255,255,255,.7)">' + esc(p.channel) + ' · até ' + esc(p.until) + '</div></div></div>' +
      (many > 1 ? '<div class="wnw-dots" style="left:auto;right:0;top:auto;bottom:26px">' + list.slice(0, 8).map(function (_, i) { return '<i' + (i === st.plutoIndex % many ? ' class="is-on"' : '') + '></i>'; }).join('') + '</div>' : '') +
      '<div class="wc-bar" style="position:absolute;left:0;right:0;bottom:0;background:rgba(255,255,255,.18)"><i style="width:' + Math.round(pct * 100) + '%;background:#FFD60A"></i></div></div>');
  }
  function renderPills() {
    var v = data.volume, known = v && typeof v.level === 'number' && !isNaN(v.level), level = known ? Math.max(0, Math.min(100, v.level)) : demo() ? 58 : 0;
    var muted = !!(v && (v.muted || (known && level === 0)));
    // TV volumes live low (5-30); the bar shows them on a 0-50 scale so small steps are visible.
    var fill = muted ? 0 : Math.min(100, Math.round(level * 2)), dark = isDark(), onFill = fill > 30 && !muted;
    // The icon sits over the fill (one tone) or the empty track (the other); the fill is light in dark mode
    // and dark in light mode, so the icon colour flips with the theme to stay legible.
    var vIcon = dark ? (onFill ? '#1D1D1F' : '#fff') : (onFill ? '#fff' : '#1D1D1F');
    setBody('volume', '<div class="wp-level" style="height:' + fill + '%"></div><div class="wp-value">' + (muted ? '0' : known || demo() ? level : '–') + '</div><div class="wp-icon">' + ico(muted ? 'mute' : 'speaker', 40, vIcon, 1.9) + '</div>');
    var pm = data.picture, modes = pm && pm.modes || [], idx = pm ? modes.indexOf(pm.mode) : -1, h = idx < 0 ? 40 : Math.round(35 + 50 * idx / Math.max(1, modes.length - 1));
    setBody('bright', '<div class="wp-level" style="height:' + h + '%"></div><div class="wp-icon">' + sunIcon(44) + '</div>');
  }
  function renderNet() {
    var w = val('wifi') || (demo() ? { on: true, ssid: 'Nome da rede' } : { on: false, ssid: '' });
    setBody('wifi', '<div class="wn-dot' + (w.on ? '' : ' is-off') + '">' + ico('wifi', 36, '#fff') + '</div><div class="wn-text"><div class="wc-sub">Wi-Fi</div><div class="wc-title">' + esc(w.on ? w.ssid || 'Conectado' : 'Sem conexão') + '</div></div>');
    setCls(cards.theme.el, 'wc wc-glass wtheme');
    setBody('theme', '<div class="wn-dot wtheme-dot">' + solid('half', 36, '#fff') + '</div><div class="wn-text"><div class="wc-sub">Aparência</div><div class="wc-title">' + (isDark() ? 'Escura' : 'Clara') + '</div></div>');
  }
  /* g1: the lead story's photo with its headline, cycling through the stories that have photos
     (preloaded, then cross-faded); the next two headlines are listed below. */
  function renderNews() {
    var list = val('news') || (demo() ? [{ title: 'Manchete principal do dia, em até duas linhas no máximo', when: 'há 20 min', image: '' }, { title: 'Segunda manchete', when: 'há 1 h' }, { title: 'Terceira manchete', when: 'há 2 h' }, { title: 'Quarta manchete', when: 'há 3 h' }] : []);
    var c = cards.news;
    if (!list.length) { setBody('news', '<div class="wc-pad" style="left:30px;right:30px;top:28px"><div class="wc-label">Manchetes · g1</div><div class="wc-hint" style="margin-top:12px">Carregando notícias…</div></div>'); return; }
    var pics = list.filter(function (n) { return n.image; }), lead = pics.length ? pics[st.newsIndex % pics.length] : list[0];
    var rest = list.filter(function (n) { return n !== lead; }).slice(0, 2);
    function paint() {
      var prev = c.shownImg && c.shownImg !== lead.image ? '<img class="wc-img is-ready" src="' + esc(c.shownImg) + '" alt="">' : '';
      var cur = lead.image ? '<img class="wc-img wc-hero-img' + (prev ? '' : ' is-ready') + '" src="' + esc(lead.image) + '" alt="">' : '<div class="wnw-noimg"></div>';
      var html = '<div class="wnw-lead">' + prev + cur + '<div class="wc-shade-b"></div><div class="wnw-badge">g1</div>' +
        '<div class="wnw-lead-text"><div class="wnw-title">' + esc(lead.title) + '</div><div class="wnw-when is-light">' + esc(lead.when) + '</div></div>' +
        (pics.length > 1 ? '<div class="wnw-dots">' + pics.slice(0, 6).map(function (n) { return '<i' + (n === lead ? ' class="is-on"' : '') + '></i>'; }).join('') + '</div>' : '') + '</div><div class="wc-pad wnw-list">';
      rest.forEach(function (n) { html += '<div class="wnw-item"><div class="wnw-title">' + esc(n.title) + '</div><div class="wnw-when">' + esc(n.when) + '</div></div>'; });
      setBody('news', html + '</div>');
      if (prev) { var fresh = c.body.querySelector('.wc-hero-img'); if (fresh) { void fresh.offsetWidth; fresh.className += ' is-ready'; } }
      if (lead.image) c.shownImg = lead.image;
    }
    if (!lead.image || lead.image === c.shownImg) { paint(); return; }
    var pre = new Image(), done = false;
    function fin() { if (done) return; done = true; paint(); }
    pre.onerror = fin;
    pre.onload = function () { if (pre.decode) pre.decode().then(fin, fin); else fin(); }; // decode off the animation path, then swap
    pre.src = lead.image;
    setTimeout(fin, 4000);
  }
  function renderTop() {
    var d = new Date(), h = d.getHours(), hello = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    byId('whDay').textContent = DAYS[d.getDay()];
    byId('whDate').textContent = d.getDate() + ' de ' + MONTHS[d.getMonth()];
    byId('whHello').textContent = hello + (CFG.name ? ', ' + CFG.name : '');
    byId('whTime').textContent = two(h) + ':' + two(d.getMinutes());
    var av = byId('whAvatar'), want = CFG.profilePhoto ? '<img src="' + esc(CFG.profilePhoto) + '" alt="">' : esc((CFG.name || '·').charAt(0));
    if (av._html !== want && !av._failed) {
      av._html = want; av.innerHTML = want;
      var im = av.getElementsByTagName('img')[0];
      if (im) im.addEventListener('error', function () { av._failed = true; av.innerHTML = esc((CFG.name || '·').charAt(0)); });
    }
  }
  function renderBackground() {
    var a = byId('whBgA'), b = byId('whBgB'), id = st.sheet && st.sheet.preview || prefs.bg, front = a.className.indexOf('is-off') < 0 ? a : b, back = front === a ? b : a;
    if (front._g === id) return;
    if (!front._g) { paintBg(front, id); return; }
    paintBg(back, id);
    front.className += ' is-off';
  }
  function paintBg(el, id) {
    var p = photo(id), col = color(id), src = p ? p.src : id === 'own' ? CFG.wallpaperPhoto : '';
    el._g = id;
    el.className = 'wh-bg' + (src ? ' is-photo' : col ? '' : ' g-' + id);
    el.style.backgroundImage = src ? 'url("' + src + '")' : col ? 'linear-gradient(180deg,' + shade(col[2], 0.1) + ' 0%,' + col[2] + ' 55%,' + shade(col[2], -0.35) + ' 100%)' : '';
  }
  function renderAll() {
    renderTop(); renderBackground(); renderApps(); renderWeather(); renderSpotify(); renderStremio(); renderHbo(); renderPluto(); renderPills(); renderNet(); renderNews(); renderFolder(); renderDock();
    var bg = st.sheet && st.sheet.preview || prefs.bg, bgPhoto = !!(photo(bg) || bg === 'own');
    root.className = 'wh' + (isDark() ? ' is-dark' : '') + (bgPhoto ? ' on-photo' : '') + (!bgPhoto && lightBg(bg) ? ' on-light' : '') + (st.sheet ? ' has-sheet' : '') + (st.folder ? ' has-folder' : '') + (st.launching ? ' is-launch' : '');
    renderFocus(); renderSheet(); renderFolderSheet();
  }

  /* ---------- Focus, scrolling and dock magnification ---------- */
  function target(id) { for (var i = 0; i < targets.length; i++) if (targets[i].id === id) return targets[i]; return targets[0]; }
  function restart(el, cls) {
    var family = cls === 'is-press' ? 'is-press' : cls.split('-')[0] + '-\\w+';
    el.className = el.className.replace(new RegExp(' ' + family, 'g'), '');
    void el.offsetWidth; // restart the CSS animation
    el.className += ' ' + cls;
  }
  function renderFocus() {
    targets.forEach(function (t) {
      var on = st.zone === 'strip' && !st.sheet && t.id === st.focus;
      var cls = t.el.className.replace(/ is-focus| is-adjust/g, '');
      if (!on) cls = cls.replace(/ lean-\w+| is-press| bump-\w+/g, '');
      var want = cls + (on ? ' is-focus' : '') + (on && st.adjust ? ' is-adjust' : '');
      if (t.el.className !== want) t.el.className = want;
    });
    st.lean = '';
    var shift = 'translate3d(' + (-st.off) + 'px,0,0)';
    if (strip._shift !== shift) { strip._shift = shift; strip.style.transform = shift; }
    renderCaption();
    renderDock();
  }
  /* tvOS captions: the name of the focused item in SF Pro Medium, under it (above it on the top row,
     where the next row sits right below). Content widgets carry their own titles and get none. */
  var CAPTIONS = { alexa: 'Alexa', settings: 'Personalizar', browser: 'Navegador', allapps: 'Todos os apps', volume: 'Volume',
    wifi: '', 'tv-art': 'Modo Arte', 'tv-audio': 'Saída de áudio', 'tv-picture': 'Modo de imagem', 'tv-timer': 'Timer' };
  function captionFor(id) {
    if (id === 'theme') return isDark() ? 'Modo claro' : 'Modo escuro';
    if (id === 'bright') { var pm = data.picture; return pm && pm.mode ? 'Imagem: ' + pm.mode : 'Modo de imagem'; }
    if (id === 'volume') { var v = data.volume, n = v && typeof v.level === 'number' ? (v.muted ? ' · mudo' : ' ' + v.level) : ''; return 'Volume' + n + '   ▲ ▼'; }
    if (CAPTIONS[id] !== undefined) return CAPTIONS[id];
    var c = cards[id];
    return c && c.def.app ? appInfo(c.def.app).name : '';
  }
  function renderCaption() {
    var t = target(st.focus), text = captionFor(st.focus), c = cards[st.focus], fs = c ? focusScale(c.def) : 1.1, grow = t.h * (fs - 1) / 2;
    if (!capEl) return;
    if (st.zone !== 'strip' || st.sheet || !text) { capEl.className = 'wh-cap'; return; }
    capEl.textContent = text;
    capEl.style.left = (STRIP_X + t.x - st.off + t.w / 2) + 'px';
    if (t.y + t.h <= C) { capEl.style.top = (STRIP_Y - grow - 52) + 'px'; capEl.className = 'wh-cap is-on is-above'; }
    else { capEl.style.top = (STRIP_Y + t.y + t.h + grow + 14) + 'px'; capEl.className = 'wh-cap is-on'; }
  }
  function ensureVisible(t) {
    if (t.x + t.w > st.off + VIS) st.off = Math.min(MAXOFF, t.x + t.w - VIS + PEEK);
    if (t.x < st.off) st.off = Math.max(0, t.x - PEEK);
    if (t.x + t.w <= VIS) st.off = 0;
  }
  /* Dock: square iPadOS icons on a dark translucent platter; only the focused icon lifts (tvOS x1.224) with its name below. */
  function dockWidth() { var n = (CFG.dock || []).length; return n * DOCK_W + (n - 1) * DOCK_GAP + 2 * DOCK_PAD; }
  function dockLeft(i) { return DOCK_PAD + i * (DOCK_W + DOCK_GAP); }
  function renderDock() {
    if (!dockItems.length) return;
    var f = st.zone === 'dock' && !st.sheet ? st.dock : -1, width = dockWidth();
    dockBg.style.left = (-width / 2) + 'px'; dockBg.style.width = width + 'px';
    dockItems.forEach(function (item, j) {
      var info = appInfo(item.key), on = j === f;
      var scale = on ? 'scale(' + DOCK_FS + ')' : 'scale(1)';
      if (item.el.style.transform !== scale) item.el.style.transform = scale;
      var keep = on ? (item.el.className.match(/ is-press| bump-\w+/g) || []).join('') : '';
      if (item.el.className !== 'wd' + (on ? ' is-focus' : '') + keep) item.el.className = 'wd' + (on ? ' is-focus' : '') + keep;
      item.el.setAttribute('aria-label', info.name);
      var inner = tileInner(info, false), cls = 'wd-tile b-' + item.key + (hasAppleIcon(item.key, false) ? ' has-art' : '');
      if (item.tile.className !== cls) item.tile.className = cls;
      if (item.tile._html !== inner) { item.tile._html = inner; item.tile.innerHTML = inner; }
      if (on) { dockLabel.textContent = info.name; dockLabel.style.left = (dockLeft(j) - width / 2 + DOCK_W / 2) + 'px'; }
    });
    st.dockLean = '';
    dockLabel.className = 'wh-dock-label' + (f >= 0 ? ' is-on' : '');
  }
  function move(dir) {
    var cur = target(st.focus), cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2, best = null, bestScore = 1e9;
    targets.forEach(function (t) {
      if (t === cur) return;
      var tx = t.x + t.w / 2, ty = t.y + t.h / 2, dx = tx - cx, dy = ty - cy, primary, cross;
      if (dir === 'right') { if (t.x < cur.x + cur.w - 4 || dx <= 0) return; primary = t.x - (cur.x + cur.w); cross = Math.abs(dy); }
      else if (dir === 'left') { if (t.x + t.w > cur.x + 4 || dx >= 0) return; primary = cur.x - (t.x + t.w); cross = Math.abs(dy); }
      else if (dir === 'down') { if (t.y < cur.y + cur.h - 4 || dy <= 0) return; primary = t.y - (cur.y + cur.h); cross = Math.abs(dx); }
      else { if (t.y + t.h > cur.y + 4 || dy >= 0) return; primary = cur.y - (t.y + t.h); cross = Math.abs(dx); }
      var score = primary + cross * 1.6;
      if (score < bestScore) { bestScore = score; best = t; }
    });
    return best;
  }
  function screenX(t) { return STRIP_X + t.x - st.off + t.w / 2; }
  function dockScreenX(i) { return 960 - dockWidth() / 2 + dockLeft(i) + DOCK_W / 2; }
  function toDock() {
    if (!dockItems.length) return;
    var x = screenX(target(st.focus)), best = 0, dist = 1e9;
    dockItems.forEach(function (item, i) { var d = Math.abs(dockScreenX(i) - x); if (d < dist) { dist = d; best = i; } });
    st.zone = 'dock'; st.dock = best;
  }
  function fromDock() {
    var x = dockScreenX(st.dock), best = null, dist = 1e9;
    targets.forEach(function (t) {
      if (t.y + t.h < 400) return;
      var sx = screenX(t);
      if (sx < 129 || sx > 1791) return;
      var d = Math.abs(sx - x);
      if (d < dist) { dist = d; best = t; }
    });
    st.zone = 'strip';
    if (best) st.focus = best.id;
  }

  /* ---------- Sounds (WebAudio, synthesised: a soft focus tick, a select click and an edge bump) ---------- */
  var actx = null, noise = null;
  function sound(kind) {
    if (!prefs.sound) return;
    try {
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
        noise = actx.createBuffer(1, Math.round(actx.sampleRate * 0.03), actx.sampleRate);
        var ch = noise.getChannelData(0);
        for (var i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3);
      }
      if (actx.state === 'suspended') actx.resume();
      var t = actx.currentTime, g = actx.createGain(), src, f;
      g.connect(actx.destination);
      if (kind === 'bump') {
        src = actx.createOscillator(); src.type = 'sine';
        src.frequency.setValueAtTime(150, t); src.frequency.exponentialRampToValueAtTime(90, t + 0.08);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        src.connect(g); src.start(t); src.stop(t + 0.11);
        return;
      }
      src = actx.createBufferSource(); src.buffer = noise;
      f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = kind === 'select' ? 1800 : 3200; f.Q.value = 1.4;
      g.gain.setValueAtTime(kind === 'select' ? 0.55 : 0.32, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'select' ? 0.05 : 0.03));
      src.connect(f); f.connect(g); src.start(t);
      if (kind === 'select') {
        var o = actx.createOscillator(), og = actx.createGain();
        o.frequency.setValueAtTime(1100, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.05);
        og.gain.setValueAtTime(0.09, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        o.connect(og); og.connect(actx.destination); o.start(t); o.stop(t + 0.08);
      }
    } catch (e) { /* sound is optional */ }
  }
  function focusedEl() {
    if (st.zone === 'dock') return dockItems[st.dock] && dockItems[st.dock].el;
    return target(st.focus).el;
  }
  function flash(el, cls, ms) {
    if (!el) return;
    restart(el, cls);
    clearTimeout(el._flash);
    el._flash = setTimeout(function () { el.className = el.className.replace(' ' + cls, ''); }, ms);
  }
  function press() { flash(focusedEl(), 'is-press', 300); sound('select'); }
  function bump(dir) { flash(focusedEl(), 'bump-' + dir, 360); sound('bump'); }

  /* ---------- Actions ---------- */
  function toast(text) {
    if (!toastEl) return;
    toastEl.firstChild.textContent = text;
    toastEl.className = 'wh-toast is-on';
    clearTimeout(st.toastTimer);
    st.toastTimer = setTimeout(function () { toastEl.className = 'wh-toast'; }, 2600);
  }
  function deviceOnly(text) { toast(text || 'Disponível quando o app estiver na TV.'); }
  function ok(id) {
    switch (id) {
      case 'youtube': case 'globoplay': case 'netflix': case 'mercadoplay': case 'alexa': case 'browser': launch(id); return;
      case 'stremio': launch('stremio'); return;
      case 'hbo': launch('hbomax'); return;
      case 'pluto': launch('pluto'); return;
      case 'spotify':
        if (data.spotify && !data.spotify.setup && !data.spotify.error) {
          data.spotify.playing = !data.spotify.playing; data.spotify.at = Date.now(); renderSpotify();
          D.spotifyControl(data.spotify.playing ? 'play' : 'pause', function (err) {
            if (err) { data.spotify.playing = !data.spotify.playing; renderSpotify(); launch('spotify'); return; }
            setTimeout(refreshSpotify, 900);
          });
        } else launch('spotify');
        return;
      case 'weather': toast('Atualizando a previsão…'); refresh('weather', true); return;
      case 'volume':
        if (!onTV()) { deviceOnly('O volume funciona quando o app estiver na TV.'); return; }
        D.changeVolume('mute', function (err, v) { if (err) { toast('A TV não respondeu.'); return; } if (v) { data.volume = v; renderPills(); renderCaption(); } });
        return;
      case 'bright':
        if (!D.tvConfigured || !D.tvConfigured()) { toast('A Samsung não libera o brilho para apps. Abrindo os ajustes de imagem.'); deps.tvSettings(); return; }
        D.nextPictureMode(function (err, pm) { if (err) { toast('A TV não respondeu. Tente de novo.'); return; } data.picture = pm; renderPills(); renderCaption(); toast('Modo de imagem: ' + pm.mode); });
        return;
      case 'wifi': toast('Abrindo os ajustes de rede da TV'); deps.launch('com.samsung.tv.coba.setting.networksettings', 'Rede'); return;
      case 'theme': prefs.theme = isDark() ? 'light' : 'dark'; savePrefs(); renderAll(); return;
      case 'tv-art': deps.art(); return;
      case 'tv-audio': toast('Abrindo a saída de som da TV'); deps.launch('com.samsung.tv.coba.setting.btspeakerlist', 'Som'); return;
      case 'tv-picture':
        if (!onTV()) { deviceOnly('O modo de imagem funciona quando o app estiver na TV.'); return; }
        if (!D.tvConfigured || !D.tvConfigured()) { toast('Conecte o SmartThings para trocar o modo de imagem.'); return; }
        D.nextPictureMode(function (err, pm) { if (err) { toast('A TV não respondeu. Tente de novo.'); return; } data.picture = pm; renderPills(); renderCaption(); toast('Modo de imagem: ' + pm.mode); });
        return;
      case 'tv-timer': toast('Abrindo o menu da TV'); deps.launch('org.tizen.menu', 'Menu'); return;
      case 'news':
        D.openUrl('https://g1.globo.com', function (err) { if (err) deviceOnly('Abre o g1 no navegador da TV.'); });
        return;
      case 'settings': openSheet(); return;
      case 'allapps': deps.openApps(); return;
      case 'folder': openFolder(); return;
    }
  }
  /* Volume pill: ▲ ▼ change it straight away (no OK first). The bar moves at once; the TV gets the
     final value a moment after the last press, so holding the key doesn't queue dozens of calls. */
  function nudgeVolume(step) {
    var v = data.volume && typeof data.volume.level === 'number' ? data.volume : { level: 10, muted: false };
    var level = Math.max(0, Math.min(100, v.level + step));
    data.volume = { level: level, muted: false };
    st.adjust = true; renderPills(); renderFocus();
    clearTimeout(timers.volSend); clearTimeout(timers.volIdle);
    timers.volSend = setTimeout(function () {
      D.setVolume(level, function (err) { if (err) { toast('O volume não respondeu.'); refresh('volume', true); } });
    }, 220);
    timers.volIdle = setTimeout(function () { st.adjust = false; renderFocus(); }, 1400);
  }
  /* ---------- Personalise sheet ----------
     Rows: gradients and photos (one row each, scrolling sideways), appearance, sounds, links.
     Focusing a background previews it live; OK keeps it; Back closes without changing. */
  function bgChoices(kind) {
    if (kind === 'grad') return GRADIENTS.map(function (g) { return { id: g[0], name: g[1] }; });
    if (kind === 'color') return COLORS.map(function (c) { return { id: 'color:' + c[0], name: c[1], hex: c[2] }; });
    var out = photos().map(function (w) { return { id: 'photo:' + w.id, name: w.name, thumb: w.thumb || w.src }; });
    if (CFG.wallpaperPhoto) out.unshift({ id: 'own', name: 'Sua foto', thumb: CFG.wallpaperPhoto });
    return out;
  }
  function sheetRows() {
    return [
      { kind: 'color', items: bgChoices('color') }, { kind: 'grad', items: bgChoices('grad') }, { kind: 'photo', items: bgChoices('photo') },
      { kind: 'theme', items: ['auto', 'light', 'dark'] }, { kind: 'sound', items: ['on', 'off'] },
      { kind: 'link', items: ['cleanframe'] }
    ];
  }
  function openSheet() {
    var rows = sheetRows(), r, c;
    st.sheet = { row: 0, col: 0, preview: null };
    for (r = 0; r < 3; r++) for (c = 0; c < rows[r].items.length; c++) if (rows[r].items[c].id === prefs.bg) { st.sheet.row = r; st.sheet.col = c; }
    previewSwatch();
  }
  function previewSwatch() {
    var row = sheetRows()[st.sheet.row];
    st.sheet.preview = row.kind !== 'theme' && row.kind !== 'sound' && row.kind !== 'link' ? row.items[st.sheet.col].id : null;
  }
  function closeSheet() { st.sheet = null; }
  /* iOS-style folder: a tile with a 2x2 icon cover that opens into an app grid. */
  function renderFolder() {
    if (!cards.folder) return;
    var apps = (CFG.folder && CFG.folder.apps || []).slice(0, 4);
    var mini = apps.map(function (k) { var ic = appleIcon(k); return '<span class="wf-mini">' + (ic ? '<img src="' + esc(ic) + '" alt="">' : '') + '</span>'; }).join('');
    setBody('folder', '<div class="wf-cover">' + mini + '</div>');
  }
  function openFolder() { if (!(CFG.folder && CFG.folder.apps && CFG.folder.apps.length)) return; st.folder = { i: 0 }; renderAll(); }
  function closeFolder() { st.folder = null; renderAll(); }
  function renderFolderSheet() {
    if (!folderEl) return;
    folderEl.className = 'wh-folder' + (st.folder ? ' is-open' : '');
    if (!st.folder) return;
    var f = CFG.folder, apps = f.apps || [], sel = st.folder.i;
    var cells = apps.map(function (k, i) {
      var info = appInfo(k), ic = appleIcon(k);
      return '<div class="wf-app' + (i === sel ? ' is-sel' : '') + '" data-folder="' + i + '"><div class="wf-ic">' + (ic ? '<img src="' + esc(ic) + '" alt="">' : '<span>' + esc((info.name || '?').charAt(0)) + '</span>') + '</div><div class="wf-label">' + esc(info.name) + '</div></div>';
    }).join('');
    var html = '<div class="wf-panel"><h2>' + esc(f.name || 'Apps') + '</h2><div class="wf-grid">' + cells + '</div></div>';
    if (folderEl._html !== html) { folderEl._html = html; folderEl.innerHTML = html; }
  }
  function sheetKey(k) {
    var rows = sheetRows(), sh = st.sheet, row = rows[sh.row];
    if (k === 'back') { closeSheet(); return; }
    if (k === 'up' || k === 'down') {
      var wasScroll = row.kind !== 'theme' && row.kind !== 'sound' && row.kind !== 'link';
      sh.row = Math.max(0, Math.min(rows.length - 1, sh.row + (k === 'up' ? -1 : 1)));
      var next = rows[sh.row], isScroll = next.kind !== 'theme' && next.kind !== 'sound' && next.kind !== 'link', c;
      if (next === row) return;
      sh.col = wasScroll === isScroll ? Math.min(sh.col, next.items.length - 1) : 0;
      if (isScroll) for (c = 0; c < next.items.length; c++) if (next.items[c].id === prefs.bg) sh.col = c;
      if (next.kind === 'theme') sh.col = Math.max(0, ['auto', 'light', 'dark'].indexOf(prefs.theme));
    } else if (k === 'left' || k === 'right') {
      sh.col = Math.max(0, Math.min(row.items.length - 1, sh.col + (k === 'left' ? -1 : 1)));
    } else if (k === 'ok') {
      var value = row.items[sh.col];
      if (row.kind !== 'theme' && row.kind !== 'sound' && row.kind !== 'link') { prefs.bg = value.id; savePrefs(); toast('Fundo ' + value.name + ' aplicado'); }
      else if (row.kind === 'theme') { prefs.theme = value; savePrefs(); }
      else if (row.kind === 'sound') { prefs.sound = value === 'on'; savePrefs(); sound('select'); }
      else if (value === 'cleanframe') { closeSheet(); deps.openSettings(); return; }
      else { closeSheet(); deps.tvSettings(); return; }
    }
    previewSwatch();
  }
  function renderSheet() {
    if (!sheetEl) return;
    var sh = st.sheet, html, rows = sheetRows(), INNER = 528;
    sheetEl.className = 'wh-sheet' + (sh ? ' is-open' : '');
    if (!sh) return;
    function focused(r, c) { return sh.row === r && sh.col === c ? ' is-focus' : ''; }
    function scroller(r, pitch, inner) {
      var n = rows[r].items.length, full = n * pitch - 16, col = sh.row === r ? sh.col : 0;
      for (var c = 0; c < n; c++) if (rows[r].items[c].id === prefs.bg && sh.row !== r) col = c;
      var off = Math.max(0, Math.min(full - INNER, col * pitch - (INNER - pitch) / 2));
      return '<div class="wsh-scroll"><div class="wsh-track" style="width:' + full + 'px;transform:translate3d(' + (-Math.round(off)) + 'px,0,0)">' + inner + '</div></div>';
    }
    var cols = '', grads = '', pics = '';
    rows[0].items.forEach(function (k, c) {
      cols += '<div class="wsh-sw' + focused(0, c) + (prefs.bg === k.id ? ' is-on' : '') + '" data-sheet="0,' + c + '"><b style="background:' + k.hex + '"></b><span>' + esc(k.name) + '</span></div>';
    });
    rows[1].items.forEach(function (g, c) {
      grads += '<div class="wsh-sw' + focused(1, c) + (prefs.bg === g.id ? ' is-on' : '') + '" data-sheet="1,' + c + '"><b class="g-' + g.id + '"></b><span>' + esc(g.name) + '</span></div>';
    });
    rows[2].items.forEach(function (w, c) {
      pics += '<div class="wsh-ph' + focused(2, c) + (prefs.bg === w.id ? ' is-on' : '') + '" data-sheet="2,' + c + '"><b><img src="' + esc(w.thumb) + '" alt=""></b><span>' + esc(w.name) + '</span></div>';
    });
    var themes = [['auto', 'Pôr do sol'], ['light', 'Clara'], ['dark', 'Escura']];
    html = '<h2>Personalizar</h2>' +
      '<div class="wsh-section" style="top:112px"><div class="wsh-cap">Cores</div>' + scroller(0, 112, cols) + '</div>' +
      '<div class="wsh-section" style="top:294px"><div class="wsh-cap">Degradês</div>' + scroller(1, 112, grads) + '</div>' +
      '<div class="wsh-section" style="top:476px"><div class="wsh-cap">Fotos</div>' + scroller(2, 176, pics) + '</div>' +
      '<div class="wsh-section" style="top:660px"><div class="wsh-cap">Aparência</div><div class="wsh-row">' +
      themes.map(function (t, c) { return '<span class="wsh-opt' + focused(3, c) + (prefs.theme === t[0] ? ' is-on' : '') + '" data-sheet="3,' + c + '">' + t[1] + '</span>'; }).join('') + '</div></div>' +
      '<div class="wsh-section" style="top:778px"><div class="wsh-cap">Sons</div><div class="wsh-row">' +
      '<span class="wsh-opt' + focused(4, 0) + (prefs.sound ? ' is-on' : '') + '" data-sheet="4,0">Ligados</span>' +
      '<span class="wsh-opt' + focused(4, 1) + (!prefs.sound ? ' is-on' : '') + '" data-sheet="4,1">Desligados</span></div></div>' +
      '<div class="wsh-section" style="top:896px"><div class="wsh-link' + focused(5, 0) + '" data-sheet="5,0">Mais opções do CleanFrame</div></div>';
    if (sheetEl._html !== html) { sheetEl._html = html; sheetEl.innerHTML = html; }
  }

  /* ---------- Data refresh ---------- */
  var REFRESH = { picture: 10 * 60000, weather: 20 * 60000, spotify: 15000, tmdb: 6 * 3600000, stremio: 5 * 60000, discover: 6 * 3600000, pluto: 2 * 60000, news: 15 * 60000, wifi: 60000, volume: 15000 };
  var FETCH = {
    weather: function (done) { D.weather(done); }, spotify: function (done) { D.spotify(done); }, tmdb: function (done) { D.tmdb(done); },
    stremio: function (done) { D.stremio(done); }, discover: function (done) { D.discover(done); }, pluto: function (done) { data.plutoTried = true; D.pluto(done); }, news: function (done) { D.news(done); },
    wifi: function (done) { D.wifi(done); }, volume: function (done) { D.volume(done); },
    picture: function (done) { if (D.pictureMode) D.pictureMode(done); else done({ setup: true }); }
  };
  var RENDER = { weather: function () { var was = root.className.indexOf(' is-dark') >= 0; renderWeather(); if (was !== isDark()) renderAll(); }, spotify: renderSpotify, tmdb: renderHbo, stremio: renderStremio, discover: function () { renderStremio(); renderHbo(); }, pluto: renderPluto, news: renderNews, wifi: renderNet, volume: renderPills, picture: renderPills };
  function refresh(name, now) {
    clearTimeout(timers[name]);
    if (!st.active || document.hidden) return;
    timers[name] = setTimeout(function () {
      if (name === 'volume' && st.adjust) { refresh(name); return; }
      FETCH[name](function (err, value) {
        if (err && (err.setup || err.device)) data[name] = err;
        else if (value !== undefined) data[name] = value;
        else if (err && !data[name]) data[name] = { error: true };
        RENDER[name]();
        refresh(name);
      });
    }, now ? 0 : REFRESH[name]);
  }
  function refreshSpotify() { refresh('spotify', true); }
  function startData() { Object.keys(FETCH).forEach(function (name) { refresh(name, true); }); rotateHero(); tickSpotify(); }
  function stopData() { Object.keys(timers).forEach(function (name) { clearTimeout(timers[name]); }); }
  function rotateHero() {
    clearTimeout(timers.hero);
    timers.hero = setTimeout(function () {
      var hbN = (data.tmdb && data.tmdb.length || 0) + (data.discover && data.discover.recommended ? data.discover.recommended.length : 0);
      if (hbN > 1) { st.heroIndex++; renderHbo(); }
      // The news photos change on the half beat, so the two cards never fade at the same moment.
      setTimeout(function () { var n = val('news'); if (n && n.length > 1 && st.active) { st.newsIndex++; renderNews(); } }, 4000);
      var pl = val('pluto'); if (pl && pl.length > 1 && st.active) { st.plutoIndex++; renderPluto(); }
      setTimeout(function () { var sv = val('stremio'); if (sv && sv.length > 1 && st.active) { st.stremioIndex++; renderStremio(); } }, 2000);
      rotateHero();
    }, 8000);
  }
  function tick() {
    clearTimeout(timers.clock);
    if (!root) return;
    renderTop();
    if ((root.className.indexOf(' is-dark') >= 0) !== isDark()) renderAll();
    timers.clock = setTimeout(tick, 60000 - Date.now() % 60000 + 50);
  }

  /* ---------- Pointer ---------- */
  function onClick(ev) {
    var el = ev.target, id, rc;
    while (el && el !== root) {
      if (el.getAttribute) {
        if ((rc = el.getAttribute('data-sheet'))) { rc = rc.split(','); st.sheet.row = +rc[0]; st.sheet.col = +rc[1]; previewSwatch(); sheetKey('ok'); renderAll(); return; }
        if ((rc = el.getAttribute('data-folder')) !== null && rc !== '') { var fk = (CFG.folder && CFG.folder.apps || [])[+rc]; closeFolder(); if (fk) launch(fk); return; }
        if ((id = el.getAttribute('data-target') || el.getAttribute('data-card'))) {
          if (id === 'tv') return;
          st.zone = 'strip'; st.focus = id; ensureVisible(target(id)); renderFocus(); ok(id); renderAll(); return;
        }
        if ((id = el.getAttribute('data-dock')) !== null && id !== '') { st.zone = 'dock'; st.dock = +id; renderFocus(); launch(dockItems[+id].key); return; }
      }
      el = el.parentNode;
    }
  }

  function intro() {
    var all = strip.querySelectorAll('.wc'), i;
    root.className += ' is-intro';
    for (i = 0; i < all.length; i++) all[i].style.transitionDelay = (Math.min(i, 8) * 15) + 'ms';
    setTimeout(function () {
      root.className = root.className.replace(' is-intro', '');
      setTimeout(function () { for (i = 0; i < all.length; i++) all[i].style.transitionDelay = ''; }, 1000);
    }, 60);
  }

  /* ---------- Public API ---------- */
  window.FrameWidgets = {
    init: function (container, dependencies) {
      if (root || !container) return;
      deps = dependencies; root = container;
      build(); renderAll(); tick(); resolveApps(); intro();
      document.addEventListener('visibilitychange', function () { if (document.hidden) stopData(); else if (st.active) { startData(); tick(); } });
    },
    setActive: function (on) {
      if (!root || st.active === !!on) return;
      st.active = !!on;
      if (on) { startData(); resolveApps(); } else stopData();
    },
    render: function () { if (root) { renderTop(); renderFocus(); renderSheet(); renderBackground(); } },
    tick: tick,
    key: function (k) {
      if (!root) return false;
      var dirKey = k === 'left' || k === 'right' || k === 'up' || k === 'down';
      if (st.sheet) { sound(k === 'ok' ? 'select' : 'tick'); sheetKey(k); renderAll(); return true; }
      if (st.folder) {
        var fapps = CFG.folder && CFG.folder.apps || [], fn = fapps.length, per = 4, fi = st.folder.i, ni = fi;
        if (k === 'back') { sound('tick'); closeFolder(); return true; }
        if (k === 'ok') { press(); var fkey = fapps[fi]; closeFolder(); launch(fkey); return true; }
        if (k === 'left' && fi % per > 0) ni = fi - 1;
        else if (k === 'right' && fi % per < per - 1 && fi + 1 < fn) ni = fi + 1;
        else if (k === 'up' && fi - per >= 0) ni = fi - per;
        else if (k === 'down' && fi + per < fn) ni = fi + per;
        if (ni !== fi) { st.folder.i = ni; sound('tick'); renderFolderSheet(); }
        return true;
      }
      if (k === 'back') {
        if (st.zone === 'dock') { sound('tick'); fromDock(); st.lean = 'up'; renderFocus(); return true; }
        if (st.focus !== 'youtube' || st.off) { sound('tick'); st.focus = 'youtube'; st.off = 0; renderFocus(); return true; }
        return false;
      }
      if (st.zone === 'dock') {
        if (k === 'left' && st.dock > 0) { st.dock--; st.dockLean = 'left'; sound('tick'); }
        else if (k === 'right' && st.dock < dockItems.length - 1) { st.dock++; st.dockLean = 'right'; sound('tick'); }
        else if (k === 'up') { fromDock(); ensureVisible(target(st.focus)); st.lean = 'up'; sound('tick'); }
        else if (k === 'ok') { press(); launch(dockItems[st.dock].key); }
        else if (dirKey) bump(k);
        renderFocus(); return true;
      }
      if (k === 'ok') { press(); ok(st.focus); renderAll(); return true; }
      if (st.focus === 'volume' && (k === 'up' || k === 'down') && onTV()) { sound('tick'); nudgeVolume(k === 'up' ? 1 : -1); return true; }
      var next = move(k);
      if (next) { st.focus = next.id; ensureVisible(next); st.lean = k; sound('tick'); }
      else if (k === 'down') { toDock(); st.dockLean = 'down'; sound('tick'); }
      else if (dirKey) bump(k);
      renderFocus();
      return true;
    },
    qa: function () { return { zone: st.zone, focus: st.zone === 'dock' ? dockItems[st.dock] && dockItems[st.dock].key : st.focus, offset: st.off, background: prefs.bg, dark: isDark(), theme: prefs.theme, sound: prefs.sound, apple: !!A, sheet: st.sheet ? { row: st.sheet.row, col: st.sheet.col } : null, adjust: st.adjust }; },
    gradients: GRADIENTS.map(function (g) { return g[0]; }),
    photos: function () { return bgChoices('photo').map(function (p) { return p.id; }); }
  };
}());
