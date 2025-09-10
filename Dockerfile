# syntax=docker/dockerfile:1
FROM python:3.12-slim

# Cache buster for EB deployments
ARG APP_BUILD_ID=dev

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

# Copy dependency manifests explicitly for cache busting
COPY ie_professors_database/pyproject.toml ./pyproject.toml
COPY ie_professors_database/poetry.lock ./poetry.lock

# Install dependencies with verbose output and cache busting
RUN poetry config virtualenvs.create false \
 && (poetry check || poetry lock) \
 && poetry install --only=main --no-root --no-interaction --no-ansi -vvv

# Copy the entire backend project
COPY ie_professors_database/ ./ie_professors_database/

# Add build label for cache busting
LABEL build-id=${APP_BUILD_ID}

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
# Check core dependencies
for m in ("django", "gunicorn"):
    assert importlib.util.find_spec(m), f"{m} not installed"
# Check that our Django project can be imported
assert importlib.util.find_spec("ie_professor_management"), "ie_professor_management package not installed"
print("✅ Django & Gunicorn installed")
print("✅ IE Professor Management package installed")
print("✅ gunicorn path:", shutil.which("gunicorn"))
PY

# Switch to non-root user
USER django

# Set Django settings module and Python path
ENV DJANGO_SETTINGS_MODULE=ie_professor_management.settings
ENV PYTHONPATH=/app

ENV PORT=8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD curl -fsS http://127.0.0.1:8000/health/ || exit 1

ENTRYPOINT ["/app/ie_professors_database/entrypoint.sh"]