#!/usr/bin/env bash
set -euxo pipefail

echo "=== Django Post-Deploy Setup ==="
echo "Timestamp: $(date)"

# Find the Django container ID
DJANGO_CONTAINER=$(docker ps --filter "ancestor=ie-manager-django" --format "{{.ID}}" | head -n 1)

if [ -z "$DJANGO_CONTAINER" ]; then
    echo "❌ Django container not found, trying alternative names..."
    DJANGO_CONTAINER=$(docker ps --filter "name=django" --format "{{.ID}}" | head -n 1)
fi

if [ -z "$DJANGO_CONTAINER" ]; then
    echo "❌ No Django container found, listing all containers:"
    docker ps
    exit 1
fi

echo "✅ Found Django container: $DJANGO_CONTAINER"

# Run Django migrations
echo "Running Django migrations..."
docker exec $DJANGO_CONTAINER python manage.py migrate --noinput

# Collect static files (already done in Dockerfile, but ensuring it's complete)
echo "Collecting Django static files..."
docker exec $DJANGO_CONTAINER python manage.py collectstatic --noinput --verbosity=1

echo "✅ Django setup completed successfully"
echo "=== Django Post-Deploy Setup Completed ==="
