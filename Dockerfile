# Multi-service container: Django + Next.js
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY ie-professors-frontend/package.json ie-professors-frontend/package-lock.json* ./
RUN npm install

COPY ie-professors-frontend/ ./
RUN npm run build

# Main container with Python + Node
FROM python:3.12-slim

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc curl netcat-traditional \
    ca-certificates gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3 \
    NODE_ENV=production

WORKDIR /app

# Install Poetry and Django dependencies
COPY ie_professors_database/pyproject.toml ie_professors_database/poetry.lock* ./
RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}" \
 && poetry config virtualenvs.create false \
 && poetry install --only=main --no-interaction --no-ansi

# Copy Django backend
COPY ie_professors_database/ ./

# Create static directories and collect Django static files
RUN mkdir -p /vol/static /vol/media && \
    python manage.py collectstatic --noinput --verbosity=2

# Copy built Next.js frontend
COPY --from=frontend-builder /app/.next/standalone ./nextjs/
COPY --from=frontend-builder /app/.next/static ./nextjs/.next/static/
COPY --from=frontend-builder /app/public ./nextjs/public/

# Install supervisor for process management
RUN pip install supervisor

# Create supervisor configuration
RUN echo '[supervisord]\n\
nodaemon=true\n\
user=root\n\
\n\
[program:django]\n\
command=/app/start-django.sh\n\
directory=/app\n\
autostart=true\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
\n\
[program:nextjs]\n\
command=/app/start-nextjs.sh\n\
directory=/app/nextjs\n\
autostart=true\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0' > /etc/supervisor/conf.d/supervisord.conf

# Create startup scripts
RUN echo '#!/bin/bash\n\
set -e\n\
echo "=== Django Container Startup ==="\n\
echo "Timestamp: $(date)"\n\
echo "Environment variables:"\n\
env | grep -E "(DB_|DATABASE_|SECRET_|DEBUG)" || echo "No DB env vars found"\n\
echo ""\n\
echo "Testing database connection..."\n\
python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print(\"✅ Database connection successful!\"); print(\"Database:\", connection.settings_dict[\"NAME\"]); print(\"Host:\", connection.settings_dict[\"HOST\"])"\n\
echo ""\n\
echo "Running Django migrations..."\n\
python manage.py migrate --noinput --verbosity=2\n\
echo ""\n\
echo "Creating superuser if needed..."\n\
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username=\"root\").exists() or User.objects.create_superuser(\"root\", \"admin@example.com\", \"password\")"\n\
echo ""\n\
echo "✅ Django setup completed successfully!"\n\
echo "Starting Gunicorn on 0.0.0.0:8000..."\n\
exec gunicorn ie_professor_management.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120 --access-logfile - --error-logfile -' > /app/start-django.sh && \
    chmod +x /app/start-django.sh

RUN echo '#!/bin/bash\n\
set -e\n\
echo "=== Next.js Container Startup ==="\n\
echo "Timestamp: $(date)"\n\
echo "Starting Next.js on 0.0.0.0:3000..."\n\
exec node server.js' > /app/start-nextjs.sh && \
    chmod +x /app/start-nextjs.sh

EXPOSE 8000 3000

# Health check for Django (EB will use this)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD curl -fsS http://127.0.0.1:8000/health/ || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]