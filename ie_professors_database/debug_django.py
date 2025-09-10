#!/usr/bin/env python3
"""
Debug script to test Django configuration
"""
import os
import sys
import traceback

print("=== Django Debug Script ===")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

# Show installed packages
print("\n=== Installed Packages ===")
try:
    import pkg_resources
    installed_packages = [d.project_name for d in pkg_resources.working_set]
    django_packages = [p for p in installed_packages if 'django' in p.lower()]
    gunicorn_packages = [p for p in installed_packages if 'gunicorn' in p.lower()]
    print(f"Django-related packages: {django_packages}")
    print(f"Gunicorn-related packages: {gunicorn_packages}")
    print(f"Total packages installed: {len(installed_packages)}")
except Exception as e:
    print(f"Could not list packages: {e}")

# Show Python executable and site-packages
print(f"\nPython executable: {sys.executable}")
try:
    import site
    print(f"Site packages: {site.getsitepackages()}")
except Exception as e:
    print(f"Could not get site packages: {e}")

# Test environment variables
print("\n=== Environment Variables ===")
for key in ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PORT', 'DEBUG', 'SECRET_KEY']:
    value = os.getenv(key, 'NOT SET')
    print(f"{key}: {value}")

# Test Django import
print("\n=== Testing Django Import ===")
try:
    import django
    print(f"Django version: {django.get_version()}")
    
    # Set up Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ie_professor_management.settings')
    django.setup()
    
    from django.conf import settings
    print("Django settings loaded successfully")
    
    # Test database configuration
    print(f"Database engine: {settings.DATABASES['default']['ENGINE']}")
    if 'postgresql' in settings.DATABASES['default']['ENGINE']:
        print(f"Database host: {settings.DATABASES['default']['HOST']}")
        print(f"Database name: {settings.DATABASES['default']['NAME']}")
    else:
        print("Using SQLite database")
    
    # Test database connection
    print("\n=== Testing Database Connection ===")
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("Database connection successful!")
    except Exception as e:
        print(f"Database connection failed: {e}")
        traceback.print_exc()
    
    # Test if we can run basic Django commands
    print("\n=== Testing Django Management Commands ===")
    from django.core.management import execute_from_command_line
    try:
        execute_from_command_line(['manage.py', 'check'])
        print("Django check passed!")
    except Exception as e:
        print(f"Django check failed: {e}")
        traceback.print_exc()

except Exception as e:
    print(f"Django import/setup failed: {e}")
    traceback.print_exc()

print("\n=== Debug Script Complete ===")
