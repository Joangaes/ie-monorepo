FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# OS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc curl netcat-traditional \
 && rm -rf /var/lib/apt/lists/*

# Poetry
RUN pip install --no-cache-dir poetry==1.8.3

# Work in /app BEFORE copying deps
WORKDIR /app

# Copy only dependency files first (from backend folder) into /app
COPY ie_professors_database/pyproject.toml ie_professors_database/poetry.lock* /app/

# Sanity: prove files exist where Poetry runs (helps diagnose on EB)
RUN ls -la /app && grep -E "^\[tool\.poetry\]" -n /app/pyproject.toml

# Bust any stale cache on EB (bump this value when you redeploy)
ARG CACHE_BUST=2025-09-10-13-40
RUN echo "CACHE_BUST=$CACHE_BUST"

# Install ALL groups so django/gunicorn aren't skipped
RUN poetry config virtualenvs.create false \
 && poetry install --no-root \
 && rm -rf /tmp/poetry_cache

# Now copy the backend source
COPY ie_professors_database/ /app/

# Verify imports fail-fast during build if deps aren’t present
RUN python - <<'PY'
import sys
try:
    import django, gunicorn
    import django.conf
    print("OK: django & gunicorn import")
except Exception as e:
    print("IMPORT ERROR:", e, file=sys.stderr)
    raise
PY

EXPOSE 8000
CMD ["gunicorn", "ie_professors_database.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
