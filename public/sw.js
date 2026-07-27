// EduBD Service Worker — caches shell + API responses
const CACHE = 'edubd-v1';
const SHELL = ['/', '/courses', '/blog', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first for API, cache-first for assets
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        // The Cache API only supports http/https requests — browser extensions
        // (chrome-extension://, moz-extension://, etc.) inject fetches that
        // would otherwise throw "Failed to execute 'put' on 'Cache'".
        const isCacheable = res.ok
          && e.request.method === 'GET'
          && url.protocol.startsWith('http');
        if (isCacheable) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      }))
    );
  }
});
