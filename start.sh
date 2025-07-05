#!/bin/bash

# Detener y eliminar contenedores si existen
docker-compose down -v

# Iniciar los servicios
docker-compose up -d

# Esperar a que el servicio de base de datos esté listo
echo "Esperando a que la base de datos esté lista..."
sleep 10

# Verificar si la base de datos existe
db_exists=$(docker-compose exec -T db psql -U floradmin -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = 'floreria_cristina';" | tr -d '[:space:]')

if [ "$db_exists" != "1" ]; then
  echo "La base de datos no existe, creándola..."
  # Crear la base de datos manualmente
  docker-compose exec -T db psql -U floradmin -d postgres -c "CREATE DATABASE floreria_cristina;"
  
  # Aplicar migraciones
  docker-compose exec web python manage.py migrate
  
  # Crear superusuario (opcional, descomenta si lo necesitas)
  # docker-compose exec web python manage.py createsuperuser --noinput --username admin --email admin@example.com
  
  # Cargar datos iniciales (si los tienes)
  # docker-compose exec web python manage.py loaddata initial_data.json
  
  echo "Base de datos creada y configurada correctamente."
else
  echo "La base de datos ya existe."
fi

echo "La aplicación está lista en http://localhost:8000"
