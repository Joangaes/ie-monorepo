"""
Production settings for IE Professor Management
Optimized for AWS Elastic Beanstalk deployment with security best practices
"""

import os
import dj_database_url
from pathlib import Path

# Import base settings
from ..ie_professor_management.settings import *

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ['SECRET_KEY']

# Production hosts
ALLOWED_HOSTS = [
    host.strip() 
    for host in os.environ.get('ALLOWED_HOSTS', '').split(',') 
    if host.strip()
]

# Database configuration with DATABASE_URL support
if 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.parse(os.environ['DATABASE_URL'])
    }
else:
    # Fallback to individual environment variables
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ['DB_NAME'],
            'USER': os.environ['DB_USER'],
            'PASSWORD': os.environ['DB_PASSWORD'],
            'HOST': os.environ['DB_HOST'],
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {
                'sslmode': 'require',
            },
        }
    }

# Security settings for production
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# HSTS (HTTP Strict Transport Security) - optional but recommended
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CSRF and CORS configuration
CSRF_TRUSTED_ORIGINS = [
    origin.strip() 
    for origin in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') 
    if origin.strip()
]

CORS_ALLOWED_ORIGINS = [
    origin.strip() 
    for origin in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',') 
    if origin.strip()
]

# Static and media files
STATIC_URL = '/static/'
STATIC_ROOT = os.environ.get('STATIC_ROOT', '/vol/static')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.environ.get('MEDIA_ROOT', '/vol/media')

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'ie_professor_management': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Cache configuration (optional - use Redis/ElastiCache in production)
if 'REDIS_URL' in os.environ:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.environ['REDIS_URL'],
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }

# Email configuration for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('EMAIL_HOST_USER')

# Performance optimizations
CONN_MAX_AGE = 60  # Database connection pooling

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Admin URL (optional security through obscurity)
ADMIN_URL_PATH = os.environ.get('ADMIN_URL_PATH', 'admin')

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
