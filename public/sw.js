const cacheName = 'chord-formatter-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.add(new URL('./', self.registration.scope)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(name => name !== cacheName)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => cachedResponse || fetch(event.request).then(response => {
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(cacheName).then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      }))
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(new URL('./', self.registration.scope));
        }
        return Response.error();
      })
  );
});
