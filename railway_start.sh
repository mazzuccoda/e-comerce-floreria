#!/bin/bash
set -e  # Exit on error
set -x  # Print commands (verbose)

echo "============================================"
echo "🚀 RAILWAY STARTUP SCRIPT"
echo "============================================"

# 1. Health Check
echo "📋 Step 1: Health Check"
python healthcheck.py || {
    echo "❌ Health check failed"
    exit 1
}

# 2. Migrations
echo "📋 Step 2: Running Migrations"
python manage.py migrate --noinput || {
    echo "❌ Migrations failed"
    exit 1
}

# 3. Collect Static Files (should be done in build, but just in case)
echo "📋 Step 3: Collecting Static Files"
python manage.py collectstatic --noinput --clear || {
    echo "⚠️  Collectstatic failed (non-critical)"
}

# 4. Start Gunicorn
echo "📋 Step 4: Starting Gunicorn"
echo "   Port: ${PORT:-8000}"
echo "   Workers: 2"
echo "   Timeout: 120s"
echo "============================================"

exec gunicorn floreria_cristina.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --worker-class sync \
    --timeout 120 \
    --log-level debug \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --enable-stdio-inheritance
