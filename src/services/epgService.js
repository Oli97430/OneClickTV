const EPG_BASE = 'https://epg.pw/api/epg.json';
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes

const EPG_CHANNEL_IDS = {
  'TF1.fr': 443174,
  'France2.fr': 55812,
  'France3.fr': 55715,
  'France4.fr': 55005,
  'France5.fr': 54935,
  'M6.fr': 485681,
  'Arte.fr': 55730,
  'C8.fr': null,
  'CStar.fr': 55905,
  'TMC.fr': 55851,
  'TFX.fr': 55777,
  'W9.fr': 55815,
  '6ter.fr': 54986,
  'NRJ12.fr': null,
  'Gulli.fr': 55873,
  'LCI.fr': 459208,
  'Franceinfo.fr': 459183,
  'LEquipe.fr': 459179,
  'RMCDecouverte.fr': 54916,
  'RMCStory.fr': 54996,
  'Cherie25.fr': 443110,
  'TF1SeriesFilms.fr': 459284,
  'ParisPremiereHD.fr': 443208,
  'BFMTV.fr': 443114,
  'BFMBusiness.fr': 55723,
  'BFM2.fr': 448549,
  'CNews.fr': 51767,
  'France24.fr': 55716,
  'Euronews.fr': 52000,
  'i24News.fr': 55743,
  'LCP.fr': 448577,
  'CanalPlus.fr': 459189,
  'CanalPlusCinema.fr': 459192,
  'CanalPlusSport.fr': 516379,
  'CanalPlusSport360.fr': 516373,
  'CanalPlusFoot.fr': 516392,
  'CanalPlusGrandEcran.fr': 459259,
  'CanalPlusKids.fr': 516384,
  'CanalPlusDocs.fr': 516393,
  'CinePlusClassic.fr': 516387,
  'CinePlusEmotion.fr': 459252,
  'CinePlusFamily.fr': 516425,
  'CinePlusFestival.fr': 459273,
  'CinePlusFrisson.fr': 516420,
  'OCS.fr': 448567,
  'TCMCinema.fr': 55769,
  'Action.fr': 54887,
  'SerieClub.fr': 51905,
  'beINSports1.fr': 55773,
  'beINSports2.fr': 443147,
  'beINSports3.fr': 54963,
  'RMCSport1.fr': 54815,
  'InfosportPlus.fr': 459178,
  'Equidia.fr': 55906,
  'CanalJ.fr': 56008,
  'Tiji.fr': 443107,
  'Nickelodeon.fr': 55732,
  'DisneyChannel.fr': 516400,
  'DisneyJunior.fr': 516429,
  'CartoonNetwork.fr': 443250,
  'Boomerang.fr': 89907,
  'Mangas.fr': 54862,
  'NationalGeographic.fr': 516394,
  'NatGeoWild.fr': 526195,
  'PlanetePlus.fr': 459258,
  'DiscoveryChannel.fr': 443233,
  'DiscoveryInvestigation.fr': 55742,
  'Histoire.fr': 459200,
  'TouteLHistoire.fr': 51894,
  'ScienceEtVie.fr': 516410,
  'UshuaiaTV.fr': 56041,
  'Voyage.fr': 55754,
  'Museum.fr': 516370,
  'Teva.fr': 443177,
  'ComedyCentral.fr': 55856,
  'Syfy.fr': 443191,
  '13emeRue.fr': 443137,
  'WarnerTV.fr': 448585,
  'AB1.fr': 53970,
  'Novelas.fr': 66912,
  'MCM.fr': 55950,
  'MTV.fr': 55718,
  'M6Music.fr': 516403,
  'NRJHits.fr': 443214,
  'TraceUrban.fr': 55944,
  'Mezzo.fr': 451926,
  'MezzoLive.fr': 55821,
  'RFMTV.fr': 55845,
  'KTO.fr': 55952,
  'TV5Monde.fr': 54020,
  'TV5MondeFBS.fr': 459217,
  'RTL9.fr': 443178,
  'AutomotoLaChaine.fr': 55799,
  'SportEnFrance.fr': 55941,
  'La1ere.fr': 403214,
  'LaChaineMeteo.fr': 459210,
};

const cache = new Map();

let batchQueue = [];
let batchTimer = null;
const BATCH_DELAY = 150;
const MAX_CONCURRENT = 4;
let activeRequests = 0;
const fetchQueue = [];

function scheduleBatch() {
  if (batchTimer) return;
  batchTimer = setTimeout(flushBatch, BATCH_DELAY);
}

function flushBatch() {
  batchTimer = null;
  const pending = batchQueue.splice(0);
  for (const item of pending) {
    fetchQueue.push(item);
  }
  drainFetchQueue();
}

function drainFetchQueue() {
  while (fetchQueue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const task = fetchQueue.shift();
    activeRequests++;
    doFetch(task.tvgId)
      .then(task.resolve)
      .catch(() => task.resolve(null))
      .finally(() => { activeRequests--; drainFetchQueue(); });
  }
}

function resolveChannelId(tvgId) {
  if (EPG_CHANNEL_IDS[tvgId] != null) return EPG_CHANNEL_IDS[tvgId];
  const base = tvgId.replace(/@.*$/, '');
  if (EPG_CHANNEL_IDS[base] != null) return EPG_CHANNEL_IDS[base];
  return null;
}

function normalizeEpgList(epgList) {
  if (!epgList?.length) return [];
  const programmes = [];
  for (let i = 0; i < epgList.length; i++) {
    const item = epgList[i];
    const start = item.start_date;
    const stop = i + 1 < epgList.length
      ? epgList[i + 1].start_date
      : new Date(new Date(start).getTime() + 2 * 60 * 60 * 1000).toISOString();
    programmes.push({
      start,
      stop,
      title: item.title || '',
      desc: item.desc || '',
    });
  }
  return programmes;
}

async function doFetch(tvgId) {
  const numericId = resolveChannelId(tvgId);
  if (!numericId) return null;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const url = `${EPG_BASE}?channel_id=${numericId}&date=${today}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.error_code === -1 && json.error_message) return null;
  const programme = normalizeEpgList(json.epg_list);
  return programme.length ? { programme } : null;
}

export function fetchChannelEpg(tvgId) {
  if (!tvgId) return Promise.resolve(null);

  const hit = cache.get(tvgId);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data);

  return new Promise((resolve) => {
    batchQueue.push({
      tvgId,
      resolve: (data) => {
        if (data) cache.set(tvgId, { ts: Date.now(), data });
        resolve(data);
      },
    });
    scheduleBatch();
  });
}

export function getCurrentProgram(epgData) {
  if (!epgData?.programme?.length) return null;
  const now = Date.now();
  return epgData.programme.find((p) => {
    const start = new Date(p.start).getTime();
    const stop = new Date(p.stop).getTime();
    return start <= now && stop > now;
  }) ?? null;
}

export function getNextProgram(epgData) {
  if (!epgData?.programme?.length) return null;
  const now = Date.now();
  return epgData.programme.find((p) => new Date(p.start).getTime() > now) ?? null;
}

export function getProgramProgress(program) {
  if (!program) return 0;
  const now = Date.now();
  const start = new Date(program.start).getTime();
  const stop = new Date(program.stop).getTime();
  const total = stop - start;
  return total > 0 ? Math.min(100, Math.max(0, ((now - start) / total) * 100)) : 0;
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  return new Date(timeStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function minutesUntil(program) {
  if (!program) return Infinity;
  return Math.max(0, Math.round((new Date(program.start).getTime() - Date.now()) / 60000));
}

export function hasEpgMapping(tvgId) {
  return resolveChannelId(tvgId) !== null;
}
