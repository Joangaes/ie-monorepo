FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        netcat-openbsd \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ie_professors_database/pyproject.toml ie_professors_database/poetry.lock* ./
RUN pip install --no-cache-dir poetry \
    && poetry config virtualenvs.create false \
    && poetry lock \
    && poetry install --only=main --no-root --no-interaction --no-ansi

# Copy project
COPY ie_professors_database/ .

# Create volumes for static and media files
RUN mkdir -p /vol/static /vol/media
RUN chown -R nobody:nogroup /vol && chmod -R 755 /vol

# Make entrypoint executable
COPY ie_professors_database/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Switch to non-root user
USER nobody

# Expose port
EXPOSE 8000

# Run entrypoint
ENTRYPOINT ["/entrypoint.sh"]

