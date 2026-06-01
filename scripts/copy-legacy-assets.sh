#!/usr/bin/env sh
set -e

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

mkdir -p "$DIST_DIR"

# Copy legacy assets required by the static homepage and projects.
for entry in \
  404.html \
  admin-auth.js \
  announcements.js \
  CNAME \
  manifest.json \
  assets/notification/notification-bars.css \
  assets/notification/notification-bars.js \
  legal \
  scripts.js \
  SERVICE-WORKER-CACHE.md \
  styles.css \
  tailwind.css \
  SUPABASE-INTEGRATION.md \
  sw.js \
  icons \
  images \
  projects
do
  if [ -e "$ROOT_DIR/$entry" ]; then
    cp -R "$ROOT_DIR/$entry" "$DIST_DIR/"
  fi
done

echo "Copied legacy assets into dist/."
