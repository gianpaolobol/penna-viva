// Service worker minimo: l'app si apre anche offline (guscio in cache).
// Le chiamate all'intermediario non vengono mai messe in cache.
const CACHE = 'penna-viva-v1';
const GUSCIO = ['/', '/manifest.webmanifest', '/icona.svg', '/icona-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(GUSCIO)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && url.pathname.startsWith('/assets/')) {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
      }
      return res;
    }))
  );
});
