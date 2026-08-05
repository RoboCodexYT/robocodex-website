const CACHE = 'robocodex-v2';
const PRECACHE = [
  '/',
  '/index.html',
  '/css/modern.css',
  '/css/style.css',
  '/js/app.js',
  '/js/script.js',
  '/js/pwa.js',
  '/js/path-viz.js',
  '/js/tuner.js',
  '/js/tts.js',
  '/app/components/field-svg.js',
  '/data/videos.json',
  '/data/guides.json',
  '/data/resources.json',
  '/data/paths.json',
  '/manifest.webmanifest',
  '/images/logo.png',
  '/content.html',
  '/guides.html',
  '/resources.html',
  '/stats.html',
  '/about.html',
  '/calculators.html',
  '/bookmarks.html',
  '/path-viz.html',
  '/tuner.html',
  '/course.html',
  '/404.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => null);
      return hit || net;
    })
  );
});
