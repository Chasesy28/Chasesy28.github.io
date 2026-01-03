/**
 * CLOUDFLARE IMAGE OPTIMIZATION WORKER
 * 
 * This worker optimizes images automatically using Cloudflare's Image Resizing service
 * 
 * Features:
 * - Automatic format conversion (WebP, AVIF) based on browser support
 * - Dynamic resizing based on query parameters
 * - Quality optimization
 * - Long-term caching for optimized images
 * - Fallback to original image if optimization fails
 * 
 * Query Parameters:
 * - width: Resize width in pixels (e.g., ?width=800)
 * - quality: Image quality 1-100 (e.g., ?quality=85)
 * - format: Force specific format like 'webp', 'avif', or 'auto' for automatic selection
 * 
 * Requirements:
 * - Cloudflare Image Resizing must be enabled on your account
 * - This is a paid Cloudflare feature
 */

export default {
  /**
   * Main fetch handler for image optimization
   * @param {Request} request - Incoming image request
   * @param {Object} env - Environment bindings
   * @param {Object} ctx - Execution context
   * @returns {Promise<Response>} Optimized image response
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Detect browser image format support from Accept header
    const acceptHeader = request.headers.get('Accept') || '';
    const supportsWebP = acceptHeader.includes('image/webp');
    const supportsAVIF = acceptHeader.includes('image/avif');
    
    // Extract optimization parameters from query string
    const width = parseInt(url.searchParams.get('width')) || null;
    const quality = parseInt(url.searchParams.get('quality')) || 85; // Default 85% quality
    const format = url.searchParams.get('format') || 'auto';
    
    console.log('[Image Optimizer] Processing request:', url.pathname, 
                'width:', width || 'original', 
                'quality:', quality, 
                'format:', format);
    
    try {
      // Fetch the original image from origin
      const imageResponse = await fetch(request);
      
      if (!imageResponse.ok) {
        console.error('[Image Optimizer] Original image fetch failed:', imageResponse.status);
        return imageResponse;
      }
      
      // Verify this is actually an image
      const contentType = imageResponse.headers.get('Content-Type');
      if (!contentType || !contentType.startsWith('image/')) {
        console.log('[Image Optimizer] Not an image, passing through:', contentType);
        return imageResponse;
      }
      
      /**
       * Build Cloudflare Image Resizing options
       * These options are passed to Cloudflare's image transformation service
       */
      const options = {
        quality, // Image quality (1-100)
      };
      
      // Apply width constraint if specified
      if (width) {
        options.width = width;
        console.log('[Image Optimizer] Resizing to width:', width);
      }
      
      /**
       * Determine optimal image format based on browser support
       * Priority: AVIF > WebP > Original format
       * AVIF provides best compression but limited browser support
       * WebP is widely supported with good compression
       */
      if (format === 'auto') {
        if (supportsAVIF) {
          options.format = 'avif';
          console.log('[Image Optimizer] Using AVIF format (best compression)');
        } else if (supportsWebP) {
          options.format = 'webp';
          console.log('[Image Optimizer] Using WebP format (good compression)');
        }
      } else {
        options.format = format;
        console.log('[Image Optimizer] Using forced format:', format);
      }
      
      /**
       * Apply image transformations using Cloudflare's Image Resizing
       * 
       * Note: This requires Cloudflare Image Resizing to be enabled
       * The 'cf' option is a special Cloudflare Workers feature
       * Image is fetched and transformed at the edge
       */
      const imageUrl = new URL(request.url);
      const optimizedResponse = await fetch(imageUrl.toString(), {
        cf: {
          image: options, // Pass transformation options to Cloudflare
        },
      });
      
      /**
       * Add aggressive caching headers
       * Optimized images are immutable and can be cached for a year
       */
      const response = new Response(optimizedResponse.body, optimizedResponse);
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Vary', 'Accept'); // Cache separately for different Accept headers
      
      console.log('[Image Optimizer] Image optimized successfully');
      return response;
    } catch (error) {
      // If optimization fails, return the original image
      console.error('[Image Optimizer] Optimization failed:', error.message);
      console.log('[Image Optimizer] Falling back to original image');
      return await fetch(request);
    }
  },
};
