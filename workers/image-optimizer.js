/**
 * Image Optimization Worker
 * 
 * This worker optimizes images by:
 * - Resizing based on query parameters
 * - Converting to modern formats (WebP, AVIF)
 * - Optimizing quality
 * - Caching optimized images
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Check if this is an image request
    const acceptHeader = request.headers.get('Accept') || '';
    const supportsWebP = acceptHeader.includes('image/webp');
    const supportsAVIF = acceptHeader.includes('image/avif');
    
    // Parse optimization parameters from query string
    const width = parseInt(url.searchParams.get('width')) || null;
    const quality = parseInt(url.searchParams.get('quality')) || 85;
    const format = url.searchParams.get('format') || 'auto';
    
    try {
      // Fetch the original image
      const imageResponse = await fetch(request);
      
      if (!imageResponse.ok) {
        return imageResponse;
      }
      
      // Check if this is actually an image
      const contentType = imageResponse.headers.get('Content-Type');
      if (!contentType || !contentType.startsWith('image/')) {
        return imageResponse;
      }
      
      // Build Cloudflare Image Resizing options
      const options = {
        quality,
      };
      
      // Set width if specified
      if (width) {
        options.width = width;
      }
      
      // Determine optimal format
      if (format === 'auto') {
        if (supportsAVIF) {
          options.format = 'avif';
        } else if (supportsWebP) {
          options.format = 'webp';
        }
      } else {
        options.format = format;
      }
      
      // Apply image transformations using Cloudflare's image resizing
      // Note: This requires Cloudflare Image Resizing to be enabled on your account
      // The transformed image is fetched from the origin, not the worker URL
      const imageUrl = new URL(request.url);
      const optimizedResponse = await fetch(imageUrl.toString(), {
        cf: {
          image: options,
        },
      });
      
      // Add cache headers
      const response = new Response(optimizedResponse.body, optimizedResponse);
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Vary', 'Accept');
      
      return response;
    } catch (error) {
      // If optimization fails, return the original image
      console.error('Image optimization error:', error);
      return await fetch(request);
    }
  },
};
