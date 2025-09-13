#!/usr/bin/env bash
set -euxo pipefail

echo "=== Django Post-Deploy Setup ==="
echo "Timestamp: $(date)"

# Run Django migrations
echo "Running Django migrations..."
docker-compose exec -T django python manage.py migrate --noinput

# Collect static files
echo "Collecting Django static files..."
docker-compose exec -T django python manage.py collectstatic --noinput --verbosity=2

# Create superuser if needed (optional)
echo "Django setup completed successfully"
echo "=== Django Post-Deploy Setup Completed ==="
