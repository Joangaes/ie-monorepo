"""
Health check views for monitoring application status.
"""
import json
import os
import time
from django.http import JsonResponse
from django.db import connection
from django.conf import settings
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Simple health check endpoint that returns basic application status.
    Used by load balancers and monitoring systems.
    Reports database connection status: 'connected', 'skipped', or 'failed'
    """
    start_time = time.time()
    
    health_status = {
        "status": "healthy",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "environment": "production" if not settings.DEBUG else "development",
        "checks": {}
    }
    
    # Check database availability from settings
    database_available = os.getenv('DATABASE_AVAILABLE', 'False').lower() == 'true'
    
    if not database_available or not settings.DATABASES:
        # No database configured - this is OK, report as skipped
        health_status["checks"]["database"] = {
            "status": "skipped",
            "message": "Running in no-database mode"
        }
    else:
        # Database configured - test connectivity
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            health_status["checks"]["database"] = {
                "status": "connected",
                "engine": settings.DATABASES['default']['ENGINE'],
                "host": settings.DATABASES['default'].get('HOST', 'localhost')
            }
        except Exception as e:
            # Database connection failed - this affects health status
            health_status["status"] = "unhealthy"
            health_status["checks"]["database"] = {
                "status": "failed",
                "error": str(e)
            }
    
    # Response time check
    response_time = round((time.time() - start_time) * 1000, 2)
    health_status["checks"]["response_time"] = {
        "status": "healthy" if response_time < 1000 else "slow",
        "duration_ms": response_time
    }
    
    # Application is healthy even without database (graceful degradation)
    status_code = 200 if health_status["status"] == "healthy" else 503
    
    return JsonResponse(health_status, status=status_code)


@csrf_exempt
@require_http_methods(["GET"])
def readiness_check(request):
    """
    Readiness probe endpoint - checks if the application is ready to serve traffic.
    More comprehensive than health check.
    """
    start_time = time.time()
    
    readiness_status = {
        "status": "ready",
        "timestamp": int(time.time()),
        "checks": {}
    }
    
    # Database migration check
    try:
        from django.core.management import execute_from_command_line
        from django.db.migrations.executor import MigrationExecutor
        from django.db import connections
        
        connection = connections['default']
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if plan:
            readiness_status["status"] = "not_ready"
            readiness_status["checks"]["migrations"] = {
                "status": "pending",
                "pending_migrations": len(plan)
            }
        else:
            readiness_status["checks"]["migrations"] = {
                "status": "up_to_date"
            }
    except Exception as e:
        readiness_status["status"] = "not_ready"
        readiness_status["checks"]["migrations"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Database connectivity (same as health check)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        readiness_status["checks"]["database"] = {
            "status": "ready"
        }
    except Exception as e:
        readiness_status["status"] = "not_ready"
        readiness_status["checks"]["database"] = {
            "status": "not_ready",
            "error": str(e)
        }
    
    # Response time
    response_time = round((time.time() - start_time) * 1000, 2)
    readiness_status["checks"]["response_time"] = {
        "duration_ms": response_time
    }
    
    status_code = 200 if readiness_status["status"] == "ready" else 503
    
    return JsonResponse(readiness_status, status=status_code)


@csrf_exempt
@require_http_methods(["GET"])
def liveness_check(request):
    """
    Liveness probe endpoint - minimal check to verify the application is running.
    Should be very lightweight and fast.
    """
    return JsonResponse({
        "status": "alive",
        "timestamp": int(time.time())
    }, status=200)
