FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry==1.8.3

# Configure Poetry
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /app

# Copy Poetry configuration files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry install --only=main --no-root && rm -rf $POETRY_CACHE_DIR

# Copy application code
COPY . .

# Create staticfiles directory
RUN mkdir -p /app/staticfiles

# Collect static files
RUN poetry run python manage.py collectstatic --noinput

# Create non-root user
RUN groupadd -r django && useradd -r -g django django
RUN chown -R django:django /app
USER django

ENV PORT=8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8000/admin/login/ || exit 1

# Run Gunicorn
CMD ["poetry", "run", "gunicorn", "ie_professor_management.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-"]
