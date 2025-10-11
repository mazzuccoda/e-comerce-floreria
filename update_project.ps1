# Script para actualizar y reconstruir todos los contenedores del proyecto
Write-Host "=== Actualizando el proyecto Florería Cristina ===" -ForegroundColor Green

# Detener todos los contenedores
Write-Host "Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose down

# Limpiar las imágenes antiguas (opcional - descomentar si es necesario)
# Write-Host "Limpiando imágenes sin usar..." -ForegroundColor Yellow
# docker image prune -f

# Reconstruir todas las imágenes
Write-Host "Reconstruyendo todas las imágenes..." -ForegroundColor Yellow
docker-compose build --no-cache web
docker-compose build --no-cache frontend
docker-compose build --no-cache celery_worker
docker-compose build --no-cache celery_beat

# Iniciar todos los servicios
Write-Host "Iniciando servicios..." -ForegroundColor Yellow
docker-compose up -d

# Verificar que los servicios estén en funcionamiento
Write-Host "Verificando servicios..." -ForegroundColor Yellow
docker-compose ps

Write-Host "=== Actualización completada ===" -ForegroundColor Green
Write-Host "La aplicación está disponible en:" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost/api/" -ForegroundColor Cyan
Write-Host "- Admin: http://localhost/admin/" -ForegroundColor Cyan

Write-Host "Para ver los logs de los servicios:" -ForegroundColor Yellow
Write-Host "docker-compose logs -f" -ForegroundColor Gray
