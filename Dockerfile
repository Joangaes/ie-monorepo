# Multi-stage Docker build for IE University Docker platform
# This Dockerfile orchestrates backend + frontend builds for EB deployment

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY ie-professors-frontend/package*.json ./
RUN npm ci
COPY ie-professors-frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM python:3.12-slim AS backend-builder
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    curl \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry==1.8.3

# Configure Poetry for production
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

# Copy Poetry configuration files
COPY ie_professors_database/pyproject.toml ie_professors_database/poetry.lock* ./

# Install dependencies (production only)
RUN if [ ! -f poetry.lock ] || ! poetry check; then \
        echo "Regenerating poetry.lock file..." && \
        poetry lock; \
    fi && \
    poetry install --only=main --no-root && \
    rm -rf $POETRY_CACHE_DIR

# Stage 3: Production image
FROM python:3.12-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    netcat-traditional \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r app && useradd -r -g app app

# Set up working directory
WORKDIR /app

# Copy Poetry and virtual environment from builder
COPY --from=backend-builder /app/.venv /app/.venv
COPY --from=backend-builder /usr/local/bin/poetry /usr/local/bin/poetry

# Copy backend application
COPY ie_professors_database/ ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/out /app/staticfiles/frontend

# Create required directories
RUN mkdir -p /vol/static /vol/media /app/staticfiles && \
    chown -R app:app /app /vol

# Copy nginx configuration
COPY infra/nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY ie_professors_database/infra/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER app

# Environment variables
ENV PORT=8000
ENV PATH="/app/.venv/bin:$PATH"

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD curl -fsS http://127.0.0.1:8000/admin/login/ || exit 1

# Start application
ENTRYPOINT ["/app/entrypoint.sh"]
