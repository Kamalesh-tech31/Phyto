// Phyto PWA Service Worker - Offline-first agricultural assistant
const CACHE_NAME = 'phyto-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/fonts/fraunces.woff2',
  '/fonts/plus-jakarta-sans-400.woff2',
  '/fonts/plus-jakarta-sans-600.woff2',
  '/fonts/plus-jakarta-sans-700.woff2',
  '/fonts/noto-sans-tamil-400.woff2',
  '/fonts/noto-sans-tamil-700.woff2',
  '/fonts/noto-sans-malayalam-400.woff2',
  '/fonts/noto-sans-malayalam-700.woff2',
  '/fonts/noto-sans-devanagari-400.woff2',
  '/fonts/noto-sans-devanagari-700.woff2',
  '/fonts/noto-sans-telugu-400.woff2',
  '/fonts/noto-sans-telugu-700.woff2',
  '/assets/aistudio/1_e142a476.png',
  '/assets/aistudio/2_3f62c707.png',
  '/assets/aistudio/3_d21a62fa.png',
  '/assets/aistudio/4__d6647247.png',
  '/assets/aistudio/5_dbf3ab43.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to pre-cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For navigation requests, network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-while-revalidate for same-origin and static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
