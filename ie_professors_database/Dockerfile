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
COPY pyproject.toml poetry.lock* ./

# Install dependencies (production only)
# Generate lock file if missing or out of sync, then install
RUN if [ ! -f poetry.lock ] || ! poetry check; then \
        echo "Regenerating poetry.lock file..." && \
        poetry lock; \
    fi && \
    poetry install --only=main --no-root && \
    rm -rf $POETRY_CACHE_DIR

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p /vol/static /vol/media /app/staticfiles

# Create non-root user
RUN groupadd -r django && useradd -r -g django django
RUN chown -R django:django /app /vol
USER django

# Copy and make entrypoint executable
COPY --chown=django:django infra/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PORT=8000
EXPOSE 8000

# Health check - check Django admin login page
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD curl -fsS http://127.0.0.1:8000/admin/login/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]