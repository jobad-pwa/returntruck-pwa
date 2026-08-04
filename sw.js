// ReturnTruck Service Worker
const CACHE_NAME = 'returntruck-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/launchericon-192x192.png',
  '/launchericon-512x512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ All assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Only cache successful GET requests
            if (event.request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            // Fallback for offline - could show offline page
            console.log('⚠️ Offline - using cached version');
          });
      })
  );
});

// Handle push notifications (optional)
self.addEventListener('push', event => {
  const title = 'ReturnTruck';
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/launchericon-192x192.png',
    badge: '/launchericon-192x192.png',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
