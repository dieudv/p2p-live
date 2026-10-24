// Service worker for p2p-live.
// It only caches the app shell so the page opens fast and can be installed.
// Calls still need the internet: WebRTC signaling goes to the PeerJS server, which is never cached here.
// Bump CACHE_VERSION when you change the list of files below.
const CACHE_VERSION = 'v1';
const CACHE = 'p2p-live-' + CACHE_VERSION;
const PEERJS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'; // pinned, so safe to cache forever
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'icon.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    try { await cache.add(new Request(PEERJS, { mode: 'no-cors' })); } catch (_) {} // optional
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('p2p-live-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Page loads: network first so updates show up immediately, cached copy only when offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('index.html', copy)).catch(() => {});
        return res;
      } catch (_) {
        return (await caches.match('index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Same-origin static files: serve the cached copy, refresh it in the background.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const refresh = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      return cached || (await refresh) || Response.error();
    })());
    return;
  }

  // The pinned PeerJS script: cache first.
  if (req.url === PEERJS) {
    event.respondWith((async () => (await caches.match(req)) || fetch(req))());
  }
  // Everything else (signaling, STUN lookups, ...) goes straight to the network.
});
