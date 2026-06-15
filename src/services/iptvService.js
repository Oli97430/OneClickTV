import axios from 'axios';

const IPTV_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/languages/fra.m3u';
const CACHE_KEY = 'oneclicktv_cache_v3';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure

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

/** Map iptv-org group-title → catégorie OneClickTV */
const CATEGORY_MAP = {
  News: 'Actualités',
  Weather: 'Actualités',
  Business: 'Actualités',
  Legislative: 'Actualités',
  Sports: 'Sport',
  Music: 'Musique',
  Movies: 'Cinéma',
  Series: 'Cinéma',
  Classic: 'Cinéma',
  Kids: 'Enfants',
  Animation: 'Enfants',
  Family: 'Enfants',
  Documentary: 'Culture',
  Education: 'Culture',
  Science: 'Culture',
  Culture: 'Culture',
  Travel: 'Culture',
  General: 'Généraliste',
  Entertainment: 'Généraliste',
  Comedy: 'Généraliste',
  Lifestyle: 'Généraliste',
  Religious: 'Généraliste',
  Relax: 'Généraliste',
  Outdoor: 'Généraliste',
  Auto: 'Généraliste',
  Cooking: 'Généraliste',
  Shop: null,
  XXX: null,
};

function parseExtinf(line) {
  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
  const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
  const groupTitleMatch = line.match(/group-title="([^"]*)"/);
  const nameMatch = line.match(/,(.+)$/);
  return {
    tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
    logo: tvgLogoMatch ? tvgLogoMatch[1].trim() : '',
    groupTitle: groupTitleMatch ? groupTitleMatch[1] : '',
    name: nameMatch ? nameMatch[1].trim() : '',
  };
}

function getDisplayName(name) {
  return name
    .replace(/\s*\([^)]*\)\s*/g, '')
    .replace(/\s*\[[^\]]*\]\s*/g, '')
    .trim();
}

function channelScore(name, url) {
  const isHls = url.toLowerCase().includes('.m3u8');
  let score = isHls ? 2 : 0;
  if (/1080p/i.test(name)) score += 4;
  else if (/720p/i.test(name)) score += 3;
  else if (/480p/i.test(name)) score += 2;
  else if (/360p/i.test(name)) score += 1;
  return score;
}

function deduplicateChannels(channels) {
  const byKey = new Map();
  for (const ch of channels) {
    const key = getDisplayName(ch.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...ch, altUrls: [] });
    } else {
      if (channelScore(ch.name, ch.url) > channelScore(existing.name, existing.url)) {
        existing.altUrls.push(existing.url);
        existing.url = ch.url;
        existing.logo = ch.logo || existing.logo;
        existing.name = ch.name;
      } else {
        existing.altUrls.push(ch.url);
      }
    }
  }
  return Array.from(byKey.values());
}

function getCategory(name, groupTitle) {
  if (groupTitle) {
    const first = groupTitle.split(';')[0].trim();
    const mapped = CATEGORY_MAP[first];
    if (mapped !== undefined) return mapped;
  }
  const n = name.toLowerCase();
  if (/bfm|cnews|franceinfo|france\s*24|euronews|lci|actualité|info|figaro|le\s*media|public\s*senat|20\s*minutes|africanews/.test(n)) return 'Actualités';
  if (/équipe|equipe|sport|equidia/.test(n)) return 'Sport';
  if (/mezzo|mouv|mtv|fun\s*radio|melody|radio\s*karaoke|rtl2|music|trace/.test(n)) return 'Musique';
  if (/disney|nick|gulli|cartoon|boomerang|tiji|piwi|ludo/.test(n)) return 'Enfants';
  if (/arte|documentary|histoire|science|culture|national\s*geo/.test(n)) return 'Culture';
  if (/cinema|ciné|film|movie|série|series|paramount|tcm|action/.test(n)) return 'Cinéma';
  return 'Généraliste';
}

const SORT_PRIORITY = [
  'france2', 'tf1', 'france3', 'france5', 'm6', 'arte', 'tmc', 'c8', 'w9', 'nrj12',
  'bfmtv', 'cnews', 'lci', 'franceinfo', 'france24', 'euronews', 'publicsenat', 'lcp',
  'gulli', 'disneyjr', 'nickelodeonjunior', 'nickelodeon',
  'equipe', 'equidia',
  'mezzo', 'melody', 'traceurban',
  'tv5monde', 'tv5mondeafrique', 'rts', 'rtbf', 'rfi', 'canal',
];

function getSortPriority(displayName) {
  const key = displayName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  const idx = SORT_PRIORITY.findIndex(p => key.startsWith(p) || p === key);
  return idx === -1 ? SORT_PRIORITY.length : idx;
}

/**
 * Récupère et parse la playlist M3U iptv-org (languages/fra.m3u).
 * Cache localStorage TTL 1h.
 */
export async function fetchFrenchChannels(forceRefresh = false) {
  if (!forceRefresh) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.data;
      }
    } catch {}
  }

  const { data } = await axios.get(IPTV_PLAYLIST_URL, {
    responseType: 'text',
    timeout: 20000,
  });

  const lines = data.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const channels = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].startsWith('#EXTINF:')) {
      const { tvgId, logo, groupTitle, name } = parseExtinf(lines[i]);
      i += 1;
      // Skip #EXTVLCOPT and other directives
      while (i < lines.length && lines[i].startsWith('#')) i += 1;
      if (i < lines.length && lines[i] && !lines[i].startsWith('#')) {
        const url = lines[i].trim();
        const cat = getCategory(name, groupTitle);
        if (cat !== null && url.toLowerCase().includes('.m3u8')) {
          const baseTvgId = tvgId.replace(/@(HD|SD|FHD|UHD|Plus\d*)$/i, '');
          channels.push({
            id: `${baseTvgId || name}-${url.slice(-20)}`.replace(/\s/g, '-'),
            tvgId: baseTvgId,
            logo,
            name,
            url,
            category: cat,
          });
        }
      }
    }
    i += 1;
  }

  let result = deduplicateChannels(channels);

  result = result.map(ch => ({
    ...ch,
    displayName: getDisplayName(ch.name),
    geoBlocked: /geo.?block/i.test(ch.name),
    not247: /not\s*24\/7/i.test(ch.name),
  }));

  result.sort((a, b) => {
    const pa = getSortPriority(a.displayName);
    const pb = getSortPriority(b.displayName);
    if (pa !== pb) return pa - pb;
    return a.displayName.localeCompare(b.displayName, 'fr');
  });

  const keyFor = (name) =>
    name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').replace(/\s*\[[^\]]*\]\s*/g, '').trim();
  for (const extra of EXTRA_CHANNELS) {
    const key = keyFor(extra.name);
    result = result.filter((c) => keyFor(c.displayName) !== key);
    result.unshift(extra);
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result }));
  } catch {}

  return result;
}

/** Logos connus via CDN tv-logo/tv-logos (fallback si tvg-logo absent) */
const _CDN = 'https://cdn.jsdelivr.net/gh/tv-logo/tv-logos@main/countries';
const KNOWN_LOGOS = {
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
  equipe: `${_CDN}/france/lequipe-fr.png`,
  equidia: `${_CDN}/france/equidia-fr.png`,
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

export function getChannelFallbackLogoUrl(name) {
  const n = (name || '?').trim();
  const initial = n.slice(0, 2).toUpperCase().replace(/\s/g, '');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial || '?')}&size=128&background=1f2937&color=e5e5e5&bold=true`;
}
