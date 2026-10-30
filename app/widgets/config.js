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
  // Pluto TV — unofficial guide API. `favorites` is a list of channel names (partial match, any case)
  // the card rotates through; if empty it uses the single `channel`, and if that's empty too it rotates
  // the first live channels. Ex.: favorites: ['MTV', 'Pluto Filmes', 'CNN', 'Comedy Central'].
  pluto: { favorites: ['Nickelodeon Clássicos', 'Nick Clássicos'], channel: '' },
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
    // `live` would be a deep link to the live Globo channel, but the Tizen Globoplay app
    // registers no public URI handler, so the tested URL just fell back to a normal launch.
    // Left empty (opens the app normally); set a real URI here if one is ever found.
    globoplay: { name: 'Globoplay', ids: ['LnLzvqrcEY.globo', 'org.tizen.globoplayaria'], match: 'globoplay', live: '' },
    netflix: { name: 'Netflix', ids: ['org.tizen.netflix-app'], match: 'netflix', brand: 'netflix' },
    mercadoplay: { name: 'Mercado Play', ids: ['nbCEREFaoy.mercadoplay'], match: 'mercado ?play' },
    alexa: { name: 'Alexa', ids: ['AQKO41xyKP.AmazonAlexa'], match: 'alexa' },
    browser: { name: 'Navegador', ids: ['org.tizen.browser', 'com.samsung.tv.knox-browser'], match: 'internet|browser|navegador' },
    // Apps grouped inside the "Apps" folder at the end of the grid.
    disneyplus: { name: 'Disney+', ids: ['MCmYXNxgcu.DisneyPlus'], match: 'disney' },
    primevideo: { name: 'Prime Video', ids: ['org.tizen.primevideo'], match: 'prime ?video' },
    appletv: { name: 'Apple TV', ids: ['com.samsung.tv.aria-video'], match: 'apple ?tv' },
    twitch: { name: 'Twitch', ids: ['Jz7aUrV2Q4.Twitch'], match: 'twitch' },
    sbt: { name: 'SBT+', ids: ['pZAXcloxTr.Sbt'], match: 'sbt' }
  },
  dock: ['youtube', 'stremio', 'spotify', 'hbomax', 'pluto', 'globoplay', 'netflix', 'mercadoplay'],
  // A folder tile (iOS-style) at the end of the grid that opens into an app grid.
  folder: { name: 'Apps', apps: ['disneyplus', 'primevideo', 'appletv', 'twitch', 'sbt'] }
};
