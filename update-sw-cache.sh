#!/bin/bash
# Automatic Service Worker Cache Update Script
# Run this script before deploying to automatically update the cache timestamp
# This ensures users get fresh content when the site is updated

# Get current timestamp in ISO 8601 format
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update the CACHE_TIMESTAMP in sw.js
sed -i "s|const CACHE_TIMESTAMP = \"[^\"]*\";|const CACHE_TIMESTAMP = \"$TIMESTAMP\";|" sw.js

echo "✓ Updated service worker cache timestamp to: ${TIMESTAMP}"
echo "✓ Users will receive the new version on their next visit"
echo ""
echo "Next steps:"
echo "  1. Test the changes locally"
echo "  2. Commit the updated sw.js"
echo "  3. Deploy to production"
