// Phyto PWA Service Worker - Offline-first agricultural assistant
const CACHE_NAME = 'phyto-cache-v6-20261031';

const AUDIO_ASSETS = [
  '/assets/audio/manifest.json',
  // English clips
  '/assets/audio/en/page_scan_home.mp3',
  '/assets/audio/en/page_photo_check.mp3',
  '/assets/audio/en/page_analyzing.mp3',
  '/assets/audio/en/page_result_uncertain.mp3',
  '/assets/audio/en/page_history.mp3',
  '/assets/audio/en/page_schemes.mp3',
  '/assets/audio/en/page_settings.mp3',
  '/assets/audio/en/voice_not_leaf.mp3',
  '/assets/audio/en/tomato_early_blight_overview.mp3',
  '/assets/audio/en/tomato_early_blight_treatment.mp3',
  '/assets/audio/en/tomato_early_blight_prevention.mp3',
  '/assets/audio/en/tomato_late_blight_overview.mp3',
  '/assets/audio/en/tomato_late_blight_treatment.mp3',
  '/assets/audio/en/tomato_late_blight_prevention.mp3',
  '/assets/audio/en/tomato_healthy_overview.mp3',
  '/assets/audio/en/tomato_healthy_treatment.mp3',
  '/assets/audio/en/tomato_healthy_prevention.mp3',
  // Tamil clips
  '/assets/audio/ta/page_scan_home.mp3',
  '/assets/audio/ta/page_photo_check.mp3',
  '/assets/audio/ta/page_analyzing.mp3',
  '/assets/audio/ta/page_result_uncertain.mp3',
  '/assets/audio/ta/page_history.mp3',
  '/assets/audio/ta/page_schemes.mp3',
  '/assets/audio/ta/page_settings.mp3',
  '/assets/audio/ta/voice_not_leaf.mp3',
  '/assets/audio/ta/tomato_early_blight_overview.mp3',
  '/assets/audio/ta/tomato_early_blight_treatment.mp3',
  '/assets/audio/ta/tomato_early_blight_prevention.mp3',
  '/assets/audio/ta/tomato_late_blight_overview.mp3',
  '/assets/audio/ta/tomato_late_blight_treatment.mp3',
  '/assets/audio/ta/tomato_late_blight_prevention.mp3',
  '/assets/audio/ta/tomato_healthy_overview.mp3',
  '/assets/audio/ta/tomato_healthy_treatment.mp3',
  '/assets/audio/ta/tomato_healthy_prevention.mp3',
  // Malayalam clips
  '/assets/audio/ml/page_scan_home.mp3',
  '/assets/audio/ml/page_photo_check.mp3',
  '/assets/audio/ml/page_analyzing.mp3',
  '/assets/audio/ml/page_result_uncertain.mp3',
  '/assets/audio/ml/page_history.mp3',
  '/assets/audio/ml/page_schemes.mp3',
  '/assets/audio/ml/page_settings.mp3',
  '/assets/audio/ml/voice_not_leaf.mp3',
  '/assets/audio/ml/tomato_early_blight_overview.mp3',
  '/assets/audio/ml/tomato_early_blight_treatment.mp3',
  '/assets/audio/ml/tomato_early_blight_prevention.mp3',
  '/assets/audio/ml/tomato_late_blight_overview.mp3',
  '/assets/audio/ml/tomato_late_blight_treatment.mp3',
  '/assets/audio/ml/tomato_late_blight_prevention.mp3',
  '/assets/audio/ml/tomato_healthy_overview.mp3',
  '/assets/audio/ml/tomato_healthy_treatment.mp3',
  '/assets/audio/ml/tomato_healthy_prevention.mp3',
  // Hindi clips
  '/assets/audio/hi/page_scan_home.mp3',
  '/assets/audio/hi/page_photo_check.mp3',
  '/assets/audio/hi/page_analyzing.mp3',
  '/assets/audio/hi/page_result_uncertain.mp3',
  '/assets/audio/hi/page_history.mp3',
  '/assets/audio/hi/page_schemes.mp3',
  '/assets/audio/hi/page_settings.mp3',
  '/assets/audio/hi/voice_not_leaf.mp3',
  '/assets/audio/hi/tomato_early_blight_overview.mp3',
  '/assets/audio/hi/tomato_early_blight_treatment.mp3',
  '/assets/audio/hi/tomato_early_blight_prevention.mp3',
  '/assets/audio/hi/tomato_late_blight_overview.mp3',
  '/assets/audio/hi/tomato_late_blight_treatment.mp3',
  '/assets/audio/hi/tomato_late_blight_prevention.mp3',
  '/assets/audio/hi/tomato_healthy_overview.mp3',
  '/assets/audio/hi/tomato_healthy_treatment.mp3',
  '/assets/audio/hi/tomato_healthy_prevention.mp3',
  // Telugu base
  '/assets/audio/te/voice_not_leaf.mp3',
];

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/assets/labels.json',
  // UI Language Dictionaries
  '/assets/lang/ui_en.json',
  '/assets/lang/ui_ta.json',
  '/assets/lang/ui_hi.json',
  '/assets/lang/ui_ml.json',
  '/assets/lang/ui_te.json',
  // Disease Knowledge Base Dictionaries
  '/assets/kb/en.json',
  '/assets/kb/ta.json',
  '/assets/kb/hi.json',
  '/assets/kb/ml.json',
  '/assets/kb/te.json',
  // Offline Local Fonts
  '/assets/fonts/noto-sans-tamil.woff2',
  '/assets/fonts/noto-sans-devanagari.woff2',
  '/assets/fonts/noto-sans-malayalam.woff2',
  '/assets/fonts/noto-sans-telugu.woff2',
  '/assets/fonts/plus-jakarta-sans.woff2',
  '/assets/fonts/newsreader.woff2',
  // Offline Audio Suite
  ...AUDIO_ASSETS,
  // Leaf sample imagery
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
        console.warn('Pre-caching asset notification:', err);
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
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Navigation: cache-first fallback to /index.html for true offline usage
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        return (
          cached ||
          fetch(event.request).catch(() => caches.match('/index.html'))
        );
      })
    );
    return;
  }

  // Audio asset requests: match by pathname to serve Range requests cleanly offline
  if (url.pathname.startsWith('/assets/audio/')) {
    event.respondWith(
      caches.match(url.pathname).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(url.pathname, clone));
            }
            return networkResponse;
          })
          .catch(() => caches.match(url.pathname));
      })
    );
    return;
  }

  // Cache-first strategy for static assets and bundled modules
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an asset or json, try finding any cached match
          return caches.match(event.request);
        });
    })
  );
});
