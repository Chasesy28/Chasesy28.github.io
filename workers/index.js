import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://nominatim.openstreetmap.org https://overpass-api.de https://tile.openstreetmap.org; worker-src 'self';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const CACHE_TIMES = {
  // Reduce HTML cache time to allow more frequent updates through service worker
  html: 3600, // 1 hour
  css: 86400, // 1 day
  js: 86400, // 1 day
  images: 604800, // 7 days
  fonts: 2592000, // 30 days
};

function getCacheTime(contentType, pathname) {
  if (contentType.includes('text/css')) return CACHE_TIMES.css;
  if (contentType.includes('javascript')) return CACHE_TIMES.js;
  if (contentType.includes('image/')) return CACHE_TIMES.images;
  if (contentType.includes('font/') || pathname.match(/\.(woff2?|ttf|otf)$/)) return CACHE_TIMES.fonts;
  return CACHE_TIMES.html;
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Special handling for service worker file - always serve fresh with proper MIME type
      if (url.pathname === '/sw.js') {
        const options = {};
        const assetResponse = await getAssetFromKV({ request }, options);
        const resp = new Response(assetResponse.body, assetResponse);
        
        // Set proper headers for service worker
        resp.headers.set('Content-Type', 'application/javascript');
        resp.headers.set('Service-Worker-Allowed', '/');
        resp.headers.set('Cache-Control', 'no-cache'); // Always validate with server for updates
        
        // Add security headers but with worker-src support
        Object.entries(SECURITY_HEADERS).forEach(([k, v]) => resp.headers.set(k, v));
        resp.headers.set('X-Worker', 'silly-site-worker');
        
        return resp;
      }

      // Use kv-asset-handler to serve the uploaded Workers Sites assets.
      const options = {
        mapRequestToAsset: (req) => {
          const reqUrl = new URL(req.url);
          // Serve index.html for directory or SPA-style routes
          if (reqUrl.pathname.endsWith('/') || !reqUrl.pathname.includes('.')) {
            return new Request(`${reqUrl.origin}/index.html`, req);
          }
          return req;
        },
      };

      const assetResponse = await getAssetFromKV({ request }, options);

      // Clone and add security + cache headers and a worker indicator header
      const resp = new Response(assetResponse.body, assetResponse);
      Object.entries(SECURITY_HEADERS).forEach(([k, v]) => resp.headers.set(k, v));

      // Add a header to confirm this Worker handled the request
      resp.headers.set('X-Worker', 'silly-site-worker');

      const contentType = (resp.headers.get('Content-Type') || '').toLowerCase();
      const cacheTime = getCacheTime(contentType, url.pathname);
      resp.headers.set('Cache-Control', `public, max-age=${cacheTime}`);

      return resp;
    } catch (err) {
      // Fallback: return a friendly 404 or the index.html for SPA
      try {
        const fallback = await getAssetFromKV({ request: new Request(new URL(request.url).origin + '/index.html') });
        const fr = new Response(fallback.body, fallback);
        Object.entries(SECURITY_HEADERS).forEach(([k, v]) => fr.headers.set(k, v));
        fr.headers.set('Cache-Control', `public, max-age=${CACHE_TIMES.html}`);
        return fr;
      } catch (e) {
        return new Response('Not found', { status: 404 });
      }
    }
  },
};
