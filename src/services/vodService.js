// ─── Arte v4 API ─────────────────────────────────────────────────────────────
const ARTE_HOME   = 'https://api.arte.tv/api/emac/v4/fr/web/pages/HOME/';
const ARTE_PLAYER = 'https://api.arte.tv/api/player/v2/config/fr';

const ZONE_MAP = [
  { id: 'films',            label: 'Films'          },
  { id: 'series',           label: 'Séries'         },
  { id: 'documentaires',    label: 'Documentaires'  },
  { id: 'incontournables',  label: 'Incontournables'},
  { id: 'concerts',         label: 'Concerts'       },
  { id: 'plus_vues',        label: 'Les plus vues'  },
  { id: 'histoire',         label: 'Histoire'       },
  { id: 'sciences',         label: 'Sciences'       },
  { id: 'culture',          label: 'Culture'        },
];

export const ARTE_CATEGORIES = ZONE_MAP;

let homeCache = null;
const HOME_TTL = 15 * 60 * 1000;

async function fetchHome() {
  if (homeCache && Date.now() - homeCache.ts < HOME_TTL) return homeCache.data;
  const res = await fetch(ARTE_HOME, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`Arte API ${res.status}`);
  const json = await res.json();
  homeCache = { ts: Date.now(), data: json };
  return json;
}

function arteImageUrl(raw, width = 400) {
  if (!raw) return '';
  return raw.replace('__SIZE__', `${width}x${Math.round(width * 9 / 16)}`);
}

function normalizeItem(raw) {
  return {
    id:          raw.programId || raw.id || '',
    programId:   raw.programId || raw.id || '',
    title:       raw.title || '',
    subtitle:    raw.subtitle || '',
    description: raw.shortDescription || raw.teaserText || '',
    duration:    raw.duration || 0,
    image:       arteImageUrl(raw.mainImage?.url),
    category:    raw.genre?.label || raw.kind?.label || '',
    source:      'arte',
    url:         null,
  };
}

export async function fetchArteVideos(zoneId = 'films') {
  const home = await fetchHome();
  const zone = (home.zones || []).find(z => z.code === zoneId);
  if (!zone) return { items: [], hasMore: false };
  const items = (zone.content?.data || [])
    .filter(d => d.programId && d.type === 'teaser')
    .map(normalizeItem);
  return { items, hasMore: false };
}

export async function resolveArteStream(programId) {
  const res = await fetch(`${ARTE_PLAYER}/${programId}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  const json = await res.json();
  const streams = json?.data?.attributes?.streams || [];
  if (!streams.length) return null;
  const vf = streams.find(s => s.versions?.some(v => v.code?.startsWith('VF'))) || streams[0];
  return vf.url;
}

export async function fetchArteProgramMeta(programId) {
  const res = await fetch(`${ARTE_PLAYER}/${programId}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  const json = await res.json();
  const attr = json?.data?.attributes;
  if (!attr) return null;
  const meta    = attr.metadata || {};
  const streams = attr.streams || [];
  const vf      = streams.find(s => s.versions?.some(v => v.code?.startsWith('VF'))) || streams[0];
  return {
    id:          meta.providerId || programId,
    programId:   meta.providerId || programId,
    title:       meta.title || '',
    subtitle:    meta.subtitle || '',
    description: meta.description || '',
    duration:    attr.duration?.seconds ?? 0,
    image:       meta.images?.[0]?.url || '',
    streamUrl:   vf?.url || null,
    source:      'arte',
  };
}

// ─── France TV ───────────────────────────────────────────────────────────────
export const FRANCETV_CHANNELS = [
  { id: 'france-2',    label: 'France 2',    url: 'https://www.france.tv/france-2/direct',   replay: 'https://www.france.tv/france-2/toutes-les-videos/' },
  { id: 'france-3',    label: 'France 3',    url: 'https://www.france.tv/france-3/direct',   replay: 'https://www.france.tv/france-3/toutes-les-videos/' },
  { id: 'france-4',    label: 'France 4',    url: 'https://www.france.tv/france-4/direct',   replay: 'https://www.france.tv/france-4/toutes-les-videos/' },
  { id: 'france-5',    label: 'France 5',    url: 'https://www.france.tv/france-5/direct',   replay: 'https://www.france.tv/france-5/toutes-les-videos/' },
  { id: 'france-info', label: 'Franceinfo',  url: 'https://www.france.tv/franceinfo/direct', replay: 'https://www.france.tv/franceinfo/toutes-les-videos/' },
  { id: 'france-o',    label: 'La 1ère',     url: 'https://www.france.tv/la-1ere/direct',    replay: 'https://www.france.tv/la-1ere/toutes-les-videos/' },
];

// ─── Utilitaires ─────────────────────────────────────────────────────────────
export function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m} min`;
}
