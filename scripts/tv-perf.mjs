// Development only: measure how smoothly the Widgets home moves on the TV.
// Needs the app opened with the TV's Web Inspector (sdb shell 0 debug <app id>) and that port
// forwarded to this computer: node scripts/tv-perf.mjs <local port> [out.json]
// It presses the remote's arrows inside the page (synthetic key events), records every frame with
// requestAnimationFrame, and repeats with one cost removed at a time (shadows, transitions, ...).
// It changes nothing on the TV: the injected test styles live only in this page session.
import { writeFileSync } from 'node:fs';

const port = +process.argv[2] || 9333, out = process.argv[3] || '.local/logs/tv-perf.json';
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const target = targets.find(t => t.webSocketDebuggerUrl && /index\.html|FrameHome|CleanFrame/i.test(t.url + t.title)) || targets.find(t => t.webSocketDebuggerUrl);
if (!target) throw Error('No inspectable page on port ' + port);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
let id = 0; const waiting = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } };
const send = (method, params = {}) => new Promise(ok => { const n = ++id; waiting.set(n, ok); ws.send(JSON.stringify({ id: n, method, params })); });
async function run(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result && r.result.exceptionDetails) throw Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
  return r.result && r.result.result && r.result.result.value;
}

// In-page helper (ES5: the TV's engine is Chromium 85-era, but keep it plain anyway).
await run(`(function () {
  if (window.__perf) return true;
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
  function measure(css, codes, gap) {
    style(css);
    return new Promise(function (done) {
      var frames = [], handler = [], i = 0, last = 0, running = true;
      function frame(t) { if (last) frames.push(t - last); last = t; if (running) requestAnimationFrame(frame); }
      // reset to the start of the strip, let it settle, then press
      for (var r = 0; r < 14; r++) key(37); key(38); // back to the strip's start without Back (Back can offer Samsung Home)
      setTimeout(function () {
        requestAnimationFrame(frame);
        (function next() {
          if (i >= codes.length) { setTimeout(function () { running = false; setTimeout(finish, 50); }, 600); return; }
          var t0 = performance.now(); key(codes[i++]); handler.push(performance.now() - t0);
          setTimeout(next, gap);
        }());
      }, 700);
      function finish() {
        frames.sort(function (a, b) { return a - b; });
        var sum = frames.reduce(function (a, b) { return a + b; }, 0), n = frames.length;
        handler.sort(function (a, b) { return a - b; });
        done({ frames: n, fps: Math.round(1000 * n / sum * 10) / 10, p50: +frames[Math.floor(n * .5)].toFixed(1),
          p95: +frames[Math.floor(n * .95)].toFixed(1), worst: +frames[n - 1].toFixed(1),
          dropped: frames.filter(function (f) { return f > 25; }).length,
          keyMs: +handler[Math.floor(handler.length * .5)].toFixed(1), keyWorst: +handler[handler.length - 1].toFixed(1) });
      }
    });
  }
  window.__perf = { key: key, style: style, measure: measure };
  return true;
}())`);

const env = await run(`({ ua: navigator.userAgent, w: innerWidth, h: innerHeight, dpr: devicePixelRatio, cores: navigator.hardwareConcurrency,
  mem: navigator.deviceMemory || null, stage: (document.querySelector('.stage') || {}).style && document.querySelector('.stage').style.transform,
  layout: (document.querySelector('.stage') || {}).className, qa: window.FrameWidgets && window.FrameWidgets.qa(),
  nodes: document.getElementsByTagName('*').length, imgs: document.images.length })`);
console.log('TV:', JSON.stringify(env));

const R = 39, L = 37, D = 40, U = 38;
const walk = [R, R, R, R, R, R, R, R, R, R, R, R, L, L, L, L, L, L, L, L, L, L, L, L, D, R, R, R, R, U];
const VARIANTS = [
  ['atual', ''],
  ['sem sombras', '.wh *,.wh *::before,.wh *::after{box-shadow:none!important;text-shadow:none!important}'],
  ['sem transições', '.wh *,.wh *::before,.wh *::after{transition:none!important;animation:none!important}'],
  ['sem home antiga escondida', '.stage .home,.stage .bg,.stage .appearance{display:none!important}'],
  ['fundo liso', '.wh-bg{background:#14161c!important}.wh-dim{display:none!important}'],
  ['dock sem vidro', '.wh-dock-bg{background:#2a2a2e!important;box-shadow:none!important}'],
  ['sem camada da faixa', '.wh-strip{will-change:auto!important}'],
  ['cards com camada própria', '.wc,.wd{will-change:transform}'],
  ['sem imagens', '.wh img{visibility:hidden!important}'],
  ['tudo junto', '.wh *,.wh *::before,.wh *::after{box-shadow:none!important;text-shadow:none!important}.stage .home,.stage .bg{display:none!important}.wh-bg{background:#14161c!important}']
];
const results = { env, at: new Date().toISOString(), runs: [] };
for (const gap of [260, 130]) {
  for (const [name, css] of VARIANTS) {
    const r = await run(`__perf.measure(${JSON.stringify(css)}, ${JSON.stringify(walk)}, ${gap})`);
    results.runs.push({ name, gap, ...r });
    console.log(`${gap}ms  ${name.padEnd(26)} ${String(r.fps).padStart(5)} fps  p95 ${r.p95}ms  pior ${r.worst}ms  perdidos ${r.dropped}  tecla ${r.keyMs}/${r.keyWorst}ms`);
  }
}
await run('__perf.style("")');

// What runs while the home just sits there (timers, hidden layouts): a 6-second CPU profile.
await send('Profiler.enable');
await send('Profiler.start');
await new Promise(ok => setTimeout(ok, 6000));
const prof = (await send('Profiler.stop')).result.profile;
const self = new Map(), total = prof.samples.length;
const byId = new Map(prof.nodes.map(n => [n.id, n]));
for (const s of prof.samples) {
  const n = byId.get(s), f = n.callFrame, k = (f.functionName || '(anon)') + ' ' + (f.url || '').split('/').pop() + ':' + f.lineNumber;
  self.set(k, (self.get(k) || 0) + 1);
}
results.idle = [...self].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => ({ fn: k, pct: Math.round(1000 * v / total) / 10 }));
console.log('Parado (6 s):', results.idle.slice(0, 8).map(x => x.fn + ' ' + x.pct + '%').join(' | '));
writeFileSync(out, JSON.stringify(results, null, 2));
console.log('Salvo em ' + out);
ws.close();
