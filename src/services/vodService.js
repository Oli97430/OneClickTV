// ─── Arte ────────────────────────────────────────────────────────────────────
const ARTE_API   = 'https://api.arte.tv/api/emac/v3/fr/web/data';
const ARTE_PLAYER = 'https://api.arte.tv/api/player/v2/config/fr';

export const ARTE_CATEGORIES = [
  { id: 'VIDEOS_RECENT',    label: 'Récents'         },
  { id: 'MOST_VIEWED',      label: 'Les plus vus'    },
  { id: 'LAST_CHANCE',      label: 'Derniers jours'  },
  { id: 'CATEGORY_CIN',     label: 'Cinéma'          },
  { id: 'CATEGORY_DOR',     label: 'Documentaires'   },
  { id: 'CATEGORY_SER',     label: 'Séries'          },
  { id: 'ARTE_CONCERT',     label: 'Concerts'        },
  { id: 'CATEGORY_CPO',     label: 'Culture & Pop'   },
  { id: 'CATEGORY_HIS',     label: 'Histoire'        },
  { id: 'CATEGORY_SCI',     label: 'Sciences'        },
];

const arteCache = new Map(); // key → { ts, data }
const ARTE_TTL  = 15 * 60 * 1000; // 15 min

/**
 * Récupère une page de vidéos Arte par catégorie.
 * Retourne { items, hasMore }
 */
export async function fetchArteVideos(categoryId = 'VIDEOS_RECENT', page = 1, pageSize = 20) {
  const key = `${categoryId}-${page}`;
  const hit = arteCache.get(key);
  if (hit && Date.now() - hit.ts < ARTE_TTL) return hit.data;

  const url = `${ARTE_API}/${categoryId}/?page=${page}&pageSize=${pageSize}&arteLanguage=fr`;
  const res  = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Arte API ${res.status}`);

  const json  = await res.json();
  const items = (json.data || []).map(normalizeArteItem);
  const result = { items, hasMore: !!json.nextPage };

  arteCache.set(key, { ts: Date.now(), data: result });
  return result;
}

function normalizeArteItem(raw) {
  const img = raw.mainImage?.url || raw.teaserImage?.url || '';
  return {
    id:          raw.programId || raw.id || '',
    programId:   raw.programId || raw.id || '',
    title:       raw.title || '',
    subtitle:    raw.subtitle || '',
    description: raw.shortDescription || raw.description || '',
    duration:    raw.duration?.seconds ?? raw.duration ?? 0,
    image:       img,
    category:    raw.kind?.label || raw.genre?.label || '',
    source:      'arte',
    url:         null, // résolu à la demande
  };
}

/**
 * Résout l'URL de stream HLS d'un programme Arte.
 * Retourne l'URL HLS ou null.
 */
export async function resolveArteStream(programId) {
  const res  = await fetch(`${ARTE_PLAYER}/${programId}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  const json = await res.json();

  const attr    = json?.data?.attributes;
  const streams = attr?.streams || [];
  if (!streams.length) return null;

  // Préférer version française (VF), sinon première dispo
  const vf = streams.find(s => s.versions?.some(v => v.code?.startsWith('VF'))) || streams[0];
  return vf.url;
}

/**
 * Récupère les métadonnées complètes d'un programme Arte (pour le lecteur).
 */
export async function fetchArteProgramMeta(programId) {
  const res  = await fetch(`${ARTE_PLAYER}/${programId}`, { signal: AbortSignal.timeout(10_000) });
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
    rightsEnd:   attr.rights?.end || null,
    streamUrl:   vf?.url || null,
    source:      'arte',
  };
}

// ─── France TV ───────────────────────────────────────────────────────────────
// France TV n'expose pas d'API catalogue publique.
// On expose des liens directs vers leur site replay (ouvert via InAppBrowser).

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
