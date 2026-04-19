const EPG_BASE = 'https://epg.pw/api/epg.js';
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes

// Cache mémoire : tvgId → { ts, data }
const cache = new Map();

// File d'attente pour limiter les requêtes simultanées
let activeRequests = 0;
const MAX_CONCURRENT = 3;
const queue = [];

function drainQueue() {
  while (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const task = queue.shift();
    activeRequests++;
    doFetch(task.tvgId)
      .then(task.resolve)
      .catch(() => task.resolve(null))
      .finally(() => { activeRequests--; drainQueue(); });
  }
}

async function doFetch(tvgId) {
  const today = new Date().toISOString().slice(0, 10);
  const url = `${EPG_BASE}?channel_id=${encodeURIComponent(tvgId)}&lang=fr&date=${today}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  return res.json();
}

export function fetchChannelEpg(tvgId) {
  if (!tvgId) return Promise.resolve(null);

  const hit = cache.get(tvgId);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data);

  return new Promise((resolve) => {
    queue.push({
      tvgId,
      resolve: (data) => {
        if (data) cache.set(tvgId, { ts: Date.now(), data });
        resolve(data);
      },
    });
    drainQueue();
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
