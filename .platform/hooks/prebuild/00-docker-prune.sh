#!/usr/bin/env bash
set -euxo pipefail

echo "=== Docker Cache Cleanup Started ==="
echo "Timestamp: $(date)"

# Prune Docker builder cache
echo "Pruning Docker builder cache..."
docker builder prune -af || true

# Prune Docker images
echo "Pruning Docker images..."
docker image prune -af || true

# Optional: Clean up containers and volumes (uncomment if needed)
# echo "Pruning Docker containers..."
# docker container prune -f || true
# echo "Pruning Docker volumes..."
# docker volume prune -f || true

echo "=== Docker Cache Cleanup Completed ==="
echo "Available disk space after cleanup:"
df -h || true
