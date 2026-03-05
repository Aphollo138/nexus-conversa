const CACHE_NAME = 'nexus-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - caching resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serving cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like Firebase/API) unless they are images/fonts
  if (!event.request.url.startsWith(self.location.origin)) {
     return;
  }

  // Skip API requests if any (assuming /api prefix, but just to be safe, only cache known extensions)
  const fileExtension = event.request.url.split('.').pop();
  const staticExtensions = ['js', 'css', 'png', 'jpg', 'jpeg', 'svg', 'ico', 'json', 'woff2'];
  const isStatic = staticExtensions.includes(fileExtension);
  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    // Network First for HTML navigation to ensure fresh content
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  if (isStatic) {
    // Stale-While-Revalidate for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
  
  // Default: Network Only for everything else (API, etc.)
});

// Activate event - cleaning up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
