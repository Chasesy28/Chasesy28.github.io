#!/bin/bash

# Updates the CACHE_TIMESTAMP constant in sw.js to the current UTC timestamp.

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

sed -i "s|const CACHE_TIMESTAMP = \"[^\"]*\";|const CACHE_TIMESTAMP = \"$TIMESTAMP\";|" sw.js

echo "CACHE_TIMESTAMP updated to $TIMESTAMP"
