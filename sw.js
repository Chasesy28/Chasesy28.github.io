// Service Worker

const CACHE_NAME = 'silly-site-cache-v3';

// 1. file caching
// (These are the "core" files for your app to work offline)
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/Finder.html',
  '/Finder.js',
  '/test.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/styles.css',
  '/finder-styles.css',
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
// Strategy: Network-first with cache fallback for better coordination with Cloudflare edge caching
// ---
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Use an async function to make control flow clearer and ensure a Response is always returned
  event.respondWith((async () => {
    try {
      // For navigation requests (page loads), always prefer network to get fresh content from Cloudflare
      if (event.request.mode === 'navigate') {
        try {
          const networkResp = await fetch(event.request);
          // Update the cache with the latest content from Cloudflare edge
          const copy = networkResp.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, copy).catch(() => { });
          return networkResp;
        } catch (err) {
          // Network failed — try to return cached index or root
          const cached = await caches.match(event.request) || 
                         await caches.match('/index.html') || 
                         await caches.match('/');
          if (cached) return cached;
          return new Response('<h1>Offline</h1><p>The application is offline.</p>', { status: 503, headers: { 'Content-Type': 'text/html' } });
        }
      }

      // For static assets: try network first with quick timeout, then fall back to cache
      // This allows Cloudflare edge updates to reach the browser while still supporting offline
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const networkResponse = await fetch(event.request, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        // Cache successful responses from Cloudflare
        if (networkResponse && networkResponse.status === 200) {
          try {
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, responseToCache).catch(() => { });
          } catch (e) {
            // ignore cache failures
          }
        }
        return networkResponse;
      } catch (networkErr) {
        // Network failed or timed out - try cache
        const cachedResp = await caches.match(event.request);
        if (cachedResp) {
          return cachedResp;
        }
        throw networkErr; // Re-throw to be caught by outer catch
      }

    } catch (finalErr) {
      // As a last resort, return a generic offline response
      console.error('[Service Worker] Final fetch error:', finalErr);
      
      // Try to serve a cached fallback for failed requests
      const cachedFallback = await caches.match(event.request);
      if (cachedFallback) {
        return cachedFallback;
      }
      
      return new Response('Service Unavailable', { status: 503 });
    }
  })());
});
