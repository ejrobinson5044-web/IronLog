/* ============================================================
   IronLog — Service Worker
   Gives the app two superpowers:
     1. It can be installed to your home screen as a real app.
     2. It works OFFLINE (important — gyms are signal dead zones).

   HOW UPDATES WORK:
     Whenever you change index.html (or any file), bump the number in
     CACHE_VERSION below (v1 -> v2 -> v3...). That tells phones to throw
     away the old cached copy and pull your new version on next launch.
   ============================================================ */

const CACHE_VERSION = 'ironlog-v2';

/* The "app shell" — the core files the app is made of.
   Relative paths (./) so it works no matter what GitHub Pages URL it lives at. */
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

/* Third-party libraries the app loads from CDNs.
   Cached so the app still runs with zero signal. */
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

/* ---- INSTALL: download and cache the app for offline use ---- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(SHELL);                                  // these must succeed
    await Promise.allSettled(CDN.map((u) => cache.add(u)));     // best-effort
    await self.skipWaiting();                                   // activate immediately
  })());
});

/* ---- ACTIVATE: delete caches from older versions ---- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();                                 // control open tabs now
  })());
});

/* ---- FETCH: stale-while-revalidate ----
   Serve from cache instantly (fast + offline), then quietly refresh the
   cached copy from the network in the background for next time. */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only cache GET requests; everything else goes straight to the network.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // NEVER cache Supabase — that's your live auth + workout data. Always network.
  if (url.hostname.endsWith('supabase.co')) return;

  event.respondWith(staleWhileRevalidate(req, event));
});

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req);

  const network = fetch(req)
    .then((res) => {
      // store a fresh copy (normal or opaque cross-origin responses)
      if (res && (res.ok || res.type === 'opaque')) {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => null);

  // Cache hit → return it now, refresh in the background.
  if (cached) {
    event.waitUntil(network);
    return cached;
  }

  // Cache miss → wait for the network.
  const fresh = await network;
  if (fresh) return fresh;

  // Offline AND not cached → if it's a page load, fall back to the app shell.
  if (req.mode === 'navigate') {
    const shell = await cache.match('./index.html');
    if (shell) return shell;
  }
  return new Response('Offline — open IronLog once while online to cache it.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}
