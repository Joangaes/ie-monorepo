#!/usr/bin/env bash
set -euo pipefail

echo "=== Starting IE Professor Management Application ==="
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"

# Collect static files
echo "Collecting static files..."
python ie_professor_management/manage.py collectstatic --noinput

# Run database migrations
echo "Running database migrations..."
python ie_professor_management/manage.py migrate --noinput

# Start Gunicorn
echo "Starting Gunicorn server..."
exec gunicorn ie_professor_management.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers ${GUNICORN_WORKERS:-2} \
  --timeout ${GUNICORN_TIMEOUT:-120} \
  --access-logfile - \
  --error-logfile -

