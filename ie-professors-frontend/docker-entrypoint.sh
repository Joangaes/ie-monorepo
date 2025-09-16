#!/bin/sh

echo "=== DEBUG: Environment Variables ==="
env | sort

echo "=== DEBUG: /etc/hosts ==="
cat /etc/hosts || true

echo "=== DEBUG: DNS resolve django ==="
getent hosts django || getent hosts django || true

echo "=== DEBUG: Probing django health ==="
( curl -fsS http://django:8000/api/healthz/ && echo "Django reachable" ) || echo "Django NOT reachable (will rely on retries)"

echo "=== Starting Next.js server ==="
exec node .next/standalone/server.js
