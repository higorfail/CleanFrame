/* Smoothness test for the Widgets home, built in so it runs where the TV refuses a debugger.
   Only active when window.FramePerf names a report address (personal test builds). It presses the
   remote's arrows inside the page, records every frame, repeats with one cost removed at a time,
   measures how busy the page is while idle, and posts the numbers to that address. ES5. */
(function () {
  'use strict';
  var cfg = window.FramePerf;
  if (!cfg || !cfg.report) return;
  function key(code) {
    ['keydown', 'keyup'].forEach(function (type) {
      var e = document.createEvent('Event'); e.initEvent(type, true, true);
      Object.defineProperty(e, 'keyCode', { value: code }); Object.defineProperty(e, 'which', { value: code });
      document.dispatchEvent(e);
    });
  }
  function style(css) {
    var el = document.getElementById('perf-style');
    if (!el) { el = document.createElement('style'); el.id = 'perf-style'; document.head.appendChild(el); }
    el.textContent = css || '';
  }
  function post(body) {
    try { var x = new window.XMLHttpRequest(); x.open('POST', cfg.report, true); x.setRequestHeader('Content-Type', 'text/plain'); x.send(JSON.stringify(body)); } catch (e) { /* nothing to do */ }
  }
  function measure(css, codes, gap, done) {
    style(css);
    var frames = [], handler = [], i = 0, last = 0, running = true, r;
    function frame(t) { if (last) frames.push(t - last); last = t; if (running) window.requestAnimationFrame(frame); }
    for (r = 0; r < 14; r++) key(37); key(38);
    setTimeout(function () {
      window.requestAnimationFrame(frame);
      (function next() {
        if (i >= codes.length) { setTimeout(function () { running = false; setTimeout(finish, 50); }, 600); return; }
        var t0 = window.performance.now(); key(codes[i++]); handler.push(window.performance.now() - t0);
        setTimeout(next, gap);
      }());
    }, 900);
    function finish() {
      frames.sort(function (a, b) { return a - b; }); handler.sort(function (a, b) { return a - b; });
      var sum = frames.reduce(function (a, b) { return a + b; }, 0), n = frames.length;
      done({ fps: Math.round(10000 * n / sum) / 10, p50: Math.round(frames[Math.floor(n * .5)]), p95: Math.round(frames[Math.floor(n * .95)]),
        worst: Math.round(frames[n - 1]), dropped: frames.filter(function (f) { return f > 25; }).length, frames: n,
        keyMs: Math.round(handler[Math.floor(handler.length / 2)] * 10) / 10, keyWorst: Math.round(handler[handler.length - 1]) });
    }
  }
  // How busy the page is when nobody touches it: lateness of a 50 ms timer over 6 seconds.
  function idle(css, done) {
    style(css);
    var late = [], start = window.performance.now(), want = start + 50;
    (function tick() {
      var now = window.performance.now();
      late.push(Math.max(0, now - want));
      if (now - start > 6000) { late.sort(function (a, b) { return a - b; }); done({ lateAvg: Math.round(late.reduce(function (a, b) { return a + b; }, 0) / late.length * 10) / 10, lateWorst: Math.round(late[late.length - 1]) }); return; }
      want = now + 50; setTimeout(tick, 50);
    }());
  }
  var R = 39, L = 37, D = 40, U = 38;
  var walk = [R, R, R, R, R, R, R, R, R, R, R, R, L, L, L, L, L, L, L, L, L, L, L, L, D, R, R, R, R, U];
  var V = [
    ['atual', ''],
    ['sem sombras', '.wh *,.wh *::before,.wh *::after{box-shadow:none!important;text-shadow:none!important}'],
    ['sem fotos dos cards', '.wh .wc-img{visibility:hidden!important}'],
    ['sem legenda', '.wh-cap,.wh-dock-label{display:none!important}'],
    ['sem transições (referência)', '.wh *,.wh *::before,.wh *::after{transition:none!important;animation:none!important}']
  ];
  var stage = document.querySelector('.stage');
  var out = { env: { ua: window.navigator.userAgent, w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio, cores: window.navigator.hardwareConcurrency, mem: window.navigator.deviceMemory || null,
    stage: stage && stage.style.transform, layout: stage && stage.className, nodes: document.getElementsByTagName('*').length, imgs: document.images.length }, runs: [], idle: [] };
  var jobs = [];
  [260, 130].forEach(function (gap) { V.forEach(function (v) { jobs.push(function (next) { measure(v[1], walk, gap, function (r) { r.name = v[0]; r.gap = gap; out.runs.push(r); post({ progress: out.runs.length, of: V.length * 2 }); next(); }); }); }); });
  [['atual', ''], ['sem home antiga escondida', V[3][1]]].forEach(function (v) { jobs.push(function (next) { idle(v[1], function (r) { r.name = v[0]; out.idle.push(r); next(); }); }); });
  setTimeout(function run() {
    if (!jobs.length) { style(''); out.done = true; post(out); return; }
    jobs.shift()(function () { setTimeout(run, 300); });
  }, 6000);
}());
