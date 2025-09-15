FROM python:3.12-slim

WORKDIR /app

# System deps (psycopg2 etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc curl netcat-traditional \
 && rm -rf /var/lib/apt/lists/*

# Copy backend code
COPY ie_professors_database/ /app/

# Install Python deps
# Expect a pyproject.toml/poetry.lock OR requirements.txt in ie_professors_database
# Prefer Poetry if present; otherwise use pip
RUN if [ -f pyproject.toml ]; then \
      pip install --no-cache-dir "poetry==1.8.3" && \
      poetry config virtualenvs.create false && \
      poetry install --only=main --no-interaction --no-ansi ; \
    elif [ -f requirements.txt ]; then \
      pip install --no-cache-dir -r requirements.txt ; \
    else \
      echo "No dependency file found" && exit 1 ; \
    fi

EXPOSE 8000

# Default CMD is set by Dockerrun command array (gunicorn). Keep container lean.