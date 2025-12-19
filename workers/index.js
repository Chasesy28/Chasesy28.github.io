/**
 * Cloudflare Worker for Silly Site
 * 
 * This worker provides:
 * - Security headers
 * - Image optimization
 * - Caching strategies
 * - Request routing
 */

// Security headers configuration
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Cache configuration
const CACHE_TIMES = {
  html: 3600,      // 1 hour
  css: 86400,      // 24 hours
  js: 86400,       // 24 hours
  images: 604800,  // 7 days
  fonts: 2592000,  // 30 days
};

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Fetch the original response
  let response = await fetch(request);
  
  // Create a new response with modified headers
  response = new Response(response.body, response);
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Set cache headers based on content type
  const contentType = response.headers.get('Content-Type') || '';
  let cacheTime = CACHE_TIMES.html;
  
  if (contentType.includes('text/css')) {
    cacheTime = CACHE_TIMES.css;
  } else if (contentType.includes('javascript')) {
    cacheTime = CACHE_TIMES.js;
  } else if (contentType.includes('image/')) {
    cacheTime = CACHE_TIMES.images;
  } else if (contentType.includes('font/') || url.pathname.match(/\.(woff2?|ttf|otf)$/)) {
    cacheTime = CACHE_TIMES.fonts;
  }
  
  response.headers.set('Cache-Control', `public, max-age=${cacheTime}`);
  
  return response;
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request);
    } catch (error) {
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};
