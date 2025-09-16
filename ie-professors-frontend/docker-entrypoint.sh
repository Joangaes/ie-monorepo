#!/bin/sh

echo "=== DEBUG: Environment Variables ==="
env | sort

echo "=== DEBUG: Current Working Directory ==="
pwd
ls -la

echo "=== DEBUG: .next Directory Structure ==="
ls -la .next

echo "=== DEBUG: Static Assets Overview ==="
find .next/static -maxdepth 3 -type f | head -n 50

echo "=== DEBUG: Build ID ==="
if [ -f .next/BUILD_ID ]; then
  echo "BUILD_ID: $(cat .next/BUILD_ID)"
else
  echo "⚠️  BUILD_ID file not found"
fi

echo "=== DEBUG: Webpack Chunks ==="
if [ -d .next/static/chunks ]; then
  echo "Webpack chunks found:"
  find .next/static/chunks -name "webpack-*.js" | head -10
  WEBPACK_COUNT=$(find .next/static/chunks -name "webpack-*.js" | wc -l)
  echo "Total webpack-*.js files: $WEBPACK_COUNT"
else
  echo "⚠️  .next/static/chunks directory not found"
fi

echo "=== DEBUG: CSS Files ==="
find .next/static -name "*.css" | head -10

echo "=== DEBUG: /etc/hosts ==="
cat /etc/hosts || true

echo "=== DEBUG: DNS resolve django ==="
getent hosts django || getent hosts django || true

echo "=== DEBUG: Probing django health ==="
( curl -fsS http://django:8000/api/healthz/ && echo "Django reachable" ) || echo "Django NOT reachable (will rely on retries)"

echo "=== Starting Next.js server ==="
exec node .next/standalone/server.js
