# AWS Elastic Beanstalk Deployment Guide

This document explains the Docker Compose setup for deploying the IE University Professor Management System on AWS Elastic Beanstalk.

## Architecture Overview

The application consists of three services running in Docker containers:

1. **Django Backend** (`django` service) - Serves API endpoints and admin interface
2. **Next.js Frontend** (`next` service) - Serves the React application
3. **Nginx Reverse Proxy** (`nginx` service) - Routes requests and serves as load balancer

## Service Configuration

### Django Service
- **Port**: 8000 (internal)
- **Image**: `<ACCOUNT_ID>.dkr.ecr.eu-north-1.amazonaws.com/ie-monorepo:backend`
- **Command**: `gunicorn ie_professor_management.wsgi:application --bind 0.0.0.0:8000 --workers 3`
- **Health Check**: `http://localhost:8000/health/`

### Next.js Service  
- **Port**: 3000 (internal)
- **Image**: `<ACCOUNT_ID>.dkr.ecr.eu-north-1.amazonaws.com/ie-monorepo:frontend`
- **Command**: `npm start` (production mode)
- **Health Check**: `http://localhost:3000/`

### Nginx Service
- **Port**: 80 (exposed)
- **Image**: `nginx:alpine`
- **Configuration**: `deploy/nginx.conf`
- **Health Check**: `http://localhost:80/health`

## Request Routing

Nginx routes requests as follows:

- `/` → Next.js frontend (port 3000)
- `/admin` → Django admin interface (port 8000)
- `/api` → Django API endpoints (port 8000)
- `/health` → Django health check (port 8000)
- `/static/` → Django static files (port 8000)
- `/media/` → Django media files (port 8000)

## Environment Variables

### Required for Django
- `DJANGO_SETTINGS_MODULE=ie_professor_management.settings`
- `DEBUG=false`
- `DJANGO_ALLOWED_HOSTS` - Should include your EB environment URL and any custom domains
- `SECRET_KEY` - Django secret key
- Database connection variables (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)

### Required for Next.js
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `NEXT_PUBLIC_API_URL=/api`
- `PORT=3000`

## Deployment Steps

1. **Update Image References**: Replace `<ACCOUNT_ID>` in `docker-compose.yml` with your actual AWS account ID
2. **Set Environment Variables**: Configure all required environment variables in the EB console
3. **Deploy**: Use `eb deploy` or your CI/CD pipeline to deploy the application

## Health Checks

- **Elastic Beanstalk Health Check URL**: `/health`
- **Django Health Endpoint**: Returns `{"status": "ok"}` with no database dependency
- **Service Health Checks**: All services have Docker health checks configured

## File Structure

```
├── Dockerrun.aws.json          # EB Docker Compose v3 configuration
├── docker-compose.yml          # Multi-container Docker setup
├── deploy/
│   └── nginx.conf             # Nginx reverse proxy configuration
└── DEPLOYMENT.md              # This documentation
```

## Troubleshooting

### Common Issues

1. **400 Bad Request from Django**: Check `DJANGO_ALLOWED_HOSTS` includes your EB environment URL
2. **502 Bad Gateway**: Verify service names and ports in nginx.conf match docker-compose.yml
3. **Health Check Failures**: Ensure `/health` endpoint is accessible and returns 200 status
4. **Static Files Not Loading**: Verify nginx proxy configuration for `/static/` and `/media/` paths

### Debugging Commands

```bash
# Check service logs
eb logs

# SSH into EB instance
eb ssh

# Check container status
docker ps

# Check service logs
docker logs <container_name>
```

## Security Considerations

- Django DEBUG is set to false in production
- All services communicate internally using Docker network
- Only nginx exposes port 80 externally
- Sensitive environment variables should be set through EB console, not in compose file
