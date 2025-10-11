Write-Host "=== Iniciando despliegue local de Florería Cristina ===" -ForegroundColor Green

Write-Host "Verificando Docker..." -ForegroundColor Yellow
docker --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

Write-Host "Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose down

Write-Host "Construyendo las imágenes..." -ForegroundColor Yellow
docker-compose build

Write-Host "Iniciando servicios..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "Verificando servicios..." -ForegroundColor Yellow
docker-compose ps

Write-Host "=== Despliegue local completado ===" -ForegroundColor Green
Write-Host "La aplicación está disponible en:" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost:3000"
Write-Host "- Backend API: http://localhost:8000"
Write-Host ""
Write-Host "Para ver los logs de los servicios:"
Write-Host "docker-compose logs -f"
