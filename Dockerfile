FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc curl netcat-traditional \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY ie_professors_database/pyproject.toml /app/pyproject.toml
COPY ie_professors_database/poetry.lock /app/poetry.lock

# Cache buster for EB deployments (update timestamp on each deploy)
ARG CACHE_BUST=2025-09-10-15-35
RUN echo "CACHE_BUST=$CACHE_BUST"

RUN pip install --no-cache-dir poetry==1.8.3 \
 && poetry lock --no-update \
 && poetry install --no-root --no-ansi

# Sanity: fail-fast if deps missing
RUN python - <<'PY'
import django, gunicorn
print("OK:", django.get_version())
PY

COPY ie_professors_database/ /app/

EXPOSE 8000
CMD ["gunicorn", "ie_professor_management.wsgi:application", "--bind", "0.0.0.0:8000"]
