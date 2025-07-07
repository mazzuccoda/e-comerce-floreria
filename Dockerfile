# Build stage for Python dependencies
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements files
COPY requirements/ /app/requirements/

# Install base dependencies first
RUN pip install --no-cache-dir -r requirements/base.txt

# Development stage
FROM python:3.11-slim as development

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app" \
    PATH="/home/appuser/.local/bin:$PATH" \
    DJANGO_SETTINGS_MODULE="floreria_cristina.settings"

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && mkdir -p /app/static /app/media /app/logs /app/staticfiles/CACHE \
    && chown -R appuser:appuser /app \
    && chmod -R 755 /app/staticfiles

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    gettext \
    && rm -rf /var/lib/apt/lists/*

# Copy from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Set working directory
WORKDIR /app

# Copy application code and requirements
COPY --chown=appuser:appuser . /app/
COPY --chown=appuser:appuser requirements/ /app/requirements/

# Install base and development dependencies as root
USER root
RUN pip install --no-cache-dir -r requirements/base.txt && \
    pip install --no-cache-dir -r requirements/local.txt

# Switch back to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Final production stage
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app" \
    PATH="/home/appuser/.local/bin:$PATH" \
    DJANGO_SETTINGS_MODULE="floreria_cristina.settings"

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && mkdir -p /app/static /app/media /app/logs /app/staticfiles/CACHE \
    && chown -R appuser:appuser /app \
    && chmod -R 755 /app/staticfiles

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    gettext \
    && rm -rf /var/lib/apt/lists/*

# Copy from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Set working directory
WORKDIR /app

# Copy application code and requirements
COPY --chown=appuser:appuser . /app/
COPY --chown=appuser:appuser requirements/ /app/requirements/

# Install production dependencies as root
USER root
RUN pip install --no-cache-dir -r requirements/base.txt \
    && apt-get update && apt-get install -y --no-install-recommends nodejs npm \
    && npm install --omit=dev \
    && mkdir -p /app/static/css /app/static/js /app/static/fonts \
    && cp -r node_modules/bootstrap/dist/css/* /app/static/css/ \
    && cp -r node_modules/bootstrap/dist/js/* /app/static/js/ \
    && cp node_modules/bootstrap-icons/font/bootstrap-icons.css /app/static/css/ \
    && sed -i 's|url("./fonts/|url("../fonts/|g' /app/static/css/bootstrap-icons.css \
    && cp -r node_modules/bootstrap-icons/font/fonts/* /app/static/fonts/ \
    && rm -rf node_modules /var/lib/apt/lists/*

# Install local requirements if they exist
RUN if [ -f requirements/local.txt ]; then pip install --no-cache-dir -r requirements/local.txt; fi

# Collect static files
# Switch to non-root user
USER appuser

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "floreria_cristina.wsgi:application"]
