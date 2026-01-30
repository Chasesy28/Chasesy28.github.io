# Service Worker Cache Management

## Overview

The service worker (`sw.js`) provides offline functionality by caching essential files. This document explains how cache updates work and how to ensure users get fresh content when the site is updated.

## How Cache Updates Work

### Automatic Update Detection

1. **Network-First Strategy**: The service worker always tries to fetch fresh content from the network first
2. **Update Checking**: The service worker checks for updates:
   - On page load
   - Every 60 minutes while the page is open
   - When the user returns to the site
3. **User Notification**: When an update is detected, users see a blue banner with an "Update Now" button

### Cache Versioning

The cache uses a combination of version number and timestamp:

```javascript
const CACHE_VERSION = '6';
const CACHE_TIMESTAMP = '2026-01-30T19:35:15Z';
const CACHE_NAME = `silly-site-cache-v${CACHE_VERSION}-${CACHE_TIMESTAMP}`;
```

## Deploying Updates

### Option 1: Automatic (Recommended)

Run the update script before deploying:

```bash
./update-sw-cache.sh
```

This automatically updates the `CACHE_TIMESTAMP` to the current time, ensuring users get the new version.

### Option 2: Manual

Edit `sw.js` and update one of these:

1. Increment `CACHE_VERSION` (e.g., v6 → v7) for major updates
2. Update `CACHE_TIMESTAMP` to current time for minor updates

Example:
```javascript
const CACHE_VERSION = '7';  // Increment this
const CACHE_TIMESTAMP = '2026-02-01T10:30:00Z';  // Or update this
```

## Testing Cache Updates

1. Start a local server:
   ```bash
   npx http-server -p 8080 .
   ```

2. Open the site in a browser
3. Make changes to HTML/CSS/JS files
4. Update the cache version using one of the methods above
5. Refresh the page - you should see the update notification

## Cache Management Commands

### Clear Cache (JavaScript Console)

Users can manually clear the cache by running this in the browser console:

```javascript
navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
```

### Check Current Cache Version

```javascript
caches.keys().then(keys => console.log('Current caches:', keys));
```

## Best Practices

1. **Always update cache version/timestamp when deploying changes** - This is the most important step!
2. **Test locally before deploying** - Verify the update mechanism works
3. **Increment CACHE_VERSION for major changes** - Breaking changes, new features
4. **Update CACHE_TIMESTAMP for minor changes** - Bug fixes, content updates
5. **Monitor console logs** - Look for service worker registration and update messages

## Troubleshooting

### Users Not Getting Updates

1. Verify `CACHE_VERSION` or `CACHE_TIMESTAMP` was updated in `sw.js`
2. Check if `sw.js` itself is being cached by a CDN (should not be)
3. Ask users to hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Cache Not Working

1. Check browser console for service worker errors
2. Verify all files in `URLS_TO_CACHE` exist and are accessible
3. Test with network throttling to simulate slow/offline conditions

## Files Cached

The service worker caches 25 essential files:

- Core pages: `/`, `/index.html`, `/manifest.json`
- Static assets: `/styles.css`, `/scripts.js`, icons
- All project HTML, CSS, and JS files

See `URLS_TO_CACHE` array in `sw.js` for the complete list.
