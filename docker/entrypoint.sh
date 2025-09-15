#!/bin/bash
set -e

# Enhanced Django entrypoint with comprehensive validation
# Ensures proper logging to stdout/stderr for both EB logs and CloudWatch
# Validates all required environment variables and database connectivity

echo "=================================="
echo "🚀 DJANGO CONTAINER STARTUP"
echo "=================================="
echo "Timestamp: $(date)"
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Container hostname: $(hostname)"
echo "User: $(whoami)"

# Critical environment variable validation
echo ""
echo "=== VALIDATING REQUIRED ENVIRONMENT VARIABLES ==="

# List of required environment variables
REQUIRED_VARS=(
    "DJANGO_SETTINGS_MODULE"
    "SECRET_KEY"
    "DB_NAME"
    "DB_HOST"
    "DB_USER"
    "DB_PASSWORD"
    "DB_PORT"
)

MISSING_VARS=()

# Check each required variable
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        MISSING_VARS+=("$var")
        echo "❌ $var: NOT SET"
    else
        if [[ "$var" == *"PASSWORD"* ]] || [[ "$var" == *"SECRET"* ]]; then
            echo "✅ $var: ***MASKED***"
        else
            echo "✅ $var: ${!var}"
        fi
    fi
done

# Exit if any required variables are missing
if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo ""
    echo "❌ CRITICAL ERROR: Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Container cannot start without these variables. Exiting..."
    exit 1
fi

echo "✅ All required environment variables are present"

# Display additional configuration (non-sensitive)
echo ""
echo "=== ADDITIONAL CONFIGURATION ==="
echo "DEBUG: ${DEBUG:-not set}"
echo "DJANGO_ALLOWED_HOSTS: ${DJANGO_ALLOWED_HOSTS:-not set}"
echo "PYTHONUNBUFFERED: ${PYTHONUNBUFFERED:-not set}"
echo "PYTHONDONTWRITEBYTECODE: ${PYTHONDONTWRITEBYTECODE:-not set}"

# Validate Django settings can be imported
echo ""
echo "=== VALIDATING DJANGO CONFIGURATION ==="
python -c "
import os
import sys
import traceback

print('Testing Django settings import...')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', '${DJANGO_SETTINGS_MODULE}')

try:
    import django
    from django.conf import settings
    django.setup()
    print('✅ Django configuration loaded successfully')
    print(f'   Settings module: {settings.SETTINGS_MODULE}')
    print(f'   Debug mode: {settings.DEBUG}')
    print(f'   Database engine: {settings.DATABASES[\"default\"][\"ENGINE\"]}')
    print(f'   Database name: {settings.DATABASES[\"default\"][\"NAME\"]}')
except Exception as e:
    print(f'❌ Django configuration failed: {e}')
    traceback.print_exc()
    sys.exit(1)
" || {
    echo "❌ Django configuration validation failed. Container will exit."
    exit 1
}

# Check if database is available (set by Django settings)
echo ""
echo "=== CHECKING DATABASE AVAILABILITY ==="
DATABASE_AVAILABLE=$(python -c "
import os
import sys
import traceback
from django.conf import settings

try:
    database_available = os.getenv('DATABASE_AVAILABLE', 'False').lower() == 'true'
    has_databases = bool(settings.DATABASES)
    
    print(f'Database available from env: {database_available}')
    print(f'DATABASES configured: {has_databases}')
    
    if database_available and has_databases:
        print('✅ Database is available and configured')
        print('true')
    else:
        print('⚠️  Database not available or not configured')
        print('false')
        
except Exception as e:
    print(f'❌ Error checking database availability: {e}')
    print('false')
" | tail -1)

echo "Database availability check result: $DATABASE_AVAILABLE"

if [ "$DATABASE_AVAILABLE" = "true" ]; then
    # Database is available - run full database operations
    echo ""
    echo "=== TESTING DATABASE CONNECTION ==="
    python -c "
import os
import sys
import traceback
from django.db import connection

try:
    print('Testing database connection...')
    with connection.cursor() as cursor:
        cursor.execute('SELECT version();' if 'postgresql' in connection.vendor else 'SELECT 1')
        result = cursor.fetchone()
        print(f'✅ Database connection successful')
        print(f'   Database vendor: {connection.vendor}')
        if result:
            print(f'   Database info: {result[0][:100]}...' if len(str(result[0])) > 100 else f'   Database response: {result[0]}')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    traceback.print_exc()
    print('')
    print('Database connection details:')
    print(f'   Host: ${DB_HOST}')
    print(f'   Port: ${DB_PORT}')
    print(f'   Database: ${DB_NAME}')
    print(f'   User: ${DB_USER}')
    print('   Password: ***MASKED***')
    sys.exit(1)
" || {
        echo "❌ Database connection test failed. Container will exit."
        exit 1
    }

    # Run database migrations
    echo ""
    echo "=== RUNNING DATABASE MIGRATIONS ==="
    echo "Checking for pending migrations..."
    python manage.py migrate --check --verbosity=1 || {
        echo "Pending migrations detected. Running migrations..."
        python manage.py migrate --noinput --verbosity=1 || {
            echo "❌ Migration failed. Container will exit."
            exit 1
        }
    }
    echo "✅ Database migrations completed successfully"
else
    # No database available - skip database operations
    echo ""
    echo "=== SKIPPING DATABASE OPERATIONS ==="
    echo "⚠️  Database not available - skipping migrations and database tests"
    echo "✅ Application will run in no-database mode"
fi

# Collect static files (always run - doesn't require database)
echo ""
echo "=== COLLECTING STATIC FILES ==="
python manage.py collectstatic --noinput --clear --verbosity=1 || {
    echo "❌ Static file collection failed. Container will exit."
    exit 1
}
echo "✅ Static files collected successfully"

# Validate WSGI application can be imported
echo ""
echo "=== VALIDATING WSGI APPLICATION ==="
python -c "
import sys
import traceback

try:
    print('Testing WSGI application import...')
    from ie_professor_management.wsgi import application
    print('✅ WSGI application imported successfully')
    print(f'   Application type: {type(application)}')
except Exception as e:
    print(f'❌ WSGI application import failed: {e}')
    traceback.print_exc()
    sys.exit(1)
" || {
    echo "❌ WSGI application validation failed. Container will exit."
    exit 1
}

echo ""
echo "=================================="
echo "🎯 STARTING GUNICORN SERVER"
echo "=================================="
echo "Command: $@"
echo "All logs will be sent to stdout/stderr for EB and CloudWatch visibility"
echo ""

# Execute the main command (Gunicorn)
# Using exec ensures:
# 1. Gunicorn becomes PID 1 for proper signal handling
# 2. All output goes to stdout/stderr for both EB logs and CloudWatch
# 3. Container exits when Gunicorn exits
exec "$@"