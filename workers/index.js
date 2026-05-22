/**
 * CLOUDFLARE WORKERS MAIN HANDLER
 *
 * This worker serves the GitHub Pages static site through Cloudflare's edge network
 * Provides security headers, caching, and SPA routing support
 *
 * Key features:
 * - Serves files from Workers Sites (KV-based asset storage)
 * - Adds security headers (CSP, X-Frame-Options, etc.)
 * - Implements tiered caching based on content type
 * - Special handling for service worker file to ensure fresh updates
 * - SPA fallback routing to index.html
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

/**
 * Security headers applied to all responses
 * These headers protect against common web vulnerabilities
 */
const SECURITY_HEADERS = {
  // Content Security Policy - Restricts resource loading to prevent XSS
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://nominatim.openstreetmap.org https://overpass-api.de https://tile.openstreetmap.org; worker-src 'self';",

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking by disallowing iframe embedding from other origins
  'X-Frame-Options': 'SAMEORIGIN',

  // Enable browser XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information sent with requests
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Restrict access to browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Cache duration in seconds for different content types
 * Optimized balance between freshness and performance
 */
const CACHE_TIMES = {
  html: 600,       // 10 minutes - Reduced to allow more frequent updates through service worker
  css: 86400,      // 1 day - Styles change infrequently
  js: 86400,       // 1 day - Scripts change infrequently
  images: 604800,  // 7 days - Images rarely change
  fonts: 2592000,  // 30 days - Fonts almost never change
};

/**
 * Determines appropriate cache time based on content type
 * @param {string} contentType - MIME type of the content
 * @param {string} pathname - URL path of the resource
 * @returns {number} Cache duration in seconds
 */
function getCacheTime(contentType, pathname) {
  if (contentType.includes('text/css')) return CACHE_TIMES.css;
  if (contentType.includes('javascript')) return CACHE_TIMES.js;
  if (contentType.includes('image/')) return CACHE_TIMES.images;
  if (contentType.includes('font/') || pathname.match(/\.(woff2?|ttf|otf)$/)) return CACHE_TIMES.fonts;
  return CACHE_TIMES.html;
}

/**
 * Resolves the HTML entry point to serve for a given pathname.
 * /vite and /vite/* routes use vite.html (the React app);
 * everything else falls back to index.html (the legacy site).
 * @param {string} pathname - URL pathname of the request
 * @returns {string} HTML file path to serve
 */
function resolveHtmlEntry(pathname) {
  if (pathname === '/admin' || pathname === '/admin/') {
    return '/vite.html';
  }
  if (pathname === '/admin/auth' || pathname === '/admin/auth/') {
    return '/vite.html';
  }
  if (pathname === '/vite' || pathname.startsWith('/vite/')) {
    return '/vite.html';
  }
  return '/index.html';
}

function isSpaRoute(pathname) {
  return (
    pathname === '/' ||
    pathname === '/admin' ||
    pathname === '/admin/' ||
    pathname === '/admin/auth' ||
    pathname === '/admin/auth/' ||
    pathname === '/vite' ||
    pathname === '/vite/' ||
    pathname.startsWith('/vite/')
  );
}

/**
 * @param {Request} request - Incoming HTTP request
 * @param {Object} env - Environment bindings (KV namespaces, secrets, etc.)
 * @param {Object} ctx - Execution context with waitUntil and passThroughOnException
 * @returns {Promise<Response>} HTTP response
 */
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      /**
       * SPECIAL HANDLING FOR SERVICE WORKER
       * Service worker file needs special treatment:
       * 1. Always serve fresh version (no aggressive caching)
       * 2. Correct MIME type (application/javascript)
       * 3. Service-Worker-Allowed header for scope control
       */
      if (url.pathname === '/sw.js') {
        console.log('[Worker] Attempting to serve service worker file');
        const options = {};
        const assetResponse = await getAssetFromKV({ request }, options);
        const resp = new Response(assetResponse.body, assetResponse);

        // Set proper headers for service worker
        resp.headers.set('Content-Type', 'application/javascript');
        resp.headers.set('Service-Worker-Allowed', '/'); // Explicitly set SW scope to root path (redundant when sw.js is served from '/')
        resp.headers.set('Cache-Control', 'no-cache'); // Always validate with server for updates

        // Add security headers
        Object.entries(SECURITY_HEADERS).forEach(([k, v]) => resp.headers.set(k, v));
        resp.headers.set('X-Worker', 'silly-site-worker');

        console.log('[Worker] Service worker response prepared and ready to return');
        return resp;
      }

      /**
       * STANDARD ASSET HANDLING
       * Uses KV asset handler to serve uploaded Workers Sites assets
       */
      const options = {
        /**
         * Request mapper for SPA routing
         * Maps directory and extension-less URLs to their HTML entry points
         */
        mapRequestToAsset: (req) => {
          const reqUrl = new URL(req.url);
          // Serve the appropriate HTML entry only for known SPA routes.
          if (isSpaRoute(reqUrl.pathname)) {
            const htmlEntry = resolveHtmlEntry(reqUrl.pathname);
            console.log('[Worker] SPA route detected, serving', htmlEntry, 'for:', reqUrl.pathname);
            return new Request(`${reqUrl.origin}${htmlEntry}`, req);
          }
          return req;
        },
      };

      console.log('[Worker] Fetching asset:', url.pathname);
      const assetResponse = await getAssetFromKV({ request }, options);

      // Clone response and add custom headers
      const resp = new Response(assetResponse.body, assetResponse);
      Object.entries(SECURITY_HEADERS).forEach(([k, v]) => resp.headers.set(k, v));

      // Add worker identification header for debugging
      resp.headers.set('X-Worker', 'silly-site-worker');

      // Set cache time based on content type
      const contentType = (resp.headers.get('Content-Type') || '').toLowerCase();
      const cacheTime = getCacheTime(contentType, url.pathname);
      resp.headers.set('Cache-Control', `public, max-age=${cacheTime}`);

      console.log('[Worker] Asset served successfully:', url.pathname, 'Cache:', cacheTime, 'seconds');
      return resp;
    } catch (err) {
      console.error('[Worker] Asset fetch error:', err.message);

      /**
       * FALLBACK ERROR HANDLING
       * If asset not found or error occurs, try serving the appropriate HTML entry
       * for SPA routing. /vite routes fall back to vite.html; everything else to index.html.
       */
      try {
        console.log('[Worker] Attempting fallback');
        const origin = new URL(request.url).origin;
        const pathname = new URL(request.url).pathname;
        const fallbackPath = isSpaRoute(pathname) ? resolveHtmlEntry(pathname) : '/404.html';
        const fallback = await getAssetFromKV({ request: new Request(origin + fallbackPath) });
        const fr = new Response(fallback.body, fallback);
        Object.entries(SECURITY_HEADERS).forEach(([k, v]) => fr.headers.set(k, v));
        fr.headers.set('Cache-Control', `public, max-age=${CACHE_TIMES.html}`);
        if (!isSpaRoute(pathname)) {
          fr.headers.set('x-not-found', 'true');
        }
        console.log('[Worker] Fallback successful');
        if (!isSpaRoute(pathname)) {
          return new Response(fr.body, {
            status: 404,
            headers: fr.headers,
          });
        }
        return fr;
      } catch (e) {
        console.error('[Worker] Fallback failed:', e.message);
        return new Response('Not found', { status: 404 });
      }
    }
  },
};
