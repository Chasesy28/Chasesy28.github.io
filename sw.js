// Service Worker

const CACHE_NAME = 'silly-site-cache-v2';

// 1. file caching
// (These are the "core" files for your app to work offline)
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/Finder.html',
  '/Finder.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/styles.css',
  '/scripts.js'
];

// ---
// EVENT: install
// This runs when the service worker is first installed.
// ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  
  // Wait until the cache is opened and all core files are added
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        self.skipWaiting(); // Force the new service worker to activate
      })
      .catch((error) => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
});

// ---
// EVENT: activate
// This runs when the service worker becomes active.
// It's a good place to clean up old caches.
// ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME) // Find all caches that are NOT our new one
          .map((name) => caches.delete(name))    // Delete them
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// ---
// EVENT: fetch
// This runs every time your app requests a resource (like a page, script, or image).
// This code makes it "cache-first": it tries to get the file from the cache,
// and if it can't, it requests it from the network.
// ---
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 1. If we find it in the cache, return the cached response
        if (response) {
          console.log(`[Service Worker] Returning from cache: ${event.request.url}`);
          return response;
        }

        // 2. If not in cache, fetch it from the network
        console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
        return fetch(event.request)
          .then((networkResponse) => {
            // 2a. OPTIONAL: Cache the new response for next time
            // We need to clone the response because it's a "stream" and can only be used once
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log(`[Service Worker] Caching new resource: ${event.request.url}`);
              });
            
            // 2b. Return the response from the network
            return networkResponse;
          })
          .catch((error) => {
            // 3. If the network fails (e.g., offline)
            console.log('[Service Worker] Fetch failed: Internet Failed to connect:', error);
            // Notify clients about offline status
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({ type: 'OFFLINE', url: event.request.url });
              });
            });
          });
      })
  );
});
