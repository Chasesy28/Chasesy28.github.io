# Silly-site.me

# 👋 Hello There!

## Created by Chase Bremer and Benjamin Zimmet

> Disclaimer: AI was used in the creation of certain aspects of this site.

This project is a basic testing site I use to mess around and test features. 🦄

> ⚠️ The `projects/` directory contains isolated experiments; the main
> site does not depend on them, and they are not touched during normal
> updates or deployments.

It now includes a simple **loading screen** (jumping icon + progress bar) and a small
accessibility panel for font size, contrast, and motion reduction. Mobile layout
and touch support are verified, and the Vite/TS code is just a sandbox.

The site combines a static HTML frontend with local Tailwind CSS v4, independent project experiments, and Cloudflare Workers for edge computing.

## 🏗 What's next?

Something silly

![Funny image](https://upload.wikimedia.org/wikipedia/en/7/73/Trollface.png)

## ☁️ Cloudflare Integration

This site is optimized for Cloudflare with support for Workers, image optimization, and enhanced security.

### Deploying Cloudflare Workers

Workers provide serverless computing at the edge for enhanced performance and security.

1. **Install Wrangler CLI:**

   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**

   ```bash
   wrangler login
   ```

3. **Update `wrangler.toml`:**
   - Add your Cloudflare account ID
   - Configure your domain routes
   - Set up KV namespaces if needed

4. **Deploy the main worker:**

   ```bash
   wrangler deploy
   ```

5. **Deploy the image optimizer:**
   ```bash
   wrangler deploy workers/image-optimizer.js --name silly-site-image-optimizer
   ```

### Image Optimization

The image optimizer worker provides:

- Automatic format conversion (WebP, AVIF)
- Dynamic resizing with query parameters
- Quality optimization
- Aggressive caching for faster load times

> **Tip:** the Cloudflare dashboard also offers **Polish** (under Speed →
> Optimization, which will compress images automatically. Set it to lossless or
> lossy as you prefer and enable WebP/AVIF conversion if the worker isn't used.

### Cloudflare Performance Features

- **Argo Smart Routing** (Traffic → Argo) can dramatically cut latency by
  routing traffic across Cloudflare's internal backbone. Enable it in the
  dashboard and consider enabling the free trial under your account.
- Enable Auto Minify (JavaScript/CSS/HTML) and Brotli compression for extra
  speed.

**Usage examples:**

```
Original: https://your-domain.com/images/photo.jpg
Optimized: https://your-domain.com/images/photo.jpg?width=800&quality=85
Auto format: https://your-domain.com/images/photo.jpg?format=auto
```

### Security Features

Cloudflare Workers add security headers automatically:

- Content Security Policy (CSP)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- XSS Protection
- Referrer Policy

### Performance Optimization

- Static assets cached at the edge
- Smart caching based on content type (HTML: 1h, CSS/JS: 24h, Images: 7d)
- Compression (Brotli/Gzip) automatically applied
- HTTP/3 and QUIC support

### Local Development with Workers

```bash
# Run worker locally
wrangler dev

# Test with curl
curl http://localhost:8787 -I
```

For more details, see the [workers/README.md](./workers/README.md) file.

## 🤖 Automated Cache Management

This repository includes an automated bot that updates the service worker cache timestamp on every push to `main`. This ensures users always get fresh content when the site is updated.

### How It Works

1. **Automatic Updates**: When you push changes to the `main` branch, a GitHub Actions workflow automatically runs
2. **Timestamp Update**: The workflow updates the `CACHE_TIMESTAMP` in `sw.js` to the current UTC time
3. **Seamless Deployment**: The bot commits and pushes the timestamp change without interfering with your original changes
4. **No Manual Work**: You never need to manually update the service worker timestamp again!

### Technical Details

- **Workflow**: `.github/workflows/update-cache.yml` - Triggers on push to main
- **Script**: `update-sw-cache.sh` - Updates the timestamp using sed
- **Race Condition Prevention**: Bot fetches and rebases on the latest changes before pushing to avoid conflicts
- **Retry Logic**: Automatic retry with exponential backoff (2s, 4s, 8s) if push fails
- **Error Logging**: Captures and logs push failures for debugging
- **Loop Prevention**: Bot commits are marked with `[skip ci]` and the workflow skips bot-authored commits

For more information about cache management, see [SERVICE-WORKER-CACHE.md](./SERVICE-WORKER-CACHE.md).

## 🎨 Reminders for dev

- **Fonts:** Add your favorite from **Google fonts**.
- **Accessibility:** A panel provides font size, high‑contrast, and reduced‑motion controls. It now
  includes keyboard support (Esc to close), focus management, and closes when clicking outside.
- **Mobile:** Layout is responsive with a simple columnar nav on narrow screens; always test on phones/tablets.
  [Go to tutorial about fonts](https://www.w3schools.com/w3css/w3css_fonts_google.asp)

- **Icons:** Add icons with **Fontawesome** and their free library.
  [Go to tutorial about Fontawesome](https://www.w3schools.com/icons/fontawesome5_intro.asp)

- **Images:** Upload images and add their URLs to your code.
  [Go to article about how to upload files](https://support.w3schools.com/hc/en-gb/articles/4410414928017)

> ⚡️ **Tip:** [Set up Google Analytics](https://www.w3schools.com/howto/howto_google_analytics.asp) to get valuable insights about your space and visitors.

- **APP** Form available on the index page.

- Verified Green hosting [![Green Hosting Badge](https://app.greenweb.org/api/v3/greencheckimage/silly-site.me?nocache=true)](https://s3.nl-ams.scw.cloud/tgwf-web-app-live/greenweb_badges/v3/silly-site.me.png)

- (add more later)...
