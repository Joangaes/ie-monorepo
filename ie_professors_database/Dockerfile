FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc curl netcat-traditional \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==1.8.3

WORKDIR /app

# Copy dependency files first for better caching
COPY pyproject.toml poetry.lock* /app/

# Install deps (install all groups to ensure gunicorn is present)
RUN poetry config virtualenvs.create false \
 && poetry install --no-root

# Copy source
COPY . /app/

# Create static directories and collect static files
RUN mkdir -p /vol/static /vol/media && \
    python manage.py collectstatic --noinput --verbosity=2

# Sanity check
RUN python -c "import django, gunicorn; print('deps ok')"

# Create entrypoint script for migrations + server start
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Running Django migrations..."\n\
python manage.py migrate --noinput\n\
echo "Starting Gunicorn..."\n\
exec gunicorn ie_professor_management.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD curl -fsS http://127.0.0.1:8000/health/ || exit 1

CMD ["/entrypoint.sh"]
