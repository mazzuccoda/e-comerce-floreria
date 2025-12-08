# Script PowerShell para desplegar el sistema de zonas de envío
# Ejecutar con: .\deploy_shipping_zones.ps1

Write-Host "🚀 Desplegando Sistema de Zonas de Envío..." -ForegroundColor Cyan
Write-Host ""

# 1. Crear migraciones
Write-Host "📝 Paso 1: Creando migraciones..." -ForegroundColor Yellow
docker compose exec web python manage.py makemigrations pedidos

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migraciones creadas" -ForegroundColor Green
} else {
    Write-Host "❌ Error al crear migraciones" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Aplicar migraciones
Write-Host "📦 Paso 2: Aplicando migraciones..." -ForegroundColor Yellow
docker compose exec web python manage.py migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migraciones aplicadas" -ForegroundColor Green
} else {
    Write-Host "❌ Error al aplicar migraciones" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Inicializar datos
Write-Host "🗺️ Paso 3: Inicializando datos de zonas..." -ForegroundColor Yellow
docker compose exec web python setup_shipping_zones.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Datos inicializados" -ForegroundColor Green
} else {
    Write-Host "❌ Error al inicializar datos" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Reiniciar servicios
Write-Host "🔄 Paso 4: Reiniciando servicios..." -ForegroundColor Yellow
docker compose restart web

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Servicios reiniciados" -ForegroundColor Green
} else {
    Write-Host "❌ Error al reiniciar servicios" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ DESPLIEGUE COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Verificar endpoints:"
Write-Host "     curl http://localhost:8000/api/pedidos/shipping/config/"
Write-Host ""
Write-Host "  2. Acceder al admin:"
Write-Host "     http://localhost:8000/admin/"
Write-Host ""
Write-Host "  3. Hacer commit y push:"
Write-Host "     git add ."
Write-Host "     git commit -m 'feat: Sistema de zonas de envío con Distance Matrix API'"
Write-Host "     git push origin master"
Write-Host ""
