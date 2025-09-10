# Simple, reliable build: copy the entire backend app
FROM python:3.12-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc curl netcat-traditional \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3

# Work in /app
WORKDIR /app

# Copy the whole backend codebase (includes manage.py, pyproject.toml, poetry.lock, app code)
COPY ie_professors_database/ /app/

# Install Poetry + deps into the system environment (no venvs inside container)
RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}" \
 && poetry config virtualenvs.create false \
 && poetry install --only=main --no-interaction --no-ansi

# Collect static (safe if STATIC_ROOT is set in settings; otherwise this no-ops)
RUN python manage.py collectstatic --noinput || true

# Expose app port
EXPOSE 8000

# (Optional) Healthcheck; change path if your app defines another endpoint
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:8000/health/ || exit 1

# Start Gunicorn. Replace <DJANGO_PROJECT_NAME> if different.
CMD ["gunicorn", "ie_professor_management.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
