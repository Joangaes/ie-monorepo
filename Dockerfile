# Multi-service container: Django + Next.js
FROM python:3.12-slim

# Install system dependencies including Node.js, nginx, and supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc curl netcat-traditional \
    ca-certificates gnupg nginx supervisor \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3 \
    NODE_ENV=production

WORKDIR /app

# Copy the entire repository
COPY . .

# Install Poetry and Django dependencies
WORKDIR /app/ie_professors_database
RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}" \
 && poetry config virtualenvs.create false \
 && poetry lock --no-update \
 && poetry install --only=main --no-interaction --no-ansi

# Install frontend dependencies and build Next.js at image build time
WORKDIR /app/ie-professors-frontend
RUN npm install && npm run build

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