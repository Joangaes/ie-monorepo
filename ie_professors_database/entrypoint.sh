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

# Run comprehensive Django debug script
echo "Running Django debug script..."
python debug_django.py || {
    echo "Debug script failed, but continuing..."
}

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

# Test Django configuration first
echo "Testing Django configuration..."
python manage.py check --deploy || {
    echo "Django check failed, but continuing..."
}

# Run Django management commands with error handling
echo "Running database migrations..."
python manage.py migrate --noinput || {
    echo "Migration failed! Attempting to create database tables..."
    python manage.py migrate --run-syncdb --noinput || {
        echo "Database setup failed, but continuing with static files..."
    }
}

echo "Collecting static files..."
python manage.py collectstatic --noinput || {
    echo "Static file collection failed, but continuing..."
}

# Test if we can import Django settings
echo "Testing Django import..."
python -c "import django; django.setup(); from django.conf import settings; print('Django settings loaded successfully')" || {
    echo "Django settings import failed!"
}

# Verify Gunicorn is available
echo "Verifying Gunicorn installation..."
which gunicorn || {
    echo "ERROR: Gunicorn not found in PATH!"
    echo "PATH: $PATH"
    echo "Available commands:"
    ls -la /usr/local/bin/ | grep -i gunicorn || echo "No gunicorn found"
    exit 1
}

# Start Gunicorn with more verbose logging
echo "Starting Gunicorn with verbose logging..."
echo "DJANGO_SETTINGS_MODULE: ${DJANGO_SETTINGS_MODULE:-'not set'}"
echo "PYTHONPATH: ${PYTHONPATH:-'not set'}"
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"

exec gunicorn ie_professor_management.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers ${GUNICORN_WORKERS:-2} \
    --timeout ${GUNICORN_TIMEOUT:-120} \
    --log-level debug \
    --access-logfile - \
    --error-logfile - \
    --preload

