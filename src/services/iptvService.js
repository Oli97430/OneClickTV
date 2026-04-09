import axios from 'axios';

const IPTV_FR_PLAYLIST_URL = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/fr.m3u';
const CACHE_KEY = 'oneclicktv_cache_v2';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure

/** Chaînes ajoutées ou garanties (flux sans géo-blocage prioritaire) */
const EXTRA_CHANNELS = [
  {
    id: 'cnews-guaranteed',
    tvgId: 'CNews.fr',
    name: 'CNews',
    displayName: 'CNews',
    logo: '',
    url: 'https://raw.githubusercontent.com/Sibprod/streams/main/ressources/dm/py/hls/cnews.m3u8',
    category: 'Actualités',
    geoBlocked: false,
    not247: false,
  },
];

/**
 * Parse une ligne #EXTINF pour extraire le nom, l'id et le logo de la chaîne
 */
function parseExtinf(line) {
  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
  const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
  const nameMatch = line.match(/,(.+)$/);
  return {
    tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
    logo: tvgLogoMatch ? tvgLogoMatch[1].trim() : '',
    name: nameMatch ? nameMatch[1].trim() : '',
  };
}

/** Nom propre sans qualité ni tags : "France 2 (1080p) [Geo-blocked]" → "France 2" */
function getDisplayName(name) {
  return name
    .replace(/\s*\([^)]*\)\s*/g, '')
    .replace(/\s*\[[^\]]*\]\s*/g, '')
    .trim();
}

/** Score de préférence : HLS > non-HLS, non-bloqué > bloqué */
function channelScore(name, url) {
  const isHls = url.toLowerCase().includes('.m3u8');
  const isBlocked = /geo.?block/i.test(name);
  return (isHls ? 2 : 0) + (isBlocked ? 0 : 1);
}

/** Déduplique les chaînes par nom normalisé, en gardant celle avec le meilleur score */
function deduplicateChannels(channels) {
  const byKey = new Map();
  for (const ch of channels) {
    const key = ch.name
      .toLowerCase()
      .replace(/\s*\([^)]*\)\s*/g, '')
      .replace(/\s*\[[^\]]*\]\s*/g, '')
      .trim();
    const existing = byKey.get(key);
    if (!existing || channelScore(ch.name, ch.url) > channelScore(existing.name, existing.url)) {
      byKey.set(key, { ...ch, name: ch.name.trim() });
    }
  }
  return Array.from(byKey.values());
}

/** Assigne une catégorie à partir du nom */
function getCategory(name) {
  const n = name.toLowerCase();
  if (/bfm|cnews|franceinfo|france\s*24|euronews|lci|france\s*2|france\s*3|actualité|info|figaro|le\s*media|public\s*senat|20\s*minutes|africanews/.test(n)) return 'Actualités';
  if (/équipe|equipe|sport|equidia|africa\s*24\s*sport/.test(n)) return 'Sport';
  if (/mezzo|mouv|mtv|fun\s*radio|melody|radio\s*karaoke|rtl2|music/.test(n)) return 'Musique';
  return 'Généraliste';
}

/** Ordre de tri : chaînes majeures en premier, ensuite alphabétique */
const SORT_PRIORITY = [
  'france2', 'tf1', 'france3', 'france5', 'm6', 'arte', 'tmc', 'c8', 'w9', 'nrj12',
  'bfmtv', 'cnews', 'lci', 'franceinfo', 'france24', 'euronews', 'publicsenat', 'lcp',
  'gulli', 'disneyjr', 'nickelodeonjunior', 'nickelodeon',
  'equipe', 'equidia',
  'mezzo', 'melody', 'traceurban',
];

function getSortPriority(displayName) {
  const key = displayName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  const idx = SORT_PRIORITY.findIndex(p => key.startsWith(p) || p === key);
  return idx === -1 ? SORT_PRIORITY.length : idx;
}

/**
 * Récupère et parse la playlist M3U (avec cache localStorage TTL 1h).
 * @param {boolean} forceRefresh - Bypass le cache si true
 */
export async function fetchFrenchChannels(forceRefresh = false) {
  // Lecture du cache
  if (!forceRefresh) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.data;
      }
    } catch {}
  }

  const { data } = await axios.get(IPTV_FR_PLAYLIST_URL, {
    responseType: 'text',
    timeout: 15000,
  });

  const lines = data.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const channels = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].startsWith('#EXTINF:')) {
      const { tvgId, logo, name } = parseExtinf(lines[i]);
      i += 1;
      if (i < lines.length && lines[i] && !lines[i].startsWith('#')) {
        const url = lines[i].trim();
        if (url.toLowerCase().includes('.m3u8')) {
          channels.push({
            id: `${tvgId || name}-${url.slice(-20)}`.replace(/\s/g, '-'),
            tvgId,
            logo,
            name,
            url,
            category: getCategory(name),
          });
        }
      }
    }
    i += 1;
  }

  let result = deduplicateChannels(channels);

  // Enrichir avec displayName et flags
  result = result.map(ch => ({
    ...ch,
    displayName: getDisplayName(ch.name),
    geoBlocked: /geo.?block/i.test(ch.name),
    not247: /not\s*24\/7/i.test(ch.name),
  }));

  // Tri : priorité puis alphabétique
  result.sort((a, b) => {
    const pa = getSortPriority(a.displayName);
    const pb = getSortPriority(b.displayName);
    if (pa !== pb) return pa - pb;
    return a.displayName.localeCompare(b.displayName, 'fr');
  });

  // Injection des chaînes garanties (en tête)
  const keyFor = (name) =>
    name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').replace(/\s*\[[^\]]*\]\s*/g, '').trim();
  for (const extra of EXTRA_CHANNELS) {
    const key = keyFor(extra.name);
    result = result.filter((c) => keyFor(c.displayName) !== key);
    result.unshift(extra);
  }

  // Mise en cache
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result }));
  } catch {}

  return result;
}

/** Logos connus via CDN tv-logo/tv-logos */
const _CDN = 'https://cdn.jsdelivr.net/gh/tv-logo/tv-logos@main/countries';
const KNOWN_LOGOS = {
  // Actualités
  bfmtv: `${_CDN}/france/bfm-tv-fr.png`,
  bfm2: `${_CDN}/france/bfm-tv-fr.png`,
  bfmbusiness: `${_CDN}/france/bfm-business-fr.png`,
  bfmlyon: `${_CDN}/france/bfm-lyon-fr.png`,
  cnews: `${_CDN}/france/c-news-fr.png`,
  lci: `${_CDN}/france/lci-fr.png`,
  franceinfo: `${_CDN}/france/franceinfo-fr.png`,
  france24: `${_CDN}/france/france-24-fr.png`,
  euronews: `${_CDN}/international/euro-news-int.png`,
  africanews: `${_CDN}/international/euro-news-int.png`,
  publicsenat: `${_CDN}/france/public-senat-fr.png`,
  lcp: `${_CDN}/france/lcp-fr.png`,
  // Généraliste
  tf1: `${_CDN}/france/tf1-fr.png`,
  france2: `${_CDN}/france/france-2-fr.png`,
  france3: `${_CDN}/france/france-3-fr.png`,
  france4: `${_CDN}/france/france-4-fr.png`,
  france5: `${_CDN}/france/france-5-fr.png`,
  m6: `${_CDN}/france/m6-fr.png`,
  arte: `${_CDN}/france/arte-fr.png`,
  c8: `${_CDN}/france/c8-fr.png`,
  tmc: `${_CDN}/france/tmc-fr.png`,
  w9: `${_CDN}/france/w9-fr.png`,
  gulli: `${_CDN}/france/gulli-fr.png`,
  tv5monde: `${_CDN}/france/tv5-monde-fr.png`,
  nickelodeon: `${_CDN}/france/nickelodeon-fr.png`,
  nickelodeonjunior: `${_CDN}/france/nickelodeon-junior-fr.png`,
  disneyjr: `${_CDN}/france/disney-jr-fr.png`,
  nrj12: `${_CDN}/france/nrj-12-fr.png`,
  kto: `${_CDN}/france/kto-fr.png`,
  t18: `${_CDN}/france/t18-fr.png`,
  bsmart: `${_CDN}/france/b-smart-fr.png`,
  culturebox: `${_CDN}/france/culturebox-fr.png`,
  // Sport
  equipe: `${_CDN}/france/lequipe-fr.png`,
  equidia: `${_CDN}/france/equidia-fr.png`,
  // Musique
  mezzo: `${_CDN}/france/mezzo-fr.png`,
  melody: `${_CDN}/france/melody-fr.png`,
  mtv: `${_CDN}/united-states/mtv-us.png`,
  traceurban: `${_CDN}/france/trace-urban-fr.png`,
  tracegospel: `${_CDN}/france/trace-urban-fr.png`,
};

function normalizeForLogo(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, '')
    .replace(/\s*\[[^\]]*\]\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '');
}

/**
 * URL du logo : priorité au tvg-logo du flux M3U, sinon fallback sur logos connus.
 */
export function getChannelLogoUrl(tvgId, name, logo) {
  if (logo) return logo;
  const key = normalizeForLogo(name)
    .replace(/[^a-z0-9+']/g, '')
    .replace(/^l'/, '');
  if (!key) return null;
  const exact = KNOWN_LOGOS[key];
  if (exact) return exact;
  for (const [logoKey, url] of Object.entries(KNOWN_LOGOS)) {
    if (key.startsWith(logoKey)) return url;
  }
  return null;
}

/** Avatar par initiales (fallback garanti) */
export function getChannelFallbackLogoUrl(name) {
  const n = (name || '?').trim();
  const initial = n.slice(0, 2).toUpperCase().replace(/\s/g, '');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial || '?')}&size=128&background=1f2937&color=e5e5e5&bold=true`;
}
