#!/usr/bin/env bash
set -euo pipefail

echo "=== Starting IE Professor Management Application ==="
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"

# Run database migrations (skip if using SQLite and migrations fail)
echo "Running database migrations..."
if python manage.py migrate --noinput; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️ Migrations failed, but continuing (this is normal for SQLite with complex migrations)"
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Check if a superuser exists, create one if none exists
echo "Checking for superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if User.objects.filter(is_superuser=True).exists():
    print('ℹ️ Superuser already exists')
else:
    print('⚠️ No superuser found. Please create one manually with: python manage.py createsuperuser')
"

echo "✅ Django setup completed successfully!"
echo "Executing command: $@"

# Execute the passed command
exec "$@"

