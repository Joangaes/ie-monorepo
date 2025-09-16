#!/usr/bin/env sh
set -e

echo "=== ENTRYPOINT: ensuring correct working dir ==="
cd /app
pwd

# Light debug: confirm presence of server and static
[ -f server.js ] && echo "server.js OK" || (echo "server.js MISSING" && ls -la)
[ -d .next/static ] && echo ".next/static OK" || (echo ".next/static MISSING" && ls -la .next || true)
[ -f .next/BUILD_ID ] && echo "BUILD_ID: $(cat .next/BUILD_ID)" || echo "BUILD_ID missing"

echo "=== Starting Next standalone ==="
exec node server.js
