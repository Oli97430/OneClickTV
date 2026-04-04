import axios from 'axios';

const IPTV_FR_PLAYLIST_URL = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/fr.m3u';

/** Chaînes ajoutées ou garanties (flux sans géo-blocage prioritaire) */
const EXTRA_CHANNELS = [
  {
    id: 'cnews-guaranteed',
    tvgId: 'CNews.fr',
    name: 'CNews',
    logo: '',
    url: 'https://raw.githubusercontent.com/Sibprod/streams/main/ressources/dm/py/hls/cnews.m3u8',
    category: 'Actualités',
  },
];

/**
 * Parse une ligne #EXTINF pour extraire le nom, l'id et le logo de la chaîne
 * Format: #EXTINF:-1 tvg-id="xxx" tvg-logo="https://..." group-title="yyy",Channel Name
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

/**
 * Déduplique les chaînes par nom normalisé, en gardant de préférence les URLs .m3u8
 */
function deduplicateChannels(channels) {
  const byKey = new Map();
  for (const ch of channels) {
    const key = ch.name
      .toLowerCase()
      .replace(/\s*\([^)]*\)\s*/g, '')
      .replace(/\s*\[[^\]]*\]\s*/g, '')
      .trim();
    const existing = byKey.get(key);
    const isHls = ch.url.toLowerCase().includes('.m3u8');
    if (!existing || (isHls && !existing.url.toLowerCase().includes('.m3u8'))) {
      byKey.set(key, { ...ch, name: ch.name.trim() });
    }
  }
  return Array.from(byKey.values());
}

/**
 * Assigne une catégorie à partir du nom de la chaîne
 */
function getCategory(name) {
  const n = name.toLowerCase();
  if (/bfm|cnews|franceinfo|france\s*24|euronews|lci|france\s*2|france\s*3|actualité|info|figaro|le\s*media|public\s*senat|20\s*minutes|africanews/.test(n)) return 'Actualités';
  if (/équipe|equipe|sport|equidia|africa\s*24\s*sport/.test(n)) return 'Sport';
  if (/mezzo|mouv|mtv|fun\s*radio|melody|radio\s*karaoke|rtl2|music/.test(n)) return 'Musique';
  return 'Généraliste';
}

/**
 * Récupère et parse la playlist M3U des chaînes francophones (iptv-org fr.m3u)
 * Ne garde que les flux .m3u8 (HLS)
 */
export async function fetchFrenchChannels() {
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
  const keyFor = (name) =>
    name
      .toLowerCase()
      .replace(/\s*\([^)]*\)\s*/g, '')
      .replace(/\s*\[[^\]]*\]\s*/g, '')
      .trim();
  for (const extra of EXTRA_CHANNELS) {
    const key = keyFor(extra.name);
    result = result.filter((c) => keyFor(c.name) !== key);
    result.unshift(extra);
  }
  return result;
}

/** Logos connus (fallback si tvg-logo absent) */
const KNOWN_LOGOS = {
  bfmtv: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/80/BFM_TV_logo_2016.svg/200px-BFM_TV_logo_2016.svg.png',
  cnews: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/68/CNews_logo_2017.svg/200px-CNews_logo_2017.svg.png',
  lci: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/8e/LCI_logo_2017.svg/200px-LCI_logo_2017.svg.png',
  france2: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/France_2_logo_2008.svg/200px-France_2_logo_2008.svg.png',
  france3: 'https://upload.wikimedia.org/wikipedia/fr/thumb/0/09/France_3.svg/200px-France_3.svg.png',
  france4: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/8f/France_4_logo_2014.svg/200px-France_4_logo_2014.svg.png',
  france5: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/74/France_5_logo_2002.svg/200px-France_5_logo_2002.svg.png',
  franceinfo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/2/2a/Franceinfo_logo_2016.svg/200px-Franceinfo_logo_2016.svg.png',
  france24: 'https://upload.wikimedia.org/wikipedia/fr/thumb/f/f6/France_24_logo_2011.svg/200px-France_24_logo_2011.svg.png',
  tf1: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/4c/TF1_logo_2013.svg/200px-TF1_logo_2013.svg.png',
  m6: 'https://upload.wikimedia.org/wikipedia/fr/thumb/9/93/M6_logo.svg/200px-M6_logo.svg.png',
  arte: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Arte_Logo_2011.svg/200px-Arte_Logo_2011.svg.png',
  lequipe: 'https://upload.wikimedia.org/wikipedia/fr/thumb/d/db/L%27%C3%89quipe_logo_2016.svg/200px-L%27%C3%89quipe_logo_2016.svg.png',
  gulli: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3e/Gulli_logo_2015.svg/200px-Gulli_logo_2015.svg.png',
  euronews: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Euronews_2022.svg/200px-Euronews_2022.svg.png',
  tv5monde: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/TV5MONDE_logo_2019.svg/200px-TV5MONDE_logo_2019.svg.png',
  mezzo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/45/Mezzo_logo_2015.svg/200px-Mezzo_logo_2015.svg.png',
  mtv: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/MTV_2021_logo.svg/200px-MTV_2021_logo.svg.png',
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
 * Retourne null si aucun logo trouvé.
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
    if (key.includes(logoKey) || logoKey.includes(key)) return url;
  }
  return null;
}

/**
 * URL avatar par initiales (toujours valide) pour les chaînes sans logo.
 */
export function getChannelFallbackLogoUrl(name) {
  const n = (name || '?').trim();
  const initial = n.slice(0, 2).toUpperCase().replace(/\s/g, '');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial || '?')}&size=128&background=1f2937&color=e5e5e5&bold=true`;
}
