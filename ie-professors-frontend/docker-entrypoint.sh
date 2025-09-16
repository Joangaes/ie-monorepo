#!/usr/bin/env sh
set -e

echo "=== ENTRYPOINT DEBUG ==="
echo "CWD: $(pwd)"
ls -lah

echo "=== Listing /app ==="
ls -lah /app

echo "=== Listing /app/.next ==="
ls -lah /app/.next || true

echo "=== Listing /app/.next/static ==="
ls -lah /app/.next/static || true

echo "=== BUILD_ID ==="
cat /app/.next/BUILD_ID || echo "No BUILD_ID found"

echo "=== Starting Next.js standalone from /app/server.js ==="
cd /app
exec node server.js
