// LingoBite Play Service Worker — makes the app installable and gives an offline shell.
// It deliberately does NOT cache game media (models, videos, sounds, art): those are large and change often,
// so they always come straight from the network. Bump CACHE_NAME to make every client drop its old cache.
const CACHE_NAME = 'lingobite-play-v1';
const SCOPE = self.registration.scope; // e.g. https://play.example.org/
const PRECACHE = ['logo-192.png', 'logo-512.png', 'apple-touch-icon.png', 'favicon.ico', 'manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.all(PRECACHE.map((p) => cache.add(new URL(p, SCOPE)).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only same-origin GETs. Supabase, Cloudinary and everything else go straight to the network.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Pages: network-first so a new deploy shows immediately; the cached shell is used only when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(new URL('index.html', SCOPE), copy));
          }
          return res;
        })
        .catch(() => caches.match(new URL('index.html', SCOPE)).then((r) => r || Response.error()))
    );
    return;
  }

  // Hashed build files (/assets/*) never change once published -> cache-first.
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
  }
  // Everything else (media, models, sounds, API-like files): not handled -> normal network behaviour.
});
