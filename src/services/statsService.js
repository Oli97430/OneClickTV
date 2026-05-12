// ─── Stats de visionnage locales ─────────────────────────────────────────────
const STATS_KEY = 'oneclicktv_stats';

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}'); } catch { return {}; }
}

function saveStats(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
}

let _interval = null;
let _startTime = null;
let _channelId = null;

/** Démarre le suivi quand un player est ouvert */
export function startTracking(channelId) {
  stopTracking();
  _channelId = channelId;
  _startTime = Date.now();
  _interval = setInterval(flush, 30_000); // flush every 30s
}

/** Arrête le suivi et flush les stats */
export function stopTracking() {
  flush();
  clearInterval(_interval);
  _interval = null;
  _startTime = null;
  _channelId = null;
}

function flush() {
  if (!_startTime || !_channelId) return;
  const elapsed = Math.floor((Date.now() - _startTime) / 1000);
  if (elapsed < 5) return; // ignore < 5s

  const stats = loadStats();
  const month = getMonthKey();
  if (!stats[month]) stats[month] = { total: 0, channels: {} };
  stats[month].total += elapsed;
  stats[month].channels[_channelId] = (stats[month].channels[_channelId] || 0) + elapsed;
  saveStats(stats);
  _startTime = Date.now(); // reset for next flush
}

/** Retourne les stats du mois en cours */
export function getMonthlyStats() {
  const stats = loadStats();
  const month = getMonthKey();
  const data = stats[month] || { total: 0, channels: {} };
  return {
    totalSeconds: data.total,
    totalFormatted: formatWatchTime(data.total),
    topChannels: Object.entries(data.channels)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, seconds]) => ({ id, seconds, formatted: formatWatchTime(seconds) })),
  };
}

export function formatWatchTime(seconds) {
  if (!seconds || seconds < 60) return '< 1 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m} min`;
}
