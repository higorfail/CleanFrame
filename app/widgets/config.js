/*
 * Frame Home widgets — personal settings.
 *
 * Everything here is optional. A widget without its key shows a short setup
 * hint on the TV (and sample content in the browser preview) instead of failing.
 * Keys are personal: keep a filled-in copy out of public forks (see docs/widgets.md).
 */
window.FrameWidgetsConfig = {
  name: 'Higor',
  // A square photo bundled with the app, e.g. 'widgets/profile.jpg'. Empty shows the initial.
  profilePhoto: '',
  // Weather (Open-Meteo, free, no key).
  location: { label: 'Balneário C.', latitude: -26.9906, longitude: -48.6348, timezone: 'America/Sao_Paulo' },

  // Spotify Web API (needs Premium on the developer account). Run `npm run spotify:token` once.
  spotify: { clientId: '', refreshToken: '' },
  // TMDB (free key for personal use) — catalogue for the HBO Max card. https://www.themoviedb.org/settings/api
  tmdb: { apiKey: '', region: 'BR', language: 'pt-BR', provider: 'HBO Max|Max' },
  // Stremio — unofficial API. Run `npm run stremio:key` once to get the auth key.
  stremio: { authKey: '' },
  // Pluto TV — unofficial guide API. Optional channel name to follow; empty picks the first live channel.
  pluto: { channel: '' },
  // g1 headlines (public RSS feed).
  news: { feed: 'https://g1.globo.com/rss/g1/' },
  // SmartThings (optional) — personal access token and the living-room light device ID.
  smartthings: { token: '', lightId: '' },

  // Apps are found among the TV's installed apps by ID first, then by name.
  apps: {
    youtube: { name: 'YouTube', ids: ['9Ur5IzDKqV.TizenYouTube'], match: 'youtube', brand: 'youtube' },
    stremio: { name: 'Stremio', ids: ['IkWsFHtOY9.Stremio'], match: 'stremio', brand: 'stremio' },
    spotify: { name: 'Spotify', ids: ['rJeHak5zRg.Spotify'], match: 'spotify', brand: 'spotify' },
    hbomax: { name: 'HBO Max', ids: ['5b8c3eb16b.BeamCTVDev', 'cj37Ni3qXM.HBONow'], match: '^(hbo ?)?max$|hbo max', brand: 'hbomax' },
    pluto: { name: 'Pluto TV', ids: ['X1pKpFCiUu.PlutoTV'], match: 'pluto' },
    globoplay: { name: 'Globoplay', ids: ['LnLzvqrcEY.globo', 'org.tizen.globoplayaria'], match: 'globoplay' },
    netflix: { name: 'Netflix', ids: ['org.tizen.netflix-app'], match: 'netflix', brand: 'netflix' },
    mercadoplay: { name: 'Mercado Play', ids: ['nbCEREFaoy.mercadoplay'], match: 'mercado ?play' },
    alexa: { name: 'Alexa', ids: ['AQKO41xyKP.AmazonAlexa'], match: 'alexa' },
    browser: { name: 'Navegador', ids: ['org.tizen.browser', 'com.samsung.tv.knox-browser'], match: 'internet|browser|navegador' }
  },
  dock: ['youtube', 'stremio', 'spotify', 'hbomax', 'pluto', 'globoplay', 'netflix', 'mercadoplay']
};
