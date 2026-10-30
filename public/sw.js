/**
 * AgriScan PWA Service Worker (PS 11.1 - Offline AI Detection)
 *
 * Implements AGENTS.md Section 2 & Section 8:
 * - Offline-first caching for complete Airplane Mode functionality.
 * - Cache version dynamically tied to model version.
 * - Precaches ONNX int8 model, config, labels, and WASM binaries.
 * - Cache-first strategy for model and WASM assets for instant offline execution.
 */

const MODEL_VERSION = '0.1.0-placeholder';
const CACHE_NAME = `agriscan-cache-v${MODEL_VERSION}`;

// High-priority offline assets: ONNX models, WASM binaries, App Shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',

  // On-device ML Model files
  '/models/model_int8.onnx',
  '/models/config.json',
  '/models/labels.json',

  // WebAssembly Runtimes (Single-threaded & SIMD)
  '/ort/ort-wasm.wasm',
  '/ort/ort-wasm-simd.wasm',
  '/ort/ort-wasm-threaded.wasm',
  '/ort/ort-wasm-simd-threaded.wasm',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        // Cache core assets individually so single missing file doesn't fail whole install
        for (const asset of PRECACHE_ASSETS) {
          try {
            await cache.add(asset);
          } catch (err) {
            console.warn(`[SW] Note caching ${asset}:`, err);
          }
        }
      })
      .then(async () => {
        // Notify open tabs that model and wasm are ready offline
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({ type: 'MODEL_READY_OFFLINE', version: MODEL_VERSION });
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
            console.log('[SW] Deleting stale cache:', key);
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

  // 1. Navigation requests: Network-first, fallback to cached /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match('/index.html');
        return cached || new Response('Offline: Please connect once to load AgriScan.', { status: 503 });
      })
    );
    return;
  }

  // 2. Cache-First for /models/* and /ort/*.wasm (Fastest offline inference startup)
  if (url.pathname.startsWith('/models/') || url.pathname.startsWith('/ort/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate for app assets
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
