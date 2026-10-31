// Phyto PWA Service Worker - Offline-first agricultural assistant
const CACHE_NAME = 'phyto-cache-v4-v7-20261031';

const ENGLISH_AUDIO_ASSETS = [
  '/assets/audio/manifest.json',
  '/assets/audio/en/page_scan_home.mp3',
  '/assets/audio/en/page_photo_check.mp3',
  '/assets/audio/en/page_analyzing.mp3',
  '/assets/audio/en/page_result_uncertain.mp3',
  '/assets/audio/en/page_history.mp3',
  '/assets/audio/en/page_schemes.mp3',
  '/assets/audio/en/page_settings.mp3',
  '/assets/audio/en/voice_not_leaf.mp3',
  '/assets/audio/en/photo_check_notice_not_leaf.mp3',
  '/assets/audio/en/voice_not_plant.mp3',
  '/assets/audio/en/certainty_band_high.mp3',
  '/assets/audio/en/certainty_band_medium.mp3',
  '/assets/audio/en/certainty_band_low.mp3',
  '/assets/audio/en/also_possible_intro.mp3',
  '/assets/audio/en/grape_notice_voice.mp3',
  '/assets/audio/en/pest_notice_voice.mp3',
  '/assets/audio/en/corn_common_rust_overview.mp3',
  '/assets/audio/en/corn_gray_leaf_spot_overview.mp3',
  '/assets/audio/en/corn_healthy_overview.mp3',
  '/assets/audio/en/corn_northern_leaf_blight_overview.mp3',
  '/assets/audio/en/grape_black_rot_overview.mp3',
  '/assets/audio/en/grape_esca_overview.mp3',
  '/assets/audio/en/grape_leaf_blight_overview.mp3',
  '/assets/audio/en/pest_armyworm_overview.mp3',
  '/assets/audio/en/pest_asiatic_rice_borer_overview.mp3',
  '/assets/audio/en/pest_brown_planthopper_overview.mp3',
  '/assets/audio/en/pest_corn_borer_overview.mp3',
  '/assets/audio/en/pest_rice_leaf_roller_overview.mp3',
  '/assets/audio/en/potato_early_blight_overview.mp3',
  '/assets/audio/en/potato_healthy_overview.mp3',
  '/assets/audio/en/potato_late_blight_overview.mp3',
  '/assets/audio/en/tomato_bacterial_spot_overview.mp3',
  '/assets/audio/en/tomato_early_blight_overview.mp3',
  '/assets/audio/en/tomato_healthy_overview.mp3',
  '/assets/audio/en/tomato_late_blight_overview.mp3',
  '/assets/audio/en/tomato_leaf_mold_overview.mp3',
  '/assets/audio/en/tomato_septoria_leaf_spot_overview.mp3',
  '/assets/audio/en/tomato_yellow_leaf_curl_overview.mp3',
  '/assets/audio/en/tomato_early_blight_treatment.mp3',
  '/assets/audio/en/tomato_early_blight_prevention.mp3',
  '/assets/audio/en/tomato_late_blight_treatment.mp3',
  '/assets/audio/en/tomato_late_blight_prevention.mp3',
  '/assets/audio/en/tomato_healthy_treatment.mp3',
  '/assets/audio/en/tomato_healthy_prevention.mp3',
];

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  // Model Files
  '/models/tfjs_model/model.json',
  '/models/tfjs_model/group1-shard1of1.bin',
  '/models/tfjs_model/labels.json',
  '/models/tfjs_model/config.json',
  // Fonts
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
  // Sample leaves
  '/assets/aistudio/1_e142a476.png',
  '/assets/aistudio/2_3f62c707.png',
  '/assets/aistudio/3_d21a62fa.png',
  '/assets/aistudio/4__d6647247.png',
  '/assets/aistudio/5_dbf3ab43.png',
  // English audio precache (Directive 5)
  ...ENGLISH_AUDIO_ASSETS,
];

// Helper to cache an entire language's clips in the background (Directive 5)
async function cacheLanguageClips(lang) {
  if (!lang || lang === 'en') return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const manifestRes = await fetch('/assets/audio/manifest.json');
    if (!manifestRes.ok) return;
    const manifest = await manifestRes.json();
    const clipUrls = Object.keys(manifest.clips || {})
      .filter((k) => k.startsWith(`${lang}/`))
      .map((k) => `/assets/audio/${k}`);

    for (const url of clipUrls) {
      const existing = await cache.match(url);
      if (!existing) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            await cache.put(url, res);
          }
        } catch {
          // Ignore transient offline failures
        }
      }
    }
  } catch (err) {
    console.warn(`[SW] Background language cache failed for ${lang}:`, err);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache partial notification:', err);
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

// Background language cache message handler (Directive 5)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_LANGUAGE_CLIPS') {
    const lang = event.data.language;
    if (lang && lang !== 'en') {
      event.waitUntil(cacheLanguageClips(lang));
    }
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Navigation requests: fall back to /index.html offline
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

  // 2. Audio requests with Range header support for offline playback (Directive 5)
  if (url.pathname.startsWith('/assets/audio/')) {
    event.respondWith(
      caches.match(url.pathname).then(async (cachedResponse) => {
        if (cachedResponse) {
          const rangeHeader = event.request.headers.get('range');
          if (!rangeHeader) {
            return cachedResponse;
          }

          // Handle Range byte request offline
          try {
            const arrayBuffer = await cachedResponse.arrayBuffer();
            const bytesTotal = arrayBuffer.byteLength;
            const parts = rangeHeader.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : bytesTotal - 1;

            if (start >= bytesTotal || end >= bytesTotal) {
              return new Response(null, {
                status: 416,
                headers: { 'Content-Range': `bytes */${bytesTotal}` },
              });
            }

            const sliced = arrayBuffer.slice(start, end + 1);
            return new Response(sliced, {
              status: 206,
              statusText: 'Partial Content',
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Range': `bytes ${start}-${end}/${bytesTotal}`,
                'Content-Length': String(sliced.byteLength),
                'Accept-Ranges': 'bytes',
              },
            });
          } catch {
            return cachedResponse;
          }
        }

        // If not cached, fetch from network and cache
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

  // 3. Static assets & bundles: cache-first
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
        .catch(() => caches.match(event.request));
    })
  );
});
