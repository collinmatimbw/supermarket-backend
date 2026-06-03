const CACHE_NAME = 'skyc-crm-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/mylogo.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  // Only cache same-origin GET requests (app shell/assets)
  if (url.origin !== self.location.origin || request.method !== 'GET') return;
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
