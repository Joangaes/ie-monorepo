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

# Configure Poetry to install globally (not in venv)
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=0 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /app

# Copy Poetry configuration files to the correct location
COPY ie_professors_database/pyproject.toml ie_professors_database/poetry.lock* ./

# Force rebuild cache buster
ARG FORCE_REBUILD=0

# Debug: Show what files we have
RUN echo "=== Debug: Files in current directory ===" && \
    ls -la && \
    echo "=== pyproject.toml contents ===" && \
    cat pyproject.toml && \
    echo "=== Poetry config ===" && \
    poetry config --list

# Install dependencies globally using Poetry
RUN echo "Installing dependencies with Poetry..." && \
    poetry config virtualenvs.create false && \
    poetry config virtualenvs.in-project false && \
    if [ ! -f poetry.lock ] || ! poetry check; then \
        echo "Regenerating poetry.lock file..." && \
        poetry lock; \
    fi && \
    echo "Running poetry install..." && \
    poetry install --only=main --no-root --no-interaction --no-ansi --verbose && \
    echo "Poetry install completed" && \
    rm -rf $POETRY_CACHE_DIR

# Safety fallback - ensure Django and Gunicorn are installed
RUN echo "Installing critical packages as safety fallback..." && \
    pip install --no-cache-dir django gunicorn

# Verify critical packages are installed
RUN echo "Verifying installations..." && \
    python -c "import django; print(f'✅ Django {django.get_version()} installed')" && \
    python -c "import gunicorn; print('✅ Gunicorn installed')" && \
    which gunicorn && \
    echo "✅ All critical packages verified"

# Create required directories and non-root user
RUN mkdir -p /vol/static /vol/media /app/staticfiles && \
    groupadd -r django && useradd -r -g django django

# Copy application code
COPY ie_professors_database/ ./

# Set proper ownership and permissions
RUN chown -R django:django /app /vol && \
    chmod +x /app/entrypoint.sh

# Switch to non-root user
USER django

# Set Django settings module
ENV DJANGO_SETTINGS_MODULE=ie_professor_management.settings
ENV PYTHONPATH=/app

ENV PORT=8000
EXPOSE 8000

# Health check - simple HTTP check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD curl -fsS http://127.0.0.1:8000/health/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
