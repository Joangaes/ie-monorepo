#!/bin/bash
# Production entrypoint for Django container
# Runs migrations, optional collectstatic, then starts Gunicorn

set -e

echo "=== Django Production Entrypoint ==="

# Wait for database if DB_HOST is set
if [ -n "$DB_HOST" ]; then
    echo "Waiting for database at $DB_HOST:${DB_PORT:-5432}..."
    while ! nc -z "$DB_HOST" "${DB_PORT:-5432}"; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    echo "Database is up - continuing..."
fi

# Run Django management commands
echo "Running database migrations..."
poetry run python manage.py migrate --noinput

# Collect static files only if DJANGO_COLLECTSTATIC is set to 1
if [ "${DJANGO_COLLECTSTATIC:-0}" = "1" ]; then
    echo "Collecting static files..."
    poetry run python manage.py collectstatic --noinput
else
    echo "Skipping collectstatic (DJANGO_COLLECTSTATIC not set to 1)"
fi

# Create superuser if credentials are provided (optional for first deployment)
if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser if it doesn't exist..."
    poetry run python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(email='$DJANGO_SUPERUSER_EMAIL').exists():
    User.objects.create_superuser(
        username='$DJANGO_SUPERUSER_EMAIL',
        email='$DJANGO_SUPERUSER_EMAIL',
        password='$DJANGO_SUPERUSER_PASSWORD'
    );
    print('Superuser created successfully');
else:
    print('Superuser already exists');
" 2>/dev/null || echo "Superuser creation skipped or failed"
fi

# Start Gunicorn with production settings
echo "Starting Gunicorn with ${GUNICORN_WORKERS:-3} workers..."
exec poetry run gunicorn ie_professor_management.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --timeout "${GUNICORN_TIMEOUT:-60}" \
    --max-requests "${GUNICORN_MAX_REQUESTS:-1000}" \
    --max-requests-jitter "${GUNICORN_MAX_REQUESTS_JITTER:-100}" \
    --preload \
    --access-logfile - \
    --error-logfile - \
    --log-level info
