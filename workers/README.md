# Cloudflare Workers

This directory contains serverless functions for the Silly Site, deployed on Cloudflare Workers.

## Workers

### 1. Main Worker (`index.js`)
The main worker handles:
- Security headers (CSP, X-Frame-Options, etc.)
- Intelligent caching based on content type
- Request routing and optimization

### 2. Image Optimizer (`image-optimizer.js`)
Optimizes images on-the-fly:
- Automatic format conversion (WebP, AVIF)
- Dynamic resizing
- Quality optimization
- Aggressive caching

## Deployment

### Prerequisites
1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

### Deploy Main Worker
```bash
wrangler deploy
```

### Deploy Image Optimizer
```bash
wrangler deploy workers/image-optimizer.js --name silly-site-image-optimizer
```

## Configuration

Update `wrangler.toml` in the root directory with:
- Your Cloudflare account ID
- Your domain/route patterns
- KV namespace IDs (if using caching)
- R2 bucket names (if using image storage)

## Local Development

Run the worker locally:
```bash
wrangler dev
```

## Environment Variables

Set secrets via Wrangler:
```bash
wrangler secret put SECRET_NAME
```

## Testing

Test your worker:
```bash
curl https://your-domain.com -I
```

Check for security headers and proper caching.
