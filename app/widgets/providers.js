/* Frame Home widgets — data sources. ES5, no dependencies, short timeouts, cached results. */
(function () {
  'use strict';
  var CFG = window.FrameWidgetsConfig || {};
  var CACHE_KEY = 'cleanframe.widgets.cache.v1', SECRET_KEY = 'cleanframe.widgets.tokens.v1';
  var cache = read(CACHE_KEY), secrets = read(SECRET_KEY);

  function read(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
  function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked */ } }
  function save(name, value) { cache[name] = { t: Date.now(), v: value }; store(CACHE_KEY, cache); }
  function fresh(name, maxAge) { var c = cache[name]; return c && Date.now() - c.t < maxAge ? c.v : null; }
  function last(name) { var c = cache[name]; return c ? c.v : null; }
  function onTV() { return !!(window.tizen && window.tizen.application); }

  function request(opts, done) {
    var x = new window.XMLHttpRequest(), finished = false, timer;
    function finish(err, value) { if (finished) return; finished = true; clearTimeout(timer); done(err, value); }
    timer = setTimeout(function () { try { x.abort(); } catch (e) { /* ignore */ } finish(new Error('timeout')); }, opts.timeout || 10000);
    try {
      x.open(opts.method || 'GET', opts.url, true);
      Object.keys(opts.headers || {}).forEach(function (h) { x.setRequestHeader(h, opts.headers[h]); });
      x.onreadystatechange = function () {
        if (x.readyState !== 4) return;
        if (x.status === 204) { finish(null, null); return; }
        if (x.status < 200 || x.status >= 300) { finish(new Error('HTTP ' + x.status)); return; }
        if (opts.text) { finish(null, x.responseText); return; }
        try { finish(null, x.responseText ? JSON.parse(x.responseText) : null); } catch (e) { finish(e); }
      };
      x.onerror = function () { finish(new Error('network')); };
      x.send(opts.body || null);
    } catch (e) { finish(e); }
  }
  function query(params) {
    return Object.keys(params).filter(function (k) { return params[k] !== undefined && params[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
  }

  /* ---------- Weather: Open-Meteo ---------- */
  var WMO = [
    [[0], 'sun', 'Céu limpo'], [[1], 'sun', 'Quase limpo'], [[2], 'partly', 'Parcialmente nublado'], [[3], 'cloud', 'Nublado'],
    [[45, 48], 'fog', 'Neblina'], [[51, 53, 55, 56, 57], 'drizzle', 'Garoa'], [[61, 63, 65, 66, 67], 'rain', 'Chuva'],
    [[71, 73, 75, 77, 85, 86], 'snow', 'Neve'], [[80, 81, 82], 'rain', 'Pancadas de chuva'], [[95, 96, 99], 'storm', 'Tempestade']
  ];
  function wmo(code, day) {
    for (var i = 0; i < WMO.length; i++) if (WMO[i][0].indexOf(code) >= 0) {
      var icon = WMO[i][1];
      if (!day && (icon === 'sun' || icon === 'partly')) icon = icon === 'sun' ? 'moon' : 'cloudmoon';
      return { icon: icon, text: WMO[i][2] };
    }
    return { icon: 'cloud', text: '—' };
  }
  function weather(done) {
    var loc = CFG.location || {}, hit = fresh('weather', 20 * 60000);
    if (hit) { done(null, hit); return; }
    request({ url: 'https://api.open-meteo.com/v1/forecast?' + query({
      latitude: loc.latitude, longitude: loc.longitude, timezone: loc.timezone || 'auto', forecast_days: 2,
      current: 'temperature_2m,weather_code,is_day', hourly: 'temperature_2m,weather_code,is_day', daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset'
    }) }, function (err, j) {
      if (err || !j || !j.current) { done(err || new Error('weather'), last('weather')); return; }
      var cur = wmo(j.current.weather_code, j.current.is_day), hours = [], start = 0, i;
      for (i = 0; i < j.hourly.time.length; i++) if (j.hourly.time[i] >= j.current.time.slice(0, 13)) { start = i; break; }
      for (i = start + 1; i < Math.min(start + 7, j.hourly.time.length); i++) {
        hours.push({ h: j.hourly.time[i].slice(11, 13) + 'h', t: Math.round(j.hourly.temperature_2m[i]), icon: wmo(j.hourly.weather_code[i], j.hourly.is_day[i]).icon });
      }
      var data = { label: loc.label || '', temp: Math.round(j.current.temperature_2m), icon: cur.icon, text: cur.text,
        max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]), hours: hours, day: !!j.current.is_day,
        sunrise: j.daily.sunrise || [], sunset: j.daily.sunset || [] };
      save('weather', data); done(null, data);
    });
  }

  /* ---------- Spotify Web API (PKCE refresh token) ---------- */
  var spotifyToken = null;
  function spotifyConfigured() { return !!(CFG.spotify && CFG.spotify.clientId && (secrets.spotifyRefresh || CFG.spotify.refreshToken)); }
  function spotifyAuth(done) {
    if (spotifyToken && spotifyToken.exp > Date.now() + 30000) { done(null, spotifyToken.value); return; }
    request({ method: 'POST', url: 'https://accounts.spotify.com/api/token', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: query({ grant_type: 'refresh_token', refresh_token: secrets.spotifyRefresh || CFG.spotify.refreshToken, client_id: CFG.spotify.clientId }) }, function (err, j) {
      if (err || !j || !j.access_token) { done(err || new Error('spotify auth')); return; }
      spotifyToken = { value: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
      // PKCE refresh tokens rotate: keep the newest one on the TV.
      if (j.refresh_token) { secrets.spotifyRefresh = j.refresh_token; store(SECRET_KEY, secrets); }
      done(null, j.access_token);
    });
  }
  function spotifyApi(method, path, done) {
    spotifyAuth(function (err, token) {
      if (err) { done(err); return; }
      request({ method: method, url: 'https://api.spotify.com/v1' + path, headers: { Authorization: 'Bearer ' + token } }, done);
    });
  }
  function trackData(item, playing, progress) {
    var images = item && item.album && item.album.images || item && item.images || [];
    return { title: item.name, artist: (item.artists || []).map(function (a) { return a.name; }).join(', ') || item.show && item.show.name || '',
      art: images.length ? images[Math.min(1, images.length - 1)].url : '', playing: !!playing, progress: progress || 0, duration: item.duration_ms || 0 };
  }
  function spotify(done) {
    if (!spotifyConfigured()) { done({ setup: true }); return; }
    spotifyApi('GET', '/me/player/currently-playing?additional_types=episode', function (err, j) {
      if (!err && j && j.item) { var d = trackData(j.item, j.is_playing, j.progress_ms); d.label = j.is_playing ? 'TOCANDO AGORA' : 'PAUSADO'; save('spotify', d); done(null, d); return; }
      spotifyApi('GET', '/me/player/recently-played?limit=1', function (err2, r) {
        if (err2 || !r || !r.items || !r.items.length) { done(err2 || err || new Error('spotify'), last('spotify')); return; }
        var d2 = trackData(r.items[0].track, false, 0); d2.label = 'TOCADO RECENTEMENTE'; save('spotify', d2); done(null, d2);
      });
    });
  }
  function spotifyControl(action, done) {
    var map = { play: ['PUT', '/me/player/play'], pause: ['PUT', '/me/player/pause'], next: ['POST', '/me/player/next'], previous: ['POST', '/me/player/previous'] };
    if (!spotifyConfigured() || !map[action]) { done(new Error('spotify')); return; }
    spotifyApi(map[action][0], map[action][1], done);
  }

  /* ---------- TMDB: what is on HBO Max in the configured region ---------- */
  function tmdbGet(path, params, done) {
    var key = CFG.tmdb.apiKey, headers = {};
    if (key.length > 60) headers.Authorization = 'Bearer ' + key; else params.api_key = key;
    request({ url: 'https://api.themoviedb.org/3' + path + '?' + query(params), headers: headers }, done);
  }
  function tmdb(done) {
    var t = CFG.tmdb || {}, hit = fresh('tmdb', 6 * 3600000);
    if (!t.apiKey) { done({ setup: true }); return; }
    if (hit) { done(null, hit); return; }
    tmdbGet('/watch/providers/tv', { watch_region: t.region, language: t.language }, function (err, j) {
      if (err || !j || !j.results) { done(err || new Error('tmdb'), last('tmdb')); return; }
      var re = new RegExp('^(' + (t.provider || 'Max') + ')$', 'i'), id = null;
      j.results.forEach(function (p) { if (id === null && re.test(p.provider_name)) id = p.provider_id; });
      if (id === null) { done(new Error('provider'), last('tmdb')); return; }
      var out = [], pending = 2;
      ['tv', 'movie'].forEach(function (kind) {
        tmdbGet('/discover/' + kind, { watch_region: t.region, with_watch_providers: id, language: t.language, sort_by: 'popularity.desc', 'vote_count.gte': 50 }, function (e, d) {
          (d && d.results || []).slice(0, 6).forEach(function (r) {
            if (!r.backdrop_path) return;
            out.push({ title: r.name || r.title, kind: kind === 'tv' ? 'Série' : 'Filme', year: (r.first_air_date || r.release_date || '').slice(0, 4),
              image: 'https://image.tmdb.org/t/p/w500' + r.backdrop_path, popularity: r.popularity || 0 });
          });
          if (--pending) return;
          out.sort(function (a, b) { return b.popularity - a.popularity; });
          out = out.slice(0, 6);
          if (!out.length) { done(new Error('empty'), last('tmdb')); return; }
          save('tmdb', out); done(null, out);
        });
      });
    });
  }

  /* ---------- Stremio continue watching (unofficial API) ---------- */
  function stremio(done) {
    var key = CFG.stremio && CFG.stremio.authKey, hit = fresh('stremio', 5 * 60000);
    if (!key) { done({ setup: true }); return; }
    if (hit) { done(null, hit); return; }
    request({ method: 'POST', url: 'https://api.strem.io/api/datastoreGet', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey: key, collection: 'libraryItem', ids: [], all: true }) }, function (err, j) {
      var items = j && (j.result || j) || [];
      if (err || !items.filter) { done(err || new Error('stremio'), last('stremio')); return; }
      items = items.filter(function (i) { return i && !i.removed && i.state && i.state.timeOffset > 0 && i.state.duration > 0 && i.state.timeOffset < i.state.duration * 0.95; });
      items.sort(function (a, b) { return String(b.state.lastWatched || '').localeCompare(String(a.state.lastWatched || '')); });
      if (!items.length) { done(null, null); return; }
      var it = items[0], vid = String(it.state.video_id || '').split(':'), imdb = String(it._id || '').split(':')[0];
      var data = { title: it.name, type: it.type,
        episode: vid.length >= 3 ? 'T' + vid[1] + ' · E' + vid[2] : it.type === 'movie' ? 'Filme' : '',
        left: Math.max(1, Math.round((it.state.duration - it.state.timeOffset) / 60000)),
        progress: it.state.timeOffset / it.state.duration,
        image: /^tt\d+$/.test(imdb) ? 'https://images.metahub.space/background/medium/' + imdb + '/img' : it.background || it.poster || '' };
      save('stremio', data); done(null, data);
    });
  }

  /* ---------- Pluto TV now playing (unofficial guide API) ---------- */
  var plutoSession = null;
  function uuid() {
    if (!secrets.plutoClient) { secrets.plutoClient = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); store(SECRET_KEY, secrets); }
    return secrets.plutoClient;
  }
  function plutoSlot(pick, cur) {
    var logo = (pick.images || []).filter(function (im) { return /logo|colorLogo/i.test(im.type || ''); })[0];
    var start = new Date(cur.start).getTime(), stop = new Date(cur.stop).getTime(), end = new Date(stop);
    return { channel: pick.name, title: cur.episode && cur.episode.series && cur.episode.series.name || cur.title,
      until: (end.getHours() < 10 ? '0' : '') + end.getHours() + ':' + (end.getMinutes() < 10 ? '0' : '') + end.getMinutes(),
      logo: logo && logo.url || '', start: start, stop: stop };
  }
  /* A rotating set of channels: the owner's favourites (CFG.pluto.favorites), a single pinned channel
     (CFG.pluto.channel), or the first live channels. Returns an array of "now playing" slots. */
  function pluto(done) {
    var hit = fresh('pluto', 3 * 60000);
    if (hit && hit.length && hit[0].stop > Date.now()) { done(null, hit); return; }
    function withSession(next) {
      if (plutoSession && plutoSession.exp > Date.now()) { next(null, plutoSession.token); return; }
      request({ url: 'https://boot.pluto.tv/v4/start?' + query({ appName: 'web', appVersion: '9.0.0', deviceVersion: '120.0.0', deviceModel: 'web', deviceMake: 'chrome',
        deviceType: 'web', clientID: uuid(), clientModelNumber: '1.0.0', serverSideAds: 'false' }) }, function (err, j) {
        if (err || !j || !j.sessionToken) { next(err || new Error('pluto')); return; }
        plutoSession = { token: j.sessionToken, exp: Date.now() + 3600000 }; next(null, j.sessionToken);
      });
    }
    withSession(function (err, token) {
      if (err) { done(err, last('pluto')); return; }
      var auth = { Authorization: 'Bearer ' + token }, base = 'https://service-channels.clusters.pluto.tv/v2/guide/';
      request({ url: base + 'channels?' + query({ channelIds: '', offset: 0, limit: 300, sort: 'number:asc' }), headers: auth, timeout: 15000 }, function (e, ch) {
        var list = ch && ch.data || [], favs = CFG.pluto && CFG.pluto.favorites || [], pinned = (CFG.pluto && CFG.pluto.channel || ''), picks = [];
        function find(name) { name = String(name).toLowerCase(); for (var i = 0; i < list.length; i++) if (String(list[i].name).toLowerCase().indexOf(name) >= 0) return list[i]; return null; }
        function add(c) { if (c && picks.indexOf(c) < 0) picks.push(c); }
        if (favs.length) favs.forEach(function (n) { add(find(n)); });
        else if (pinned) add(find(pinned));
        if (!picks.length) picks = list.slice(0, 6);
        picks = picks.slice(0, 8);
        if (e || !picks.length) { done(e || new Error('pluto'), last('pluto')); return; }
        var ids = picks.map(function (c) { return c.id; }).join(',');
        request({ url: base + 'timelines?' + query({ start: new Date().toISOString(), channelIds: ids, duration: 120 }), headers: auth, timeout: 15000 }, function (e2, tl) {
          var rows = tl && tl.data || [], now = Date.now(), out = [];
          picks.forEach(function (pick) {
            var row = null;
            for (var i = 0; i < rows.length; i++) if (rows[i].channelId === pick.id) { row = rows[i]; break; }
            var cur = null;
            (row && row.timelines || []).forEach(function (p) { if (!cur && new Date(p.start).getTime() <= now && new Date(p.stop).getTime() > now) cur = p; });
            if (cur) out.push(plutoSlot(pick, cur));
          });
          if (e2 || !out.length) { done(e2 || new Error('pluto'), last('pluto')); return; }
          save('pluto', out); done(null, out);
        });
      });
    });
  }

  /* ---------- g1 headlines (RSS) ---------- */
  function ago(ms) {
    var m = Math.max(1, Math.round((Date.now() - ms) / 60000));
    return m < 60 ? 'há ' + m + ' min' : m < 1440 ? 'há ' + Math.round(m / 60) + ' h' : 'há ' + Math.round(m / 1440) + ' d';
  }
  function newsOut(list) { return list.map(function (n) { return { title: n.title, when: ago(n.t), image: n.image || '' }; }); }
  function itemImage(item) {
    var media = item.getElementsByTagNameNS ? item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content') : [];
    for (var m = 0; m < media.length; m++) { var u = media[m].getAttribute('url'); if (u && !/\.(mp4|m3u8)(\?|$)/i.test(u)) return u; }
    var desc = item.getElementsByTagName('description')[0], hit = desc && /<img[^>]+src=["']([^"']+)["']/i.exec(desc.textContent);
    return hit ? hit[1] : '';
  }
  function news(done) {
    var hit = fresh('news2', 15 * 60000);
    if (hit) { done(null, newsOut(hit)); return; }
    request({ url: CFG.news && CFG.news.feed || 'https://g1.globo.com/rss/g1/', text: true }, function (err, xml) {
      var out = [];
      try {
        var doc = new window.DOMParser().parseFromString(xml, 'text/xml'), items = doc.getElementsByTagName('item');
        for (var i = 0; i < items.length && out.length < 8; i++) {
          var title = items[i].getElementsByTagName('title')[0], date = items[i].getElementsByTagName('pubDate')[0];
          if (title) out.push({ title: title.textContent.replace(/\s+/g, ' ').trim(), t: date ? Date.parse(date.textContent) || Date.now() : Date.now(), image: itemImage(items[i]) });
        }
      } catch (e) { err = err || e; }
      if (err || !out.length) { var old = last('news2'); done(err || new Error('news'), old && newsOut(old)); return; }
      save('news2', out); done(null, newsOut(out));
    });
  }

  /* ---------- SmartThings light ---------- */
  function lightConfigured() { return !!(CFG.smartthings && CFG.smartthings.token && CFG.smartthings.lightId); }
  function light(done) {
    if (!lightConfigured()) { done({ setup: true }); return; }
    request({ url: 'https://api.smartthings.com/v1/devices/' + encodeURIComponent(CFG.smartthings.lightId) + '/status', headers: { Authorization: 'Bearer ' + CFG.smartthings.token } }, function (err, j) {
      try { done(err, { on: j.components.main['switch']['switch'].value === 'on' }); } catch (e) { done(err || e); }
    });
  }
  function setLight(on, done) {
    if (!lightConfigured()) { done(new Error('setup')); return; }
    request({ method: 'POST', url: 'https://api.smartthings.com/v1/devices/' + encodeURIComponent(CFG.smartthings.lightId) + '/commands',
      headers: { Authorization: 'Bearer ' + CFG.smartthings.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ component: 'main', capability: 'switch', command: on ? 'on' : 'off' }] }) }, done);
  }

  /* ---------- The TV through SmartThings (volume, picture mode). Works where the web API is blocked. ---------- */
  function tvConfigured() { return !!(CFG.smartthings && CFG.smartthings.token && CFG.smartthings.tvId); }
  function stDevice(path) { return 'https://api.smartthings.com/v1/devices/' + encodeURIComponent(CFG.smartthings.tvId) + path; }
  function stHeaders(json) { var h = { Authorization: 'Bearer ' + CFG.smartthings.token }; if (json) h['Content-Type'] = 'application/json'; return h; }
  function tvStatus(done) {
    request({ url: stDevice('/components/main/status'), headers: stHeaders() }, function (err, j) {
      if (err || !j) { done(err || new Error('tv')); return; }
      try {
        var pm = j['custom.picturemode'] || {}, modes = pm.supportedPictureModes && pm.supportedPictureModes.value || [];
        done(null, { level: +j.audioVolume.volume.value, muted: j.audioMute.mute.value === 'muted',
          picture: pm.pictureMode && pm.pictureMode.value || '', pictures: modes });
      } catch (e) { done(e); }
    });
  }
  function tvCommand(capability, command, args, done) {
    var cmd = { component: 'main', capability: capability, command: command };
    if (args) cmd['arguments'] = args;
    request({ method: 'POST', url: stDevice('/commands'), headers: stHeaders(true), body: JSON.stringify({ commands: [cmd] }) }, function (err) { done(err || null); });
  }

  /* ---------- The TV itself ---------- */
  function audio() { return window.tizen && window.tizen.tvaudiocontrol; }
  function localVolume() { var a = audio(); return a ? { level: a.getVolume(), muted: a.isMute() } : null; }
  function volume(done) {
    if (tvConfigured()) { tvStatus(function (err, s) { if (!err) { done(null, s); return; } try { var v = localVolume(); if (v) { done(null, v); return; } } catch (e) { /* fall through */ } done(err); }); return; }
    try { var v = localVolume(); if (v) { done(null, v); return; } } catch (e) { done(e); return; }
    done({ device: true });
  }
  function changeVolume(step, done) {
    var a = tvConfigured() ? null : audio();
    // SmartThings when set up (the TV can refuse its web audio API to developer apps), else the local API.
    try {
      if (a) {
        if (step === 'mute') a.setMute(!a.isMute());
        else if (step > 0) a.setVolumeUp(); else a.setVolumeDown();
        done(null, { level: a.getVolume(), muted: a.isMute() });
        return;
      }
    } catch (e) { if (!tvConfigured()) { done(e); return; } }
    if (!tvConfigured()) { done({ device: true }); return; }
    var finish = function (err) { if (err) { done(err); return; } setTimeout(function () { tvStatus(done); }, 350); };
    if (step === 'mute') tvStatus(function (e, st) { if (e) { done(e); return; } tvCommand('audioMute', 'setMute', [st.muted ? 'unmuted' : 'muted'], finish); });
    else tvCommand('audioVolume', step > 0 ? 'volumeUp' : 'volumeDown', null, finish);
  }
  function setVolume(level, done) {
    // SmartThings first when it is set up: the TV's web audio API can refuse developer apps.
    if (tvConfigured()) { tvCommand('audioVolume', 'setVolume', [level], function (err) { done(err || null); }); return; }
    var a = audio();
    if (!a) { done({ device: true }); return; }
    try { a.setVolume(level); done(null); } catch (e) { done(e); }
  }
  function pictureMode(done) {
    if (!tvConfigured()) { done({ setup: true }); return; }
    tvStatus(function (err, s) { done(err, s && { mode: s.picture, modes: s.pictures }); });
  }
  function nextPictureMode(done) {
    pictureMode(function (err, p) {
      if (err || !p || !p.modes.length) { done(err || new Error('picture')); return; }
      var next = p.modes[(p.modes.indexOf(p.mode) + 1) % p.modes.length];
      tvCommand('custom.picturemode', 'setPictureMode', [next], function (e) { done(e, e ? null : { mode: next, modes: p.modes }); });
    });
  }
  function wifi(done) {
    var s = window.tizen && window.tizen.systeminfo;
    if (!s) { done({ device: true }); return; }
    try {
      s.getPropertyValue('WIFI_NETWORK', function (w) { done(null, { on: w.status === 'ON', ssid: w.ssid || '', strength: w.signalStrength || 0 }); },
        function () {
          s.getPropertyValue('NETWORK', function (n) { done(null, { on: n.networkType !== 'NONE', ssid: n.networkType === 'ETHERNET' ? 'Cabo de rede' : '', strength: 1 }); }, function (e) { done(e); });
        });
    } catch (e) { done(e); }
  }
  function openUrl(url, done) {
    var api = window.tizen && window.tizen.application;
    if (!api) { done({ device: true }); return; }
    try {
      var control = new window.tizen.ApplicationControl('http://tizen.org/appcontrol/operation/view', url, null, null, null);
      api.launchAppControl(control, 'org.tizen.browser', function () { done(null); }, function (e) { done(e); });
    } catch (e) { done(e); }
  }

  window.FrameWidgetsData = {
    onTV: onTV, weather: weather, spotify: spotify, spotifyControl: spotifyControl, tmdb: tmdb, stremio: stremio, pluto: pluto,
    news: news, light: light, setLight: setLight, volume: volume, changeVolume: changeVolume, setVolume: setVolume, pictureMode: pictureMode, nextPictureMode: nextPictureMode, tvConfigured: tvConfigured, wifi: wifi, openUrl: openUrl,
    last: last
  };
}());
