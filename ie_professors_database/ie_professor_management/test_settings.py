"""
Test settings for IE Professor Management
Uses SQLite with simplified configuration for CI/CD testing
"""

import os
import sys
from pathlib import Path

# Import base settings
from .settings import *

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Override database for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for testing to avoid PostgreSQL-specific field issues
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Use a simpler test runner that doesn't require migrations
TEST_RUNNER = 'django.test.runner.DiscoverRunner'

# Disable logging during tests
LOGGING_CONFIG = None

# Use in-memory cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Disable email sending during tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Use faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable security features for testing
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Use simple session backend
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Disable CORS for tests
CORS_ALLOW_ALL_ORIGINS = True
