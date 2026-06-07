/* ============================================================
   IronLog - Service Worker
   Gives the app two superpowers:
     1. It can be installed to your home screen as a real app.
     2. It works offline, which matters in gyms with spotty signal.

   HOW UPDATES WORK:
     Whenever you change index.html or any other app file, bump the number in
     CACHE_VERSION below. Phones will throw away the old cached copy after the
     new service worker activates.
   ============================================================ */

const CACHE_VERSION = 'ironlog-v18';

/* The app shell: the core files the app is made of.
   Relative paths keep this working on GitHub Pages project URLs. */
const SHELL = [
  './',
  './index.html',
  './index-v2.html',
  './app-loader.js',
  './app-chunks/app.00.js',
  './app-chunks/app.01.js',
  './app-chunks/app.02.js',
  './app-chunks/app.03.js',
  './app-chunks/app.04.js',
  './app-chunks/app.05.js',
  './app-chunks/app.06.js',
  './app-chunks/app.07.js',
  './app-chunks/app.08.js',
  './app-chunks/app.09.js',
  './app-chunks/app.10.js',
  './app-chunks/app.11.js',
  './ironlog-patch.js',
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
    await self.skipWaiting();                                   // activate this patch release immediately
  })());
});

/* ---- UPDATE: let the app request activation for future versions ---- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
   Serve from cache instantly, then quietly refresh the cached copy from the
   network in the background for next time. */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only cache GET requests; everything else goes straight to the network.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache Supabase because that is live auth and workout data.
  if (url.hostname.endsWith('supabase.co')) return;

  if (isAppShellRequest(req, url)) {
    event.respondWith(appShellWithPatch(req, event));
    return;
  }

  event.respondWith(staleWhileRevalidate(req, event));
});

function isAppShellRequest(req, url) {
  return url.origin === self.location.origin &&
    (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
}

async function appShellWithPatch(req, event) {
  const shellReq = new Request(new URL('./index-v2.html', self.location.href).toString());
  const res = await staleWhileRevalidate(shellReq, event);
  const type = res.headers.get('Content-Type') || '';
  if (!type.includes('text/html')) return res;

  const html = await res.text();
  if (html.includes('ironlog-patch.js')) {
    return new Response(html, { status: res.status, statusText: res.statusText, headers: res.headers });
  }

  const patched = html.replace('</body>', '<script src="./ironlog-patch.js" defer></script></body>');
  const headers = new Headers(res.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(patched, { status: res.status, statusText: res.statusText, headers });
}

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req);

  const network = fetch(req)
    .then((res) => {
      // Store a fresh copy for normal or opaque cross-origin responses.
      if (res && (res.ok || res.type === 'opaque')) {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => null);

  // Cache hit: return it now and refresh in the background.
  if (cached) {
    event.waitUntil(network);
    return cached;
  }

  // Cache miss: wait for the network.
  const fresh = await network;
  if (fresh) return fresh;

  // Offline and not cached: if it is a page load, fall back to the app shell.
  if (req.mode === 'navigate') {
    const shell = await cache.match('./index-v2.html') || await cache.match('./index.html');
    if (shell) return shell;
  }

  return new Response('Offline - open IronLog once while online to cache it.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}
