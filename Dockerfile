# Multi-stage build for optimized production image
# Stage 1: Frontend Builder
FROM node:20-slim AS frontend-builder

WORKDIR /app/ie-professors-frontend

# Copy frontend package files
COPY ie-professors-frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY ie-professors-frontend/ ./
RUN npm run build

# Stage 2: Backend Builder
FROM python:3.12-slim AS backend-builder

ENV POETRY_VERSION=1.8.3

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc \
 && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

WORKDIR /app/ie_professors_database

# Copy backend dependency files
COPY ie_professors_database/pyproject.toml ie_professors_database/poetry.lock ./
RUN poetry config virtualenvs.create false \
 && poetry lock --no-update \
 && poetry install --only=main --no-interaction --no-ansi

# Stage 3: Production Runtime
FROM python:3.12-slim

# Install system dependencies including Node.js, nginx, and supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev curl netcat-traditional \
    ca-certificates nginx supervisor \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy built frontend from builder
COPY --from=frontend-builder /app/ie-professors-frontend/.next /app/ie-professors-frontend/.next
COPY --from=frontend-builder /app/ie-professors-frontend/public /app/ie-professors-frontend/public
COPY --from=frontend-builder /app/ie-professors-frontend/package.json /app/ie-professors-frontend/package.json
COPY --from=frontend-builder /app/ie-professors-frontend/node_modules /app/ie-professors-frontend/node_modules

# Copy application source
COPY ie_professors_database/ /app/ie_professors_database/
COPY docker/ /app/docker/

# Create static and media directories
RUN mkdir -p /vol/static /vol/media

# Copy nginx configuration
COPY docker/nginx/app.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default && \
    ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Make entrypoint executable
RUN chmod +x /app/ie_professors_database/entrypoint.sh

# Expose port 80 for nginx
EXPOSE 80

# Run supervisord
WORKDIR /app
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]