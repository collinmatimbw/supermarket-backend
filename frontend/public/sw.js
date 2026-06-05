const CACHE_NAME = 'skyc-crm-v2';
const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/mylogo.png'];
const STATIC_EXT = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (url.origin !== self.location.origin || request.method !== 'GET') return;

  // API calls — network only (no offline data)
  if (url.pathname.startsWith('/api/')) return;

  // Static assets (JS, CSS, images) — cache-first: serve from cache, refresh in background
  if (STATIC_EXT.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Navigation / document requests — network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => caches.match(request) || caches.match('/index.html'))
    );
    return;
  }

  // Everything else — network-first, fallback to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
