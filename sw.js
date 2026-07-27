/* AMELIE·AI PRO-PLUS — Site Mate — service worker
   Caches the app shell so it opens instantly and works fully offline once loaded.
   Bump CACHE_NAME whenever you upload a new build so users pick up the new file. */

var CACHE_NAME = 'sitemate-rev01';

var CORE = [
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png'
];

// Install: pre-cache the core app files.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE);
    }).then(function () { return self.skipWaiting(); })
  );
});

// Activate: drop any old caches from previous builds.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Fetch: serve same-origin requests from cache first, fall back to network
// (and cache what comes back). The weather API and anything cross-origin
// always go straight to the network.
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // e.g. weather API — network only

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // offline and not cached — fall back to the app shell for navigations
        if (req.mode === 'navigate') return caches.match('index.html');
      });
    })
  );
});
