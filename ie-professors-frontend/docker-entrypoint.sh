#!/usr/bin/env sh
set -e

echo "=== DEBUG: Environment Variables ==="
env | sort

echo "=== DEBUG: Ensuring correct working directory ==="
cd /app
pwd
ls -la

echo "=== DEBUG: .next layout (expect /app/.next/static to exist) ==="
ls -la .next || true
ls -la .next/static || true
[ -f .next/BUILD_ID ] && echo "BUILD_ID: $(cat .next/BUILD_ID)" || echo "⚠️  BUILD_ID missing"

echo "=== Starting Next.js standalone server from project root ==="
# With output: 'standalone', server.js and the required node_modules are in /app after COPY.
# Next expects .next/static to be a sibling of the CWD. Do NOT cd into a nested folder.
exec node server.js
