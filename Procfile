web: python manage.py migrate && python manage.py crear_plantillas_notificaciones || echo "⚠️ Plantillas ya existen o hubo error" && gunicorn floreria_cristina.wsgi:application --bind 0.0.0.0:$PORT
