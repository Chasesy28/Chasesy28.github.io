# Chasesy28.github.io

# 👋 Hello There!

This project is a basic testing site I use to mess around and test features. 🦄

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

## 🎨 Reminders for dev

- **Fonts:** Add your favorite from **Google fonts**.
  [Go to tutorial about fonts](https://www.w3schools.com/w3css/w3css_fonts_google.asp)

- **Icons:** Add icons with **Fontawesome** and their free library.
  [Go to tutorial about Fontawesome](https://www.w3schools.com/icons/fontawesome5_intro.asp)

- **Images:** Upload images and add their URLs to your code.
  [Go to article about how to upload files](https://support.w3schools.com/hc/en-gb/articles/4410414928017)

> ⚡️ **Tip:** [Set up Google Analytics](https://www.w3schools.com/howto/howto_google_analytics.asp) to get valuable insights about your space and visitors.

- **APP** Form available on the index page.

- (add more later)...
