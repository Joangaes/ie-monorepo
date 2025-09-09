# Docker Deployment Guide

This guide provides Docker configurations for the IE Professors Management system, consisting of two separate repositories:

- **ie_professors_database** (Django backend with Gunicorn)
- **ie-professors-frontend** (Next.js frontend)

## Prerequisites

- Docker and Docker Compose installed
- Existing PostgreSQL database (configured in production)
- Existing Nginx reverse proxy (configured in production)

## Backend (Django API) - ie_professors_database

### Building the Image

```bash
cd ie_professors_database
docker build -t ie-professors-api:latest .
```

### Running the Container

```bash
docker run -d \
  --name ie-professors-api \
  -p 8000:8000 \
  -e SECRET_KEY="your-secret-key-here" \
  -e DEBUG="False" \
  -e ALLOWED_HOSTS="ie-university-professors.scalewave.es,localhost" \
  -e DB_NAME="your_db_name" \
  -e DB_USER="your_db_user" \
  -e DB_PASSWORD="your_db_password" \
  -e DB_HOST="your_db_host" \
  -e DB_PORT="5432" \
  -e EMAIL_HOST_USER="your_email@gmail.com" \
  -e EMAIL_HOST_PASSWORD="your_email_password" \
  ie-professors-api:latest
```

### Environment Variables

The backend requires these environment variables:

- `SECRET_KEY`: Django secret key for production
- `DEBUG`: Set to "False" for production
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `DB_NAME`: PostgreSQL database name
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port (usually 5432)
- `EMAIL_HOST_USER`: Gmail account for sending emails
- `EMAIL_HOST_PASSWORD`: Gmail app password

## Frontend (Next.js) - ie-professors-frontend

### Building the Image

```bash
cd ie-professors-frontend
docker build -t ie-professors-web:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://api.your-domain.com .
```

### Running the Container

```bash
docker run -d \
  --name ie-professors-web \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://api.your-domain.com \
  ie-professors-web:latest
```

### Build Arguments

- `NEXT_PUBLIC_API_URL`: The URL where your Django API is accessible (build-time)

### Environment Variables

- `NODE_ENV`: Set to "production"
- `NEXT_PUBLIC_API_URL`: API URL for client-side requests

## Production Deployment

### Docker Compose Example

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  api:
    image: ie-professors-api:latest
    container_name: ie-professors-api
    restart: unless-stopped
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=False
      - ALLOWED_HOSTS=ie-university-professors.scalewave.es,localhost
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - EMAIL_HOST_USER=${EMAIL_HOST_USER}
      - EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD}
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/admin/login/"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    image: ie-professors-web:latest
    container_name: ie-professors-web
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.your-domain.com
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - api
```

### Nginx Configuration

Add this to your existing Nginx configuration:

```nginx
# Upstream definitions
upstream ie_professors_api {
    server 127.0.0.1:8000;  # Adjust IP if containers are on different host
}

upstream ie_professors_web {
    server 127.0.0.1:3000;  # Adjust IP if containers are on different host
}

server {
    listen 80;
    server_name ie-university-professors.scalewave.es;

    # API routes
    location /api/ {
        proxy_pass http://ie_professors_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Admin routes (Django admin)
    location /admin/ {
        proxy_pass http://ie_professors_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Static files (Django)
    location /static/ {
        proxy_pass http://ie_professors_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # All other routes go to Next.js
    location / {
        proxy_pass http://ie_professors_web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

## Deployment Steps

1. **Build the images:**
   ```bash
   # Backend
   cd ie_professors_database
   docker build -t ie-professors-api:latest .
   
   # Frontend
   cd ../ie-professors-frontend
   docker build -t ie-professors-web:latest \
     --build-arg NEXT_PUBLIC_API_URL=https://ie-university-professors.scalewave.es .
   ```

2. **Create environment file (.env):**
   ```bash
   SECRET_KEY=your-very-secure-secret-key
   DB_NAME=ie_professors
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=your_db_host
   DB_PORT=5432
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=your_app_password
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Verify deployment:**
   ```bash
   docker-compose ps
   docker-compose logs api
   docker-compose logs web
   ```

## Health Checks

Both containers include health checks:

- **API**: Checks Django admin login page (`/admin/login/`)
- **Web**: Checks Next.js homepage (`/`)

## Troubleshooting

### Common Issues

1. **Database connection issues**: Verify DB environment variables and network connectivity
2. **Static files not loading**: Ensure `collectstatic` runs successfully during build
3. **CORS errors**: Check `CORS_ALLOWED_ORIGINS` in Django settings
4. **Build failures**: Ensure all dependencies are properly specified

### Logs

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f web

# Execute commands in running containers
docker-compose exec api python manage.py shell
docker-compose exec web /bin/sh
```

### Rebuilding

```bash
# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Security Notes

- Never commit `.env` files with real credentials
- Use strong, unique secret keys
- Ensure HTTPS is configured in your Nginx setup
- Regularly update base images for security patches
- Consider using Docker secrets for production credentials
