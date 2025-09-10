#!/bin/bash

set -e

# Print environment info for debugging
echo "=== Environment Debug Info ==="
echo "DB_HOST: ${DB_HOST:-'not set'}"
echo "DB_NAME: ${DB_NAME:-'not set'}"
echo "DB_USER: ${DB_USER:-'not set'}"
echo "DB_PORT: ${DB_PORT:-'not set'}"
echo "DEBUG: ${DEBUG:-'not set'}"
echo "================================"

# Wait for database if DB_HOST is set
if [ -n "$DB_HOST" ]; then
    echo "Waiting for database at $DB_HOST:$DB_PORT..."
    while ! nc -z "$DB_HOST" "$DB_PORT"; do
        echo "Database is unavailable - sleeping"
        sleep 1
    done
    echo "Database is up - continuing..."
else
    echo "WARNING: DB_HOST not set, skipping database connectivity check"
fi

# Run Django management commands
echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn ie_professor_management.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers ${GUNICORN_WORKERS:-3} \
    --timeout ${GUNICORN_TIMEOUT:-60} \
    --access-logfile - \
    --error-logfile -

