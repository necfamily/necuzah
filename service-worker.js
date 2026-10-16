const CACHE_NAME = 'necuzah-super-abacus-v2';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './adventure-map.html',
  './learner-profile.html',
  './rod-training.html',
  './NECUZAH_Adventure_Connected_v2.html',
  './NECUZAH_Talking_Hybrid_Abacus_v5.html',
  './styles/main.css'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(
      APP_FILES.map(async file => {
        try {
          const response = await fetch(file);

          if (response.ok) {
            await cache.put(file, response);
          }
        } catch (error) {
          console.warn('Could not cache:', file);
        }
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith('necuzah-super-abacus-') &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response.clone()).catch(() => {});
      }

      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        return await cache.match('./index.html') ||
          new Response(
            'NECUZAH is offline. Please reconnect to the internet and open the app once before using it offline.',
            {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            }
          );
      }

      return new Response('This resource is not available offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
