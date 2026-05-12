const CACHE_NAME = 'oneclicktv-v1.1.0';
const PRECACHE = ['/', '/logo.jpg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET, API calls, and streaming URLs
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('api.arte.tv')) return;
  if (url.hostname.includes('epg.pw')) return;
  if (url.hostname.includes('raw.githubusercontent.com')) return;
  if (url.pathname.endsWith('.m3u8') || url.pathname.endsWith('.m3u')) return;
  if (url.pathname.endsWith('.ts')) return;

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (/\.(js|css|png|jpg|jpeg|svg|woff2?|ico)$/i.test(url.pathname) || url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('ui-avatars.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Network-first for HTML (app shell)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return response;
      }).catch(() => caches.match(e.request))
    );
  }
});
