#!/usr/bin/env python
"""
Railway startup script - Python version (more reliable than bash)
"""
import os
import sys
import subprocess

def run_command(cmd, description, critical=True):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"📋 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        print(result.stdout)
        print(f"✅ {description} - SUCCESS")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - FAILED")
        print(f"Error: {e.stdout}")
        if critical:
            sys.exit(1)
        return False

def main():
    print("\n" + "="*60)
    print("🚀 RAILWAY STARTUP SCRIPT (Python)")
    print("="*60)
    
    # 1. Health Check
    run_command("python healthcheck.py", "Step 1: Health Check", critical=True)
    
    # 2. Migrations
    run_command("python manage.py migrate --noinput", "Step 2: Database Migrations", critical=True)
    
    # 3. Collect Static (optional)
    run_command("python manage.py collectstatic --noinput --clear", "Step 3: Collect Static Files", critical=False)
    
    # 4. Start Gunicorn
    port = os.environ.get('PORT', '8000')
    print(f"\n{'='*60}")
    print(f"📋 Step 4: Starting Gunicorn")
    print(f"   Port: {port}")
    print(f"   Workers: 2")
    print(f"   Timeout: 120s")
    print(f"{'='*60}\n")
    
    # Use exec to replace this process with gunicorn
    gunicorn_cmd = [
        "gunicorn",
        "floreria_cristina.wsgi:application",
        "--bind", f"0.0.0.0:{port}",
        "--workers", "2",
        "--worker-class", "sync",
        "--timeout", "120",
        "--log-level", "info",
        "--access-logfile", "-",
        "--error-logfile", "-",
        "--capture-output",
        "--enable-stdio-inheritance"
    ]
    
    print(f"Executing: {' '.join(gunicorn_cmd)}\n")
    os.execvp("gunicorn", gunicorn_cmd)

if __name__ == "__main__":
    main()
