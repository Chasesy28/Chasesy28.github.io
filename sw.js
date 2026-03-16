/**
 * Service Worker for Silly Site
 * Implements network-first caching strategy with offline fallback
 * Works in coordination with Cloudflare edge caching for optimal performance
 */

// Automatic cache versioning with timestamp - update this when deploying new versions
// This ensures users get fresh content when the site is updated
const CACHE_VERSION = "7";
const CACHE_TIMESTAMP = "2026-03-16T04:09:51Z"; // Update this timestamp when deploying
const CACHE_NAME = `silly-site-cache-v${CACHE_VERSION}-${CACHE_TIMESTAMP}`;

/**
 * Core application files to cache for offline functionality
 * These files are essential for the app to work without a network connection
 */
const URLS_TO_CACHE = [
  // Core pages
  "/",
  "/index.html",
  "/manifest.json",

  // Static assets
  "/styles.css",
  "/scripts.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",

  // Finder project
  "/projects/Finder/Finder.html",
  "/projects/Finder/Finder.js",
  "/projects/Finder/finder-styles.css",

  // Pop-ups projects
  "/projects/Pop-ups/Pop-Up.html",
  "/projects/Pop-ups/Evil-popup.html",
  "/projects/Pop-ups/Popup-Test.html",

  // WebGL projects
  "/projects/WebGl-Test/gl.html",
  "/projects/WebGl-Test/webgl-test.js",
  "/projects/WebGl-Test/init-buffer.js",
  "/projects/WebGl-Test/draw-scene.js",
  "/projects/WebGl-Test/threejs-test.html",
  "/projects/WebGl-Test/threejs-test.js",
  "/projects/WebGl-Test/blender-app.html",
  "/projects/WebGl-Test/blender-app.js",

  // Game projects
  "/projects/Games/BulletHell/bulletHell.html",
  "/projects/Games/BulletHell/bulletHell.js",
  "/projects/Games/BulletHell/bulletHell.css",
  "/projects/Games/Pong/Pong.html",
  "/projects/Games/Pong/Pong.js",
  "/projects/Games/Pong/Pong.css",
];

/**
 * INSTALL EVENT
 * Fired when service worker is first installed
 * Caches all core files needed for offline functionality
 */
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install event triggered");

  // Wait until cache population completes before finishing install
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching core app shell files");
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log("[Service Worker] Core files cached successfully");
        self.skipWaiting(); // Immediately activate new service worker without waiting for old one to finish
      })
      .catch((error) => {
        console.error("[Service Worker] Failed to cache core files:", error);
      }),
  );
});

/**
 * ACTIVATE EVENT
 * Fired when service worker becomes active
 * Cleans up old cache versions and takes control of all clients
 */
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate event triggered");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        console.log("[Service Worker] Cleaning up old caches");
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME) // Identify outdated cache versions
            .map((name) => {
              console.log("[Service Worker] Deleting old cache:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => {
        console.log("[Service Worker] Taking control of all clients");
        // Immediately take control of all pages (don't wait for reload)
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that a new service worker has taken control
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SW_UPDATED",
              cacheName: CACHE_NAME,
              version: CACHE_VERSION,
              timestamp: CACHE_TIMESTAMP,
            });
          });
        });
      }),
  );
});

/**
 * MESSAGE EVENT
 * Allows clients to communicate with the service worker
 * Supports commands like clearing cache or forcing updates
 */
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    // Force the waiting service worker to become active
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    // Clear all caches on demand
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              console.log("[Service Worker] Clearing cache:", cacheName);
              return caches.delete(cacheName);
            }),
          );
        })
        .then(() => {
          console.log("[Service Worker] All caches cleared");
          // Notify the client that cache was cleared
          event.ports[0]?.postMessage({ success: true });
        }),
    );
  }

  if (event.data && event.data.type === "CLEAR_CACHED_FILES") {
    // Clear only this app's cached files, preserving other cache storage data
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(async (cache) => {
          const deleteTargets = URLS_TO_CACHE.map(
            (path) => new URL(path, self.location.origin).href,
          );

          let deleted = 0;
          await Promise.all(
            deleteTargets.map(async (targetUrl) => {
              const removed = await cache.delete(targetUrl);
              if (removed) {
                deleted += 1;
              }
            }),
          );

          console.log(
            "[Service Worker] Cleared cached files from current cache:",
            deleted,
          );

          // Notify the client that file cache entries were cleared
          event.ports[0]?.postMessage({
            success: true,
            type: "CLEAR_CACHED_FILES",
            deleted,
            cacheName: CACHE_NAME,
          });
        })
        .catch((error) => {
          console.error(
            "[Service Worker] Failed to clear cached files from current cache:",
            error,
          );
          event.ports[0]?.postMessage({
            success: false,
            type: "CLEAR_CACHED_FILES",
            error: String(error),
          });
        }),
    );
  }

  if (event.data && event.data.type === "GET_CACHE_INFO") {
    // Return current cache information
    event.ports[0]?.postMessage({
      cacheName: CACHE_NAME,
      version: CACHE_VERSION,
      timestamp: CACHE_TIMESTAMP,
    });
  }
});

/**
 * FETCH EVENT
 * Intercepts all network requests from the application
 *
 * CACHING STRATEGY: Network-first with cache fallback
 * - Navigation requests: Always try network first to get fresh Cloudflare edge content
 * - Static assets: Try network with 3-second timeout, fall back to cache
 * - This strategy balances fresh content with offline functionality
 * - Works in coordination with Cloudflare Workers edge caching
 */
self.addEventListener("fetch", (event) => {
  // Only handle GET requests (ignore POST, PUT, DELETE, etc.)
  if (event.request.method !== "GET") {
    return;
  }

  // Skip non-HTTP(S) requests (chrome-extension://, file://, etc.)
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Handle the request with async logic for better error handling
  event.respondWith(
    (async () => {
      try {
        /**
         * NAVIGATION REQUESTS (page loads)
         * Always prefer network to get fresh content from Cloudflare edge
         */
        if (event.request.mode === "navigate") {
          try {
            console.log(
              "[Service Worker] Fetching navigation request from network:",
              url.pathname,
            );
            const networkResp = await fetch(event.request);

            // Update cache with fresh content for next offline access
            const copy = networkResp.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, copy).catch(() => {
              console.log(
                "[Service Worker] Failed to update cache for:",
                url.pathname,
              );
            });

            return networkResp;
          } catch (err) {
            console.log(
              "[Service Worker] Navigation network failed, trying cache for:",
              url.pathname,
            );

            // Try exact match first
            const cached = await caches.match(event.request);
            if (cached) {
              console.log(
                "[Service Worker] Serving cached navigation:",
                url.pathname,
              );
              return cached;
            }

            // Fall back to index.html for SPA-style routing
            const cachedIndex = await caches.match("/index.html");
            if (cachedIndex) {
              console.log(
                "[Service Worker] Serving cached index.html as fallback",
              );
              return cachedIndex;
            }

            // Last resort: try root
            const cachedRoot = await caches.match("/");
            if (cachedRoot) {
              console.log("[Service Worker] Serving cached root as fallback");
              return cachedRoot;
            }

            // Complete offline with no cache
            console.log(
              "[Service Worker] No cached fallback available, showing offline page",
            );
            return new Response(
              "<h1>Offline</h1><p>The application is offline.</p>",
              {
                status: 503,
                headers: { "Content-Type": "text/html" },
              },
            );
          }
        }

        /**
         * STATIC ASSET REQUESTS (CSS, JS, images, etc.)
         * Try network first with 3-second timeout, then fall back to cache
         * This allows Cloudflare edge updates while supporting offline
         */
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const networkResponse = await fetch(event.request, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          // Cache successful responses for offline access
          if (networkResponse && networkResponse.status === 200) {
            try {
              const responseToCache = networkResponse.clone();
              const cache = await caches.open(CACHE_NAME);
              cache.put(event.request, responseToCache).catch(() => {
                console.log(
                  "[Service Worker] Failed to cache asset:",
                  url.pathname,
                );
              });
            } catch (e) {
              // Silent cache failure - not critical
            }
          }
          return networkResponse;
        } catch (networkErr) {
          // Network failed or timed out - try cache
          if (networkErr.name === "AbortError") {
            console.log(
              "[Service Worker] Network request timed out, using cache for:",
              url.pathname,
            );
          } else {
            console.log(
              "[Service Worker] Network error, using cache for:",
              url.pathname,
            );
          }

          const cachedResp = await caches.match(event.request);
          if (cachedResp) {
            console.log("[Service Worker] Serving cached asset:", url.pathname);
            return cachedResp;
          }

          // Re-throw to outer catch if no cache available
          throw networkErr;
        }
      } catch (finalErr) {
        // Final fallback: try any cached version or return error
        console.error(
          "[Service Worker] All fetch attempts failed for:",
          url.pathname,
          finalErr,
        );

        const cachedFallback = await caches.match(event.request);
        if (cachedFallback) {
          console.log(
            "[Service Worker] Serving final cached fallback for:",
            url.pathname,
          );
          return cachedFallback;
        }

        return new Response("Service Unavailable", { status: 503 });
      }
    })(),
  );
});
