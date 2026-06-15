const HEALTH_CACHE_TTL = 5 * 60 * 1000;
const MAX_CONCURRENT = 3;
const CHECK_TIMEOUT = 6000;

const healthCache = new Map();
let checking = false;

export function getStreamHealth(url) {
  const hit = healthCache.get(url);
  if (hit && Date.now() - hit.ts < HEALTH_CACHE_TTL) return hit.alive;
  return null;
}

async function probe(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(CHECK_TIMEOUT),
    });
    return res.ok || res.type === 'opaque';
  } catch {
    return false;
  }
}

export async function checkAllStreams(channels, onUpdate) {
  if (checking) return;
  checking = true;

  const queue = channels.filter((ch) => {
    const hit = healthCache.get(ch.url);
    return !hit || Date.now() - hit.ts >= HEALTH_CACHE_TTL;
  });

  let active = 0;
  let idx = 0;

  function next() {
    while (idx < queue.length && active < MAX_CONCURRENT) {
      const ch = queue[idx++];
      active++;
      probe(ch.url).then((alive) => {
        healthCache.set(ch.url, { ts: Date.now(), alive });
        active--;
        onUpdate?.(ch.url, alive);
        next();
      });
    }
    if (active === 0 && idx >= queue.length) checking = false;
  }

  next();
}

export function getHealthStats() {
  let alive = 0;
  let dead = 0;
  for (const v of healthCache.values()) {
    if (v.alive) alive++;
    else dead++;
  }
  return { alive, dead, total: alive + dead };
}
