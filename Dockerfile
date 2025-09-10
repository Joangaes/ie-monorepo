# Production Django container with Poetry and Gunicorn
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies including netcat for health checks
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

WORKDIR /app

# Copy Poetry configuration files
COPY ie_professors_database/pyproject.toml ie_professors_database/poetry.lock* ./

# Install dependencies (production only)
# Generate lock file if missing or out of sync, then install
RUN if [ ! -f poetry.lock ] || ! poetry check; then \
        echo "Regenerating poetry.lock file..." && \
        poetry lock; \
    fi && \
    poetry install --only=main --no-root && \
    rm -rf $POETRY_CACHE_DIR

# Create required directories and non-root user first
RUN mkdir -p /vol/static /vol/media /app/staticfiles && \
    groupadd -r django && useradd -r -g django django && \
    chown -R django:django /app /vol

# Copy application code (do this last for better caching)
COPY ie_professors_database/ ./

# Ensure entrypoint script has correct permissions
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER django

ENV PORT=8000
EXPOSE 8000

# Health check - check Django admin login page
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD curl -fsS http://127.0.0.1:8000/admin/login/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
