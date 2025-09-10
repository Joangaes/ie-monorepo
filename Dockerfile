# syntax=docker/dockerfile:1
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc curl netcat-traditional \
 && rm -rf /var/lib/apt/lists/*

# Poetry
RUN pip install --no-cache-dir poetry==1.8.3

WORKDIR /app

# Cache-busting arg for dependable rebuilds on EB
ARG POETRY_CACHE_BUSTER=0

# Copy ONLY backend dependency manifests first for layer caching
COPY ie_professors_database/pyproject.toml ie_professors_database/poetry.lock* ./

# Install deps into system site-packages (no venv)
RUN poetry config virtualenvs.create false \
 && poetry install --only=main --no-root --no-interaction --no-ansi \
 && python -c "import sys; print('site-packages:', next(p for p in sys.path if 'site-packages' in p))" \
 && poetry show | sed -n '1,120p'

# Copy the rest of the app AFTER installing deps
COPY ie_professors_database/ ./ie_professors_database/

# Create required directories and user
RUN mkdir -p /vol/static /vol/media /app/staticfiles && \
    groupadd -r django && useradd -r -g django django && \
    chown -R django:django /app /vol

# Set proper ownership and permissions for entrypoint
RUN chown django:django /app/ie_professors_database/entrypoint.sh && \
    chmod +x /app/ie_professors_database/entrypoint.sh

# Verify critical packages are installed (fail fast)
RUN python - <<'PY'
import importlib, shutil
for m in ("django", "gunicorn"):
    assert importlib.util.find_spec(m), f"{m} not installed"
print("✅ Django & Gunicorn installed")
print("✅ gunicorn path:", shutil.which("gunicorn"))
PY

# Switch to non-root user
USER django

# Set Django settings module and Python path
ENV DJANGO_SETTINGS_MODULE=ie_professor_management.settings
ENV PYTHONPATH=/app/ie_professors_database

ENV PORT=8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD curl -fsS http://127.0.0.1:8000/health/ || exit 1

ENTRYPOINT ["/app/ie_professors_database/entrypoint.sh"]