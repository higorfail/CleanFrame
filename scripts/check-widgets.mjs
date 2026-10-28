// Development only: browser checks for the Widgets home with mocked network responses.
// Run: CLEANFRAME_PUBLIC_FONTS=1 node scripts/check-widgets.mjs
import { mkdirSync, readFileSync } from 'node:fs';
import { openPreview, root } from './browser.mjs';

const out = root + 'dist/widgets-check/';
mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, detail) => {
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' — ' + JSON.stringify(detail)));
  if (!ok) failures++;
};

const now = Date.now();
const hourStamp = d => new Date(d).toISOString().slice(0, 13) + ':00';
const hours = Array.from({ length: 30 }, (_, i) => now - 3600000 + i * 3600000);
const FIXTURES = {
  'api.open-meteo.com': { current: { time: hourStamp(now), temperature_2m: 20.4, weather_code: 0, is_day: 0 },
    hourly: { time: hours.map(hourStamp), temperature_2m: hours.map((_, i) => 20 - i * 0.2), weather_code: hours.map(() => 3), is_day: hours.map(() => 0) },
    daily: { temperature_2m_max: [26.2, 25], temperature_2m_min: [18.4, 17] } },
  'accounts.spotify.com': { access_token: 'token', expires_in: 3600, refresh_token: 'rotated' },
  'api.spotify.com': { is_playing: true, progress_ms: 1000, item: { name: 'Fixture Song', artists: [{ name: 'Fixture Artist' }], album: { images: [] }, duration_ms: 200000 } },
  'themoviedb.org/3/watch': { results: [{ provider_id: 1899, provider_name: 'HBO Max' }, { provider_id: 8, provider_name: 'Netflix' }] },
  'themoviedb.org/3/discover/tv': { results: [{ name: 'Fixture Series', first_air_date: '2026-01-15', backdrop_path: '/a.jpg', popularity: 99 }] },
  'themoviedb.org/3/discover/movie': { results: [{ title: 'Fixture Film', release_date: '2025-05-01', backdrop_path: '/b.jpg', popularity: 50 }] },
  'api.strem.io': { result: [
    { _id: 'tt0000001', name: 'Old Show', type: 'series', removed: false, state: { timeOffset: 10, duration: 100, lastWatched: '2026-01-01T00:00:00Z', video_id: 'tt0000001:1:1' } },
    { _id: 'tt0000002', name: 'Fixture Stremio', type: 'series', removed: false, state: { timeOffset: 600000, duration: 3000000, lastWatched: '2026-10-27T22:00:00Z', video_id: 'tt0000002:2:5' } }] },
  'boot.pluto.tv': { sessionToken: 'pluto' },
  'guide/channels': { data: [{ id: 'c1', name: 'Fixture Channel', number: 1, images: [] }] },
  'guide/timelines': { data: [{ channelId: 'c1', timelines: [{ title: 'Fixture Programme', start: new Date(now - 600000).toISOString(), stop: new Date(now + 1200000).toISOString() }] }] }
};
const RSS = '<?xml version="1.0"?><rss><channel><item><title>Fixture headline one</title><pubDate>' + new Date(now - 1200000).toUTCString() +
  '</pubDate></item><item><title>Fixture headline two</title><pubDate>' + new Date(now - 7200000).toUTCString() + '</pubDate></item></channel></rss>';

function testConfig() {
  const source = readFileSync(root + 'app/widgets/config.js', 'utf8');
  return source + `
window.FrameWidgetsConfig.spotify = { clientId: 'client', refreshToken: 'refresh' };
window.FrameWidgetsConfig.tmdb.apiKey = 'key';
window.FrameWidgetsConfig.stremio = { authKey: 'auth' };`;
}

const { browser, baseURL, close } = await openPreview({ publicFonts: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/widgets/config.js', r => r.fulfill({ contentType: 'text/javascript', body: testConfig() }));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => {
    const url = route.request().url();
    if (url.includes('g1.globo.com')) return route.fulfill({ contentType: 'application/rss+xml', body: RSS, headers: { 'Access-Control-Allow-Origin': '*' } });
    const key = Object.keys(FIXTURES).find(k => url.includes(k));
    if (!key) return route.abort();
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(FIXTURES[key]), headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.addInitScript(() => { if (!sessionStorage.getItem('widgets-check')) { localStorage.clear(); sessionStorage.setItem('widgets-check', '1'); } });
  await page.goto(baseURL + '/home/');
  await page.waitForTimeout(2500);
  const text = id => page.locator('[data-card="' + id + '"]').innerText();
  const qa = () => page.evaluate(() => window.ShoreQA.widgets());

  check('Fresh install opens the Widgets layout', await page.evaluate(() => window.ShoreQA.state().look.layout === 'widgets'));
  check('Weather renders Open-Meteo data', /20°/.test(await text('weather')) && /Máx 26°/.test(await text('weather')), await text('weather'));
  check('Spotify renders the current track', /Fixture Song/.test(await text('spotify')) && /Fixture Artist/.test(await text('spotify')) && /0:01/.test(await text('spotify')), await text('spotify'));
  check('HBO Max card renders the TMDB catalogue', /Fixture Series/.test(await text('hbo')), await text('hbo'));
  check('Stremio picks the latest unfinished item', /Fixture Stremio/.test(await text('stremio')) && /T2 · E5/.test(await text('stremio')) && /faltam 40 min/.test(await text('stremio')), await text('stremio'));
  check('Pluto TV shows the programme on now', /Fixture Programme/.test(await text('pluto')) && /Fixture Channel/.test(await text('pluto')), await text('pluto'));
  check('News lists g1 headlines', /Fixture headline one/.test(await text('news')) && /há 20 min/.test(await text('news')), await text('news'));
  check('Rotated Spotify refresh token is kept on the device', await page.evaluate(() => JSON.parse(localStorage.getItem('cleanframe.widgets.tokens.v1')).spotifyRefresh === 'rotated'));
  await page.screenshot({ path: out + 'home-data.png' });

  // Navigation: spatial focus, scrolling and the dock.
  check('YouTube has focus on start', (await qa()).focus === 'youtube');
  check('The focused app shows its tvOS caption', (await page.locator('#whCap.is-on').innerText()) === 'YouTube');
  const press = async (...keys) => { for (const k of keys) { await page.keyboard.press(k); await page.waitForTimeout(80); } return qa(); };
  let s = await press('ArrowRight');
  check('Right moves to weather', s.focus === 'weather', s);
  s = await press('ArrowRight');
  check('Right moves to Stremio', s.focus === 'stremio', s);
  s = await press('ArrowRight', 'ArrowRight', 'ArrowRight');
  check('Pills then Globoplay', s.focus === 'globoplay' && s.offset === 0, s);
  s = await press('ArrowRight');
  check('Netflix scrolls the strip', s.focus === 'netflix' && s.offset > 0, s);
  s = await press(...Array(12).fill('ArrowRight'));
  check('The strip ends at the shortcuts', ['settings', 'allapps'].includes(s.focus) && s.offset === 7 * 268, s);
  s = await press('Escape');
  check('Back returns to the start', s.focus === 'youtube' && s.offset === 0, s);
  s = await press('ArrowDown', 'ArrowDown');
  check('Down twice reaches the dock', s.zone === 'dock', s);
  const scales = await page.$$eval('.wd', els => els.map(e => e.style.transform));
  check('Dock lifts only the focused app', scales.filter(t => /scale\(1\.12\)/.test(t)).length === 1 && scales.filter(t => t === 'scale(1)').length === scales.length - 1, scales);
  check('Dock shows the focused app name', await page.locator('.wh-dock-label.is-on').count() === 1);
  await page.screenshot({ path: out + 'dock.png' });
  s = await press('ArrowUp');
  check('Up returns to the strip bottom row', s.zone === 'strip', s);

  // Personalise sheet: preview on focus, apply on OK, revert on Back.
  await page.evaluate(() => { localStorage.removeItem('cleanframe.widgets.v1'); });
  s = await press('Escape', ...Array(15).fill('ArrowRight'), 'ArrowUp');
  s = await press('Enter');
  check('Personalise opens from the shortcut', s.sheet !== null, s);
  s = await press('ArrowRight');
  const previewed = await page.$eval('#whBgA', a => a.className) + ' ' + await page.$eval('#whBgB', b => b.className);
  check('Focusing a swatch previews it', /g-oceano/.test(previewed) && s.background === 'rubi', previewed);
  s = await press('Escape');
  check('Back without OK keeps the saved background', s.background === 'rubi' && s.sheet === null, s);
  s = await press('Enter', 'ArrowRight', 'ArrowRight', 'Enter');
  check('OK applies and saves the background', s.background === 'aurora' && (await page.evaluate(() => JSON.parse(localStorage.getItem('cleanframe.widgets.v1')).bg)) === 'aurora', s);
  s = await press('ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight', 'Enter');
  check('Dark appearance can be chosen', s.dark === true, s);
  s = await press('ArrowDown', 'ArrowRight', 'Enter');
  check('Interface sounds can be turned off', s.sound === false, s);
  s = await press('ArrowLeft', 'Enter');
  check('Interface sounds can be turned back on', s.sound === true, s);
  await page.screenshot({ path: out + 'sheet.png' });
  s = await press('Escape');

  // Reload keeps preferences.
  await page.reload(); await page.waitForTimeout(1500);
  s = await qa();
  check('Preferences survive a restart', s.background === 'aurora' && s.dark === true, s);
  await page.screenshot({ path: out + 'home-dark.png' });

  // 1280x720 keeps the same stage geometry.
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(400);
  const box = await page.locator('.wh').boundingBox();
  check('Stage scales to 1280x720', Math.abs(box.width - 1280) < 2 && Math.abs(box.height - 720) < 2, box);
  check('No page errors', errors.length === 0, errors);
} finally {
  await close();
}
if (failures) { console.error(failures + ' widget check(s) failed.'); process.exit(1); }
console.log('Widget checks passed. Screenshots: dist/widgets-check/');
