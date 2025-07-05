@echo off
echo Deteniendo y eliminando contenedores si existen...
docker-compose down -v

echo Iniciando los servicios...
docker-compose up -d

echo Esperando a que la base de datos esté lista...
timeout /t 10 /nobreak >nul

echo Verificando si la base de datos existe...
for /f "tokens=*" %%a in ('docker-compose exec -T db psql -U floradmin -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = 'floreria_cristina';" 2^>^&1') do set DB_EXISTS=%%a
set DB_EXISTS=%DB_EXISTS: =%

if "%DB_EXISTS%"=="1" (
    echo La base de datos ya existe.
) else (
    echo La base de datos no existe, creándola...
    
    echo Creando la base de datos...
    docker-compose exec -T db psql -U floradmin -d postgres -c "CREATE DATABASE floreria_cristina;"
    
    echo Aplicando migraciones...
    docker-compose exec web python manage.py migrate
    
    echo Creando superusuario...
    docker-compose exec -T web python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin')" || echo El superusuario ya existe o no se pudo crear.
    
    echo Base de datos creada y configurada correctamente.
)

echo La aplicación está lista en http://localhost:8000
pause
