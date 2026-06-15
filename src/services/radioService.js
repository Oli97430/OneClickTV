const RADIO_API = 'https://de1.api.radio-browser.info/json/stations/search';
const CACHE_KEY = 'oneclicktv_radios_v1';
const CACHE_TTL = 2 * 60 * 60 * 1000;

export async function fetchFrenchRadios() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  } catch {}

  const params = new URLSearchParams({
    language: 'french',
    limit: '120',
    order: 'clickcount',
    reverse: 'true',
    hidebroken: 'true',
  });

  const res = await fetch(`${RADIO_API}?${params}`, {
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error('Radio API error');
  const raw = await res.json();

  const seen = new Set();
  const radios = [];

  for (const s of raw) {
    if (!s.url_resolved) continue;
    const key = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);

    radios.push({
      id: `radio-${s.stationuuid}`,
      tvgId: '',
      name: s.name,
      displayName: s.name,
      logo: s.favicon || '',
      url: s.url_resolved,
      altUrls: [],
      category: 'Radio',
      country: (s.countrycode || '').toLowerCase(),
      geoBlocked: false,
      not247: false,
      isRadio: true,
    });
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: radios }));
  } catch {}

  return radios;
}
