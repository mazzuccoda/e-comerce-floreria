#!/usr/bin/env python
"""
Health check script para Railway - Identifica problemas de configuración
"""

import sys
import os

def check_environment():
    """Verifica variables de entorno críticas"""
    required_vars = [
        'SECRET_KEY',
        'DATABASE_URL',
    ]
    
    optional_vars = [
        'DEBUG',
        'ALLOWED_HOSTS',
        'RAILWAY_ENVIRONMENT',
        'PORT',
    ]
    
    print("=" * 60)
    print("🔍 RAILWAY HEALTH CHECK")
    print("=" * 60)
    
    # Verificar variables requeridas
    print("\n✅ Variables REQUERIDAS:")
    all_required_present = True
    for var in required_vars:
        value = os.environ.get(var)
        if value:
            # Mostrar solo los primeros 10 caracteres por seguridad
            display_value = value[:10] + "..." if len(value) > 10 else value
            print(f"  ✅ {var}: {display_value}")
        else:
            print(f"  ❌ {var}: NO CONFIGURADA")
            all_required_present = False
    
    # Verificar variables opcionales
    print("\nℹ️  Variables OPCIONALES:")
    for var in optional_vars:
        value = os.environ.get(var)
        if value:
            print(f"  ✅ {var}: {value}")
        else:
            print(f"  ⚠️  {var}: no configurada (usando default)")
    
    print("\n" + "=" * 60)
    
    if not all_required_present:
        print("❌ FALTAN VARIABLES CRÍTICAS")
        print("   Agrega las variables faltantes en Railway Settings → Variables")
        return False
    
    return True

def check_django_settings():
    """Verifica que Django settings se pueda importar"""
    print("\n🔍 Verificando Django Settings...")
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
        import django
        django.setup()
        print("  ✅ Django settings cargado correctamente")
        return True
    except Exception as e:
        print(f"  ❌ Error al cargar Django settings: {e}")
        return False

def check_database():
    """Verifica conexión a la base de datos"""
    print("\n🔍 Verificando conexión a Base de Datos...")
    try:
        from django.db import connection
        connection.ensure_connection()
        print("  ✅ Conexión a database OK")
        return True
    except Exception as e:
        print(f"  ❌ Error de conexión a database: {e}")
        return False

def check_wsgi():
    """Verifica que WSGI application se pueda importar"""
    print("\n🔍 Verificando WSGI Application...")
    try:
        from floreria_cristina.wsgi import application
        print("  ✅ WSGI application importada correctamente")
        print(f"  ℹ️  Application type: {type(application)}")
        return True
    except Exception as e:
        print(f"  ❌ Error al importar WSGI application: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Ejecuta todos los checks"""
    checks = [
        ("Environment Variables", check_environment),
        ("Django Settings", check_django_settings),
        ("Database Connection", check_database),
        ("WSGI Application", check_wsgi),
    ]
    
    results = {}
    for name, check_func in checks:
        try:
            results[name] = check_func()
        except Exception as e:
            print(f"\n❌ Error inesperado en {name}: {e}")
            results[name] = False
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN")
    print("=" * 60)
    
    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 Todos los checks pasaron. La aplicación debería funcionar.")
        return 0
    else:
        print("\n❌ Algunos checks fallaron. Revisa los errores arriba.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
